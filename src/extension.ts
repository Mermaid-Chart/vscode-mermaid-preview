import * as vscode from "vscode";
import { MermaidChartProvider, MCTreeItem, getAllTreeViewProjectsCache } from "./mermaidChartProvider";
import { MermaidChartVSCode } from "./mermaidChartVSCode";
import {
  applyMermaidChartTokenHighlighting,
  editMermaidChart,
  ensureConfigBlock,
  extractIdFromCode,
  findComments,
  findMermaidChartTokens,
  insertMermaidChartToken,
  viewMermaidChart,
} from "./util";
import { MermaidChartCodeLensProvider } from "./mermaidChartCodeLensProvider";
import { createMermaidFile, getPreview } from "./commands/createFile";
import { handleTextDocumentChange } from "./eventHandlers";
import { TempFileCache } from "./cache/tempFileCache";

let diagramMappings: { [key: string]: string[] } = require('../src/diagramTypeWords.json');
let isExtensionStarted = false;


export async function activate(context: vscode.ExtensionContext) {

  console.log("Activating Mermaid Chart extension");

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.preview', getPreview)
  );

  const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && !isExtensionStarted) {
        isExtensionStarted = true;
        handleTextDocumentChange(activeEditor, diagramMappings, true);
    }

  vscode.workspace.onDidChangeTextDocument((event) =>
    handleTextDocumentChange(event, diagramMappings, false)
  );
  vscode.window.onDidChangeActiveTextEditor((event) =>
    handleTextDocumentChange(event, diagramMappings, true)
  );
  // context.subscriptions.push(
  //   vscode.commands.registerCommand('mermaidChart.createMermaidFile', createMermaidFile)
  // );
  vscode.commands.registerCommand('mermaidChart.createMermaidFile', async () => {
    createMermaidFile(context, null, false)
  })
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.logout', async () => {
      mcAPI.logout(context);
    })
  );

  const mcAPI = new MermaidChartVSCode();
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.login', async () => {
      await mcAPI.login();
    })
  );

  await mcAPI.initialize(context);

  const mermaidChartProvider: MermaidChartProvider = new MermaidChartProvider(
    mcAPI
  );

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
    (uuid: string) => {
      return viewMermaidChart(mcAPI, uuid);
    }
  );

  context.subscriptions.push(viewCommandDisposable);

  const treeView = vscode.window.createTreeView("mermaidChart", {
    treeDataProvider: mermaidChartProvider,
  });
  vscode.window.registerTreeDataProvider("mermaidChart", mermaidChartProvider);

  const editCommandDisposable = vscode.commands.registerCommand(
    "extension.editMermaidChart",
    (uuid: string) => {
      return editMermaidChart(mcAPI, uuid, mermaidChartProvider);
    }
  );
  context.subscriptions.push(editCommandDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.editLocally", (uuid: string) => {
      const projects = getAllTreeViewProjectsCache();
      
      // Find the diagram code based on the UUID
      const diagramCode = projects
        .flatMap((project) => project?.children ?? [])
        .find((child) => child.uuid === uuid)?.code;
  
      // Create the Mermaid file if diagramCode is found
      if (diagramCode) {
        const diagramId = uuid;
        const processedCode = ensureConfigBlock(diagramCode, diagramId);
        createMermaidFile(context, processedCode, true);
      } else {
        vscode.window.showErrorMessage("Diagram not found for the given UUID.");
      }
    })
  );

  vscode.workspace.onWillSaveTextDocument(async (event) => {
    event.waitUntil(Promise.resolve([]));
    const content = event.document.getText();
    const diagramId = extractIdFromCode(content);
    if (diagramId) {
        await mcAPI.saveDocumentCode(content, diagramId);
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.syncDiagramWithMermaid', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        syncFileToMermaidChart(editor.document);
      }
    })
  );
  const syncFileToMermaidChart = async (document: vscode.TextDocument) => {
    if (document.languageId.startsWith("mermaid")) {
        const content = document.getText();
        try {
            const diagramId = extractIdFromCode(content);
            if (TempFileCache.hasTempUri(context, document.uri.toString()) && diagramId) {
                await mcAPI.saveDocumentCode(content, diagramId);
                vscode.window.showInformationMessage(`Diagram synced successfully with Mermaid chart. Diagram ID: ${diagramId}`);
            } else if (!TempFileCache.hasTempUri(context, document.uri.toString()) && diagramId) {
              await vscode.commands.executeCommand('workbench.action.files.save');
              await mcAPI.saveDocumentCode(content, diagramId);
              vscode.window.showInformationMessage(`Diagram synced successfully with Mermaid chart. Diagram ID: ${diagramId}`);
            } else {
              await vscode.commands.executeCommand('workbench.action.files.save');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to sync file: ${error instanceof Error ? error.message : "Unknown error occurred."}`);
        }
    }
};

  function showSyncWarning(editor: vscode.TextEditor) {
      const panel = vscode.window.createWebviewPanel(
        "syncWarning",
        "",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        { enableScripts: true, retainContextWhenHidden: true }
      );
  
      panel.webview.html = `
        <html>
          <body style="margin: 0; padding: 10px; background-color: lightblue; font-size: 14px; text-align: center; width: 100%;">
            ⚡ This file is in sync with the remote Mermaid chart. You cannot save it locally. Changes will be saved remotely.
          </body>
        </html>`;
  }
  
  // vscode.window.onDidChangeActiveTextEditor((editor) => {
  //   if (editor) {
  //     showSyncWarning(editor);
  //   }
  // });

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.focus", () => {
      const emptyMermaidChartToken: MCTreeItem = {
        uuid: "",
        title: "",
        code : "",
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
    "mermaidChart.outline",
    () => {
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

  mermaidChartProvider.refresh();
  console.log("Mermaid Charts view registered");
}

// This method is called when your extension is deactivated
export function deactivate() {}
