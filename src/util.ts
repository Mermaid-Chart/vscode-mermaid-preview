import { Disposable, Event, EventEmitter, authentication } from "vscode";
import { createHash } from "crypto";
import * as vscode from "vscode";
import { MermaidChartVSCode } from "./mermaidChartVSCode";
import {
  MermaidChartProvider,
  ITEM_TYPE_DOCUMENT,
} from "./mermaidChartProvider";

export interface PromiseAdapter<T, U> {
  (
    value: T,
    resolve: (value: U | PromiseLike<U>) => void,
    reject: (reason: any) => void
  ): any;
}

const passthrough = (value: any, resolve: (value?: any) => void) =>
  resolve(value);

/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export function promiseFromEvent<T, U>(
  event: Event<T>,
  adapter: PromiseAdapter<T, U> = passthrough
): { promise: Promise<U>; cancel: EventEmitter<void> } {
  let subscription: Disposable;
  let cancel = new EventEmitter<void>();

  return {
    promise: new Promise<U>((resolve, reject) => {
      cancel.event((_) => reject("Cancelled"));
      subscription = event((value: T) => {
        try {
          Promise.resolve(adapter(value, resolve, reject)).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    }).then(
      (result: U) => {
        subscription.dispose();
        return result;
      },
      (error) => {
        subscription.dispose();
        throw error;
      }
    ),
    cancel,
  };
}

export const getEncodedSHA256Hash = (str: string) => {
  const hash = createHash("sha256").update(str).digest("hex");

  return Buffer.from(hash)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export interface MermaidChartToken {
  uuid: string;
  title: string;
  range: vscode.Range;
  collapsibleState?: vscode.TreeItemCollapsibleState;
}

export function findMermaidChartTokens(
  document: vscode.TextDocument,
  comments: vscode.Range[]
): MermaidChartToken[] {
  const mermaidChartTokens: MermaidChartToken[] = [];

  for (const commentRange of comments) {
    const commentText = document.getText(commentRange);
    const mermaidChartTokenRegex =
      /\[MermaidChart: ([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})]/g;
    let match: RegExpExecArray | null;

    while ((match = mermaidChartTokenRegex.exec(commentText)) !== null) {
      const uuid = match[1];
      const startCharacter = commentRange.start.character + (match.index || 0);
      const endCharacter = startCharacter + match[0].length;
      const lineNumber = commentRange.start.line;
      mermaidChartTokens.push({
        uuid,
        title: `Chart - ${uuid}`,
        range: new vscode.Range(
          lineNumber,
          startCharacter,
          lineNumber,
          endCharacter
        ),
      });
    }
  }

  return mermaidChartTokens;
}

export function applyMermaidChartTokenHighlighting(
  editor: vscode.TextEditor,
  mermaidChartTokens: MermaidChartToken[],
  mermaidChartTokenDecoration: vscode.TextEditorDecorationType
) {
  editor.setDecorations(
    mermaidChartTokenDecoration,
    mermaidChartTokens.map((token) => token.range)
  );
}

export function findComments(document: vscode.TextDocument): vscode.Range[] {
  const comments: vscode.Range[] = [];
  const commentPattern = /(?:\/\/|#|\/\*|<!--).*$/gm;

  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
    const line = document.lineAt(lineNumber);
    let match;

    while ((match = commentPattern.exec(line.text)) !== null) {
      const startPosition = new vscode.Position(lineNumber, match.index);
      const endPosition = new vscode.Position(
        lineNumber,
        match.index + match[0].length
      );
      comments.push(new vscode.Range(startPosition, endPosition));
    }
  }

  return comments;
}

/**
 * Convert SVG xml to png base64 url
 * @param {any} svgXml
 */
export function getImageDataURL(svgXml: string) {
  let base64 = encodeURIComponent(
    Buffer.from(svgXml, "utf8").toString("base64")
  );
  return "data:image/svg+xml;base64," + base64;
}

export async function viewMermaidChart(
  mcAPI: MermaidChartVSCode,
  uuid: string
) {
  const panel = vscode.window.createWebviewPanel(
    "mermaidChartView",
    `Mermaid Chart: ${uuid}`,
    vscode.ViewColumn.One,
    {}
  );

  const isDarkTheme =
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark; //ColorTheme.Light;
  // Choose the appropriate URL based on the current theme
  const themeParameter = isDarkTheme ? "dark" : "light";
  const svgContent = await mcAPI.getRawDocument(
    {
      documentID: uuid,
      major: "0",
      minor: "1",
    },
    themeParameter
  );

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en" style="height: 100%;">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="height: 100%; margin: 0; padding: 0; overflow: hidden;">
        <iframe sandbox="allow-same-origin allow-forms allow-popups allow-pointer-lock allow-top-navigation-by-user-activation" src="${getImageDataURL(
          svgContent
        )}" style="width: 100%; height: 100%; border: none;"></iframe>
    </body>
    </html>`;
}
export async function editMermaidChart(
  mcAPI: MermaidChartVSCode,
  uuid: string,
  provider: MermaidChartProvider
) {
  // const project = provider.getProjectOfDocument(uuid);
  // const projectUuid = project?.uuid;
  // if (!projectUuid) {
  //   vscode.window.showErrorMessage(
  //     "Diagram not found in project. Diagram might have moved to a different project."
  //   );
  //   return;
  // }
  const editUrl = await mcAPI.getEditURL({
    documentID: uuid,
  });
  vscode.env.openExternal(vscode.Uri.parse(editUrl));
}

export async function insertMermaidChartToken(
  uuid: string,
  provider: MermaidChartProvider
) {
  // If a project is selected from tree-view, no token shall be inserted
  const itemType = provider.getItemTypeFromUuid(uuid);
  if (itemType !== ITEM_TYPE_DOCUMENT) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const mermaidChartTokenLine = getCommentLine(editor, uuid);

  editor.edit((editBuilder) => {
    editBuilder.insert(
      new vscode.Position(editor.selection.active.line, 0),
      `${mermaidChartTokenLine}\n`
    );
  });
}

const getCommentLine = (editor: vscode.TextEditor, uuid: string): string => {
  const languageId = editor.document.languageId;
  switch (languageId) {
    case "markdown":
    case "html":
      return `<!-- [MermaidChart: ${uuid}] -->`;
    case "yaml":
    case "python":
      return `# [MermaidChart: ${uuid}]`;
    case "json":
    case "javascript":
    case "typescript":
    case "java":
    case "c":
    case "c++":
    case "c#":
    default:
      return `// [MermaidChart: ${uuid}]`;
  }
};
