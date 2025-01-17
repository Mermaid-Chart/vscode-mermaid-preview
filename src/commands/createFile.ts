import * as vscode from "vscode";
import { PreviewPanel } from "../panels/previewPanel";

export function createMermaidFile() {
  const exampleContent = `flowchart TD
  A-->B
  A-->C
  B-->D
  C-->D`;

  vscode.workspace.openTextDocument({ content: exampleContent}).then((document) => {
    vscode.window.showTextDocument(document).then((editor) => {
      PreviewPanel.createOrShow(editor.document);
    });
  });
}