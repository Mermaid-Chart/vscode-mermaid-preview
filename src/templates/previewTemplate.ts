import * as vscode from "vscode";

export function getWebviewHTML(content: string, mermaidScriptUri: vscode.Uri): string {
  return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mermaid Preview</title>
      <script src="${mermaidScriptUri}">
        mermaid.initialize({ startOnLoad: true });
      </script>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f4f4f4;
        }
        #diagram {
          width: 90%;
          max-width: 800px;
          border: 1px solid #ddd;
          padding: 10px;
          background: white;
          border-radius: 5px;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <div class="mermaid">${content}</div>
    </body>
    </html>
  `;
}