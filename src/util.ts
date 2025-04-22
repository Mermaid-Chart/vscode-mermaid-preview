import { Disposable, Event, EventEmitter, authentication } from "vscode";
import { createHash } from "crypto";
import * as vscode from "vscode";
import { MermaidChartVSCode } from "./mermaidChartVSCode";
import {
  MermaidChartProvider,
  ITEM_TYPE_DOCUMENT,
  MCTreeItem,
} from "./mermaidChartProvider";
import * as path from 'path';
import { extractIdFromCode } from "./frontmatter";
import * as packageJson from '../package.json';

const activeListeners = new Map<string, vscode.Disposable>();
const REOPEN_CHECK_DELAY_MS = 500; // Delay before checking if temp file is reopened
import { MermaidWebviewProvider } from "./panels/loginPanel";
import { allDiagrams } from "./constants/diagramTemplates";
const config = vscode.workspace.getConfiguration();
export const defaultBaseURL = config.get<string>('mermaidChart.baseUrl', 'https://www.mermaidchart.com');
const DARK_BACKGROUND = "rgba(176, 19, 74, 0.5)"; // #B0134A with 50% opacity
const LIGHT_BACKGROUND = "#FDE0EE";
const DARK_COLOR = "#FFFFFF";
const LIGHT_COLOR = "#1E1A2E";
export const configSection = 'mermaid';


export const pattern : Record<string, RegExp> = {
  ".md": /```mermaid([\s\S]*?)```/g,
  ".html": /<div class=["']mermaid["']>([\s\S]*?)<\/div>/g,
  ".hugo": /{{<mermaid[^>]*>}}([\s\S]*?){{<\/mermaid>}}/g,
  ".rst": /\.\. mermaid::(?:[ \t]*)?$(?:(?:\n[ \t]+:(?:(?:\\:\s)|[^:])+:[^\n]*$)+\n)?((?:\n(?:[ \t][^\n]*)?$)+)?/gm,
};

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
  uri?: vscode.Uri
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

export function findMermaidChartTokensFromAuxFiles(document: vscode.TextDocument): MermaidChartToken[] {
  const mermaidChartTokens: MermaidChartToken[] = [];
  const text = document.getText();
  const fileExt = path.extname(document.fileName);
  const regex = pattern[fileExt];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Get the full match range
    const fullRange = new vscode.Range(
      document.positionAt(match.index),
      document.positionAt(match.index + match[0].length)
    );

    // Extract only the Mermaid content (match[1] contains the content between delimiters)
    const contentStart = match.index + match[0].indexOf(match[1]);
    const contentRange = new vscode.Range(
      document.positionAt(contentStart),
      document.positionAt(contentStart + match[1].length)
    );

    const extractedId = extractIdFromCode(match[1]) || "";
    mermaidChartTokens.push({
      title: `Chart - ${extractedId}`,
      uri: document.uri,
      range: contentRange, // Use the content-only range
      uuid: extractedId,
    });
  }

  return mermaidChartTokens;
}

export function applyMermaidChartTokenHighlighting(
  editor: vscode.TextEditor,
  mermaidChartTokens: MermaidChartToken[],
  mermaidChartTokenDecoration: vscode.TextEditorDecorationType,
  mermaidChartGutterIconDecoration: vscode.TextEditorDecorationType
) {
  const fullBlockDecorations: vscode.DecorationOptions[] = mermaidChartTokens.map(token => ({
    range: token.range, 
  }));
  const gutterIconDecorations: vscode.DecorationOptions[] = mermaidChartTokens.map(token => ({
    range: new vscode.Range(token.range.start, token.range.start), // Only first line for gutter icon
  }));
  editor.setDecorations(mermaidChartTokenDecoration, fullBlockDecorations);
  editor.setDecorations(mermaidChartGutterIconDecoration, gutterIconDecorations);
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
      major: 0,
      minor: 1,
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
  // Retrieve the document details to get the required fields
  const document = await mcAPI.getDocument({ documentID: uuid });

  if (!document || !document.projectID) {
    vscode.window.showErrorMessage(
      "Document details not found. Unable to edit the chart."
    );
    return;
  }

  const editUrl = await mcAPI.getEditURL({
    documentID: document.documentID,
    major: document.major,
    minor: document.minor,
    projectID: document.projectID,
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


export function updateViewVisibility(isLoggedIn: boolean,webviewProvider?: MermaidWebviewProvider,mermaidChartProvider?: MermaidChartProvider) {
  vscode.commands.executeCommand("setContext", "mermaid.showChart", isLoggedIn);
  vscode.commands.executeCommand("setContext", "mermaid.showWebview", !isLoggedIn);
  if (isLoggedIn) {
    mermaidChartProvider?.refresh();
  } else {
    webviewProvider?.refresh();
  }
}

export function getMermaidChartTokenDecoration(): vscode.TextEditorDecorationType {

  // Determine the current theme
  const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;

  // Set the decoration type based on the theme
  const backgroundColor = isDarkTheme ? DARK_BACKGROUND : LIGHT_BACKGROUND;
  const color = isDarkTheme ? DARK_COLOR : LIGHT_COLOR;

  return vscode.window.createTextEditorDecorationType({
    backgroundColor,
    color,
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



export function syncAuxFile(tempFileUri: string, originalFileUri: vscode.Uri, range: vscode.Range) {
  
  if (activeListeners.has(tempFileUri)) {
    activeListeners.get(tempFileUri)?.dispose();
    activeListeners.delete(tempFileUri);
  }

  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.toString() === tempFileUri) {
      syncFiles(originalFileUri, event.document.getText(), range);
    }
  });

  activeListeners.set(tempFileUri, disposable);

  vscode.workspace.onDidCloseTextDocument((closedDoc) => {
    if (closedDoc.uri.toString() === tempFileUri) {
      setTimeout(() => {
        const isReopened = vscode.workspace.textDocuments.some(
          (doc) => doc.uri.toString() === tempFileUri
        );
        
        // Only remove the listener if the file was not reopened
        if (!isReopened) {
          activeListeners.get(tempFileUri)?.dispose();
          activeListeners.delete(tempFileUri);
        } 
      }, REOPEN_CHECK_DELAY_MS);
    }
  });
}

export function syncFiles(
  fileUri: vscode.Uri,
  mermaidCode: string,
  range: vscode.Range 
) {
  if (!mermaidCode || mermaidCode.trim() === "") {
    return;
  }

  vscode.workspace.openTextDocument(fileUri).then((doc) => {
    const text = doc.getText();
    const fileExt = fileUri.fsPath.split('.').pop()?.toLowerCase();

    const patterns: Record<string, RegExp> = {
      "md": /```mermaid([\s\S]*?)```/g,
      "html": /<div class=["']mermaid["']>([\s\S]*?)<\/div>/g,
      "hugo": /{{<mermaid[^>]*>}}([\s\S]*?){{<\/mermaid>}}/g,
      "rst": /\.\. mermaid::(?:[ \t]*)?$(?:(?:\n[ \t]+:(?:(?:\\:\s)|[^:])+:[^\n]*$)+\n)?((?:\n(?:[ \t][^\n]*)?$)+)?/gm
    };

    const startTags: Record<string, string> = {
      "md": "```mermaid\n",
      "html": '<div class="mermaid">\n',
      "hugo": "{{<mermaid>}}\n",
      "rst": ".. mermaid::\n" 
    };

    const endTags: Record<string, string> = {
      "md": "\n```",
      "html": "\n</div>",
      "hugo": "\n{{</mermaid>}}",
      "rst": "" 
    };

    if (!fileExt || !patterns[fileExt]) {
      vscode.window.showErrorMessage(`Unsupported file type: .${fileExt}`);
      return;
    }

    const regex = patterns[fileExt];
    let match = regex.exec(text);
    let lastMatchRange: vscode.Range | null = null;

    while (match) {
      const start = match.index;
      const end = start + match[0].length;
      lastMatchRange = new vscode.Range(doc.positionAt(start), doc.positionAt(end));
      
      if (lastMatchRange.contains(range.start)) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        let formattedCode = `${startTags[fileExt]}${mermaidCode}${endTags[fileExt]}`;

        // Add indentation for .rst files
        if (fileExt === "rst") {
          formattedCode = startTags[fileExt] + 
                          mermaidCode
                            .split("\n")
                            .map(line => `  ${line}`) // Add 2 spaces at the start of each line
                            .join("\n") + 
                          endTags[fileExt];
        }

        workspaceEdit.replace(fileUri, lastMatchRange, formattedCode);
        vscode.workspace.applyEdit(workspaceEdit);
        break; 
      }
      match = regex.exec(text); 
    }
  });
}

export function isAuxFile(fileName: string): boolean {
  const allowedExt = [".md", ".html", ".hugo", ".rst"];
  const fileExt = path.extname(fileName).toLowerCase();

  return allowedExt.includes(fileExt);
}
export const getHelpUrl = (diagramType: string) => {
  switch (diagramType) {
    case 'erdiagram': {
      diagramType = 'entityRelationshipDiagram';

      break;
    }
    case 'gitgraph': {
      diagramType = 'gitgraph';

      break;
    }
    case 'journey': {
      diagramType = 'userJourney';

      break;
    }
    case 'classdiagram': {
      diagramType = 'classDiagram';

      break;
    }
  
    case 'statediagram': {
      diagramType = 'stateDiagram';

      break;
    }
    case 'sequencediagram': {
      diagramType = 'sequenceDiagram';

      break;
    }
    case 'requirementdiagram': {
      diagramType = 'requirementDiagram';

      break;
    }
    case 'xychart': {
      diagramType = 'xyChart';

      break;
    }
    case 'quadrantchart':{
      diagramType = 'quadrantChart';

      break;
    }
    case 'c4context':{
      diagramType = 'c4';

      break;
    }
    // No default
  }
  return diagramType
    ? (`https://mermaid.js.org/syntax/${diagramType}.html` as const)
    : ('https://mermaid.js.org/intro/' as const);
};


export const findDiagramCode = (items: MCTreeItem[], uuid: string): string | undefined => {
  for (const item of items) {
    if (item.uuid === uuid) return item.code;
    if (item.children?.length) {
      const foundCode = findDiagramCode(item.children, uuid);
      if (foundCode) return foundCode;
    }
  }
  return undefined;
};

const mermaidChartGutterIconDecoration = vscode.window.createTextEditorDecorationType({
  gutterIconPath: vscode.Uri.file(
    vscode.extensions.getExtension(`${packageJson.publisher}.${packageJson.name}`)!.extensionPath + "/images/mermaid-icon.svg"
  ),
  gutterIconSize: "16x16",
});

export function applyGutterIconDecoration(position: vscode.Range) {
  vscode.window.activeTextEditor?.setDecorations(mermaidChartGutterIconDecoration, [
    position,
  ]);
}


export function getDiagramTemplates() {
  return allDiagrams; 
}

export function triggerSuggestIfEmpty(document: vscode.TextDocument) {
  if (document.languageId.startsWith("mermaid") && document.getText().trim() === "") {
    setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document) {
        vscode.commands.executeCommand("editor.action.triggerSuggest");
      } 
    }, 100);
  }
}





