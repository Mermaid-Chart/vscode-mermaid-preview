import * as vscode from "vscode";
import * as path from "path";

export function getWebviewHTML(panel: vscode.WebviewPanel, extensionPath: string, initialContent: string, currentTheme:string): string {
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "out", "svelte", "bundle.js"))
  );

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mermaid Preview</title>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
      />
      <script type="module" src="${scriptUri}"></script>
      <style>
        #app {
          height: 100vh;
        }
      </style>
    </head>
    <body>
      <div id="app" data-initial-content="${encodeURIComponent(initialContent)}" data-current-theme="${encodeURIComponent(currentTheme)}"></div>
    </body>
    </html>
  `;
}