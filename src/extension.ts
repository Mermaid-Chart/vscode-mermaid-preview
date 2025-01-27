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
import * as path from "path";
import * as fs from "fs";
import { handleTextDocumentChange } from "./eventHandlers";

let diagramMappings: { [key: string]: string[] } = require('../src/diagramTypeWords.json');
let isExtensionStarted = false;


export async function activate(context: vscode.ExtensionContext) {

  const syncedFiles = new Map<string, boolean>();

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
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.createMermaidFile', createMermaidFile)
  );
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
    vscode.commands.registerCommand("extension.editLocally", (uuid: string) => {
      const projects = getAllTreeViewProjectsCache();
  
      // Find the diagram code based on the UUID
      const diagramCode = projects
        .flatMap((project) => project?.children ?? [])
        .find((child) => child.uuid === uuid)?.code;
  
      // Create the Mermaid file if diagramCode is found
      if (diagramCode) {
        const diagramId = uuid;
        const processedCode = ensureConfigBlock(diagramCode, diagramId);
        createMermaidFile(processedCode, syncedFiles);
      } else {
        vscode.window.showErrorMessage("Diagram not found for the given UUID.");
      }
    })
  );

  vscode.workspace.onWillSaveTextDocument(async (event) => {
    const documentUri = event.document.uri.toString();
  
    // if (syncedFiles.has(documentUri) && syncedFiles.get(documentUri)) {
      if (event.document.languageId.startsWith("mermaid")) {
      // Prevent the default save action
      event.waitUntil(Promise.resolve([]));
  
      const content = event.document.getText();
      try {
        // Extract the id from the code
        const diagramId = extractIdFromCode(content);
        
        if (diagramId) {
          console.log(`Extracted diagram ID: ${diagramId}`);
          const response = await mcAPI.saveDocumentCode(content, diagramId);
          console.log(response)
          vscode.window.showInformationMessage(`File synced successfully to the remote server. Diagram ID: ${diagramId}`);
        } else {
          vscode.window.showErrorMessage("No diagram ID found in the file.");
        }
      } catch (error) {
        if (error instanceof Error) {
          // Only access message if it's an Error
          vscode.window.showErrorMessage(`Failed to sync file to the remote server: ${error.message}`);
        } else {
          // Handle other types of errors
          vscode.window.showErrorMessage("Failed to sync file to the remote server: Unknown error occurred.");
        }      
      }
    }
  });

  function showSyncWarning(editor: vscode.TextEditor) {
    if (syncedFiles.has(editor.document.uri.toString()) && syncedFiles.get(editor.document.uri.toString())) {
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
  // Add a console.log() statement to ensure the view is registered
  console.log("Mermaid Charts view registered");
}

// This method is called when your extension is deactivated
export function deactivate() {}
