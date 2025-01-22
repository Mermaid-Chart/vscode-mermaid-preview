import * as vscode from "vscode";
import * as path from "path";

export function getWebviewHTML(panel: vscode.WebviewPanel, extensionPath: string): string {
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "out", "svelte", "bundle.js"))
  );

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Svelte Mermaid Preview</title>
      <script type="module" src="${scriptUri}"></script>
       <script>
          const vscode = acquireVsCodeApi();
          window.vscode = vscode;
        </script>
      <style>
        #app {
          height:100vh;
        }
      </style>
    </head>
    <body>
      <div id="app"></div>
    </body>
    </html>
  `;
}