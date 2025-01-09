import * as vscode from "vscode";
import { PreviewPanel } from "../panels/previewPanel";

export function createMermaidFile() {
  const exampleContent = `graph TD;
  A-->B
  A-->C
  B-->D
  C-->D`;

  const newFile = vscode.Uri.parse("untitled:Untitled diagram.mmd");

  vscode.workspace.openTextDocument(newFile).then((document) => {
    const edit = new vscode.WorkspaceEdit();
    edit.insert(newFile, new vscode.Position(0, 0), exampleContent);

    vscode.workspace.applyEdit(edit).then(() => {
      vscode.window.showTextDocument(document).then((editor) => {
        PreviewPanel.createOrShow(editor.document);
      });
    });
  });
}