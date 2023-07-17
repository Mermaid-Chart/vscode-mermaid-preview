// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import axios from "axios";
import {
  MermaidChartProvider,
  MyTreeItem,
  ITEM_TYPE_PROJECT,
  ITEM_TYPE_UNKNOWN,
  ITEM_TYPE_DOCUMENT,
} from "./mermaidChartProvider";
import { getBaseUrl } from "./conf";

const commentPattern = /(?:\/\/|#|\/\*|<!--).*$/gm;
//const mermaidChartProvider: MermaidChartProvider = new MermaidChartProvider();

function applyMermaidChartTokenHighlighting(
  editor: vscode.TextEditor,
  mermaidChartTokens: MermaidChartToken[],
  mermaidChartTokenDecoration: vscode.TextEditorDecorationType
) {
  editor.setDecorations(
    mermaidChartTokenDecoration,
    mermaidChartTokens.map((token) => token.range)
  );
}

export interface MermaidChartToken {
  uuid: string;
  title: string;
  range: vscode.Range;
  collapsibleState?: vscode.TreeItemCollapsibleState;
}

function findMermaidChartTokens(
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

class MermaidChartCodeLensProvider implements vscode.CodeLensProvider {
  private mermaidChartTokens: MermaidChartToken[];

  constructor(mermaidChartTokens: MermaidChartToken[]) {
    this.mermaidChartTokens = mermaidChartTokens;
  }

  setMermaidChartTokens(mermaidChartTokens: MermaidChartToken[]) {
    this.mermaidChartTokens = mermaidChartTokens;
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];

    for (const token of this.mermaidChartTokens) {
      const viewCommand: vscode.Command = {
        title: "View Diagram",
        command: "extension.viewMermaidChart",
        arguments: [token.uuid],
      };

      const editCommand: vscode.Command = {
        title: "Edit Diagram",
        command: "extension.editMermaidChart",
        arguments: [token.uuid],
      };

      codeLenses.push(new vscode.CodeLens(token.range, viewCommand));
      codeLenses.push(new vscode.CodeLens(token.range, editCommand));
    }

    return codeLenses;
  }
}

function findComments(document: vscode.TextDocument): vscode.Range[] {
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
function getImageDataURL(svgXml: string) {
  let base64 = encodeURIComponent(
    Buffer.from(svgXml, "utf8").toString("base64")
  );
  return "data:image/svg+xml;base64," + base64;
}

async function viewMermaidChart(uuid: string) {
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

  const config = vscode.workspace.getConfiguration("mermaidChart");
  const token = config.get<string>("apiToken");

  const baseUrl = getBaseUrl();
  const webViewUrl = `${baseUrl}/raw/${uuid}/version/v0.1/theme/${themeParameter}`; // Replace with the actual URL generation logic
  console.log("webViewUrl", webViewUrl, token);
  const response = await axios.get(webViewUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const svgContent = response.data;

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
async function editMermaidChart(uuid: string, provider: MermaidChartProvider) {
  const project = provider.getProjectOfDocument(uuid);
  const projectUuid = project?.uuid;
  const baseUrl = getBaseUrl();
  const editUrl = `${baseUrl}/app/projects/${projectUuid}/diagrams/${uuid}/version/v0.1/edit`;
  vscode.env.openExternal(vscode.Uri.parse(editUrl));
}

async function insertMermaidChartToken(
  uuid: string,
  provider: MermaidChartProvider
) {
  // If a project is selected from tree-view, no token shall be inserted
  const itemType = provider.getItemTypeFromUuid(uuid);
  if (itemType === ITEM_TYPE_PROJECT || itemType === ITEM_TYPE_UNKNOWN) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const items = await provider.getChildren();
    const title = items.find((item) => item.uuid === uuid)?.title || "";
    const languageId = editor.document.languageId;
    let mermaidChartTokenLine1 = "";
    switch (languageId) {
      case "markdown":
        mermaidChartTokenLine1 = `<!-- [MermaidChart: ${uuid}] -->`;
        break;
      case "yaml":
        mermaidChartTokenLine1 = `# [MermaidChart: ${uuid}]`;
        break;
      case "json":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      case "javascript":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      case "typescript":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      case "python":
        mermaidChartTokenLine1 = `# [MermaidChart: ${uuid}]`;
        break;
      case "java":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      case "c":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      case "c++":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      case "c#":
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
      default:
        mermaidChartTokenLine1 = `// [MermaidChart: ${uuid}]`;
        break;
    }

    editor.edit((editBuilder) => {
      editBuilder.insert(
        editor.selection.active,
        `${mermaidChartTokenLine1}\n`
      );
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating v4");

  const mermaidChartProvider: MermaidChartProvider = new MermaidChartProvider();
  const mermaidChartTokenDecoration =
    vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 71, 123, 0.3)", // Adjust the background color as desired
      color: "rgb(255, 255, 255)", // Adjust the text color as desired
      gutterIconPath: vscode.Uri.file(
        context.asAbsolutePath("images/mermaid-icon-16.png")
      ), // Add the icon file path
      gutterIconSize: "8x8", // Adjust the icon size as desired
    });
  let codeLensProvider: MermaidChartCodeLensProvider | undefined;

  function updateMermaidChartTokenHighlighting() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const comments = findComments(activeEditor.document);
      const mermaidChartTokens = findMermaidChartTokens(
        activeEditor.document,
        comments
      );
      applyMermaidChartTokenHighlighting(
        activeEditor,
        mermaidChartTokens,
        mermaidChartTokenDecoration
      );

      if (!codeLensProvider) {
        codeLensProvider = new MermaidChartCodeLensProvider(mermaidChartTokens);
        context.subscriptions.push(
          vscode.languages.registerCodeLensProvider("*", codeLensProvider)
        );
      } else {
        codeLensProvider.setMermaidChartTokens(mermaidChartTokens);
      }
    }
  }

  updateMermaidChartTokenHighlighting();

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    () => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions
  );

  const viewCommandDisposable = vscode.commands.registerCommand(
    "extension.viewMermaidChart",
    viewMermaidChart
  );

  context.subscriptions.push(viewCommandDisposable);

  const treeView = vscode.window.createTreeView("mermaidChart", {
    treeDataProvider: mermaidChartProvider,
  });
  vscode.window.registerTreeDataProvider("mermaidChart", mermaidChartProvider);

  const editCommandDisposable = vscode.commands.registerCommand(
    "extension.editMermaidChart",

    (uuid: string) => {
      return editMermaidChart(uuid, mermaidChartProvider);
    }
  );
  context.subscriptions.push(editCommandDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.focus", () => {
      const emptyMermaidChartToken: MyTreeItem = {
        uuid: "",
        title: "",
        range: new vscode.Range(0, 0, 0, 0),
      };
      treeView.reveal(emptyMermaidChartToken, {
        select: false,
        focus: true,
        expand: false,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.refresh", () => {
      mermaidChartProvider.refresh();
    })
  );

  let disposable = vscode.commands.registerCommand(
    "outliner.outline",
    async () => {
      vscode.window.registerTreeDataProvider(
        "mermaidChart",
        mermaidChartProvider
      );
    }
  );
  context.subscriptions.push(disposable);

  const insertUuidIntoEditorDisposable = vscode.commands.registerCommand(
    "mermaidChart.insertUuidIntoEditor",
    (uuid: string) => {
      return insertMermaidChartToken(uuid, mermaidChartProvider);
    }
  );
  context.subscriptions.push(insertUuidIntoEditorDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.refreshTreeView", () => {
      mermaidChartProvider.refresh();
    })
  );

  // Add a console.log() statement to ensure the view is registered
  console.log("Mermaid Charts view registered.");
}

// This method is called when your extension is deactivated
export function deactivate() {}
