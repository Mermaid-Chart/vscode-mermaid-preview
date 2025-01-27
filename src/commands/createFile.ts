import * as vscode from "vscode";
import { PreviewPanel } from "../panels/previewPanel";

export function createMermaidFile(diagramContent: string | null, syncedFiles: Map<string, boolean>) {
  const exampleContent = `flowchart TD
      %% Nodes
          A("fab:fa-youtube Starter Guide")
          B("fab:fa-youtube Make Flowchart")
          n1@{ icon: "fa:gem", pos: "b", h: 24}`;

  const newFile = vscode.Uri.parse("untitled:Untitled diagram.mmd");

  vscode.workspace.openTextDocument({ language: "mermaid", content: diagramContent ? diagramContent : exampleContent}).then((document) => {
    vscode.window.showTextDocument(document).then((editor) => {
      if (editor?.document) {
        syncedFiles.set(document.uri.toString(), !!diagramContent?.includes("id:")); // Mark as synced if `id` exists in config
        PreviewPanel.createOrShow(editor.document);
      }
    });
  });
  // vscode.workspace.openTextDocument(newFile).then(async (document) => {
  //   vscode.window.showTextDocument(document).then(async (editor) => {
  //     if (editor?.document) {
  //       // Change the language to "mermaid"
  //       vscode.languages.setTextDocumentLanguage(editor.document, 'mermaid').then(async () => {
  //         // Set content (use your diagramContent or exampleContent)
  //         const content = diagramContent ? diagramContent : exampleContent;
  //         const edit = new vscode.WorkspaceEdit();
  //         edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
  
  //         // Apply the content edit to the document
  //         await vscode.workspace.applyEdit(edit);
  
  //         // Mark as synced if necessary
  //         syncedFiles.set(document.uri.toString(), !!diagramContent?.includes("id:"));
  
  //         // Show preview
  //         PreviewPanel.createOrShow(editor.document);
  //       });
  //     }
  //   });
  // });
}

function showSyncNotification() {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "⚡ This file is in sync with the remote Mermaid chart. Changes will be saved remotely.";
  statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
  statusBarItem.show();

  // Automatically hide the notification after 10 seconds
  setTimeout(() => statusBarItem.hide(), 10000);
}

export function getPreview() {
  const activeEditor = vscode.window.activeTextEditor;
  
      if (!activeEditor) {
        vscode.window.showErrorMessage("No active editor. Open a .mmd file to preview.");
        return;
      }
  
      const document = activeEditor?.document;
      if (document && document?.languageId !== "plaintext" && !document.fileName.endsWith(".mmd") && !document.fileName.endsWith(".mermaid") && !document.languageId.startsWith('mermaid')) {
        vscode.window.showErrorMessage("Mermaid Preview is only available for mermaid files.");
        return;
      }
      if (document) {
        PreviewPanel.createOrShow(document);
      }
}