import * as vscode from "vscode";
import * as path from "path";

export function getWebviewHTML(panel: vscode.WebviewPanel, extensionPath: string, initialContent: string, currentTheme:string, validateOnly:boolean): string {
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "out", "svelte", "bundle.js"))
  );

  // Make sure the panel retains state when hidden
  // panel.onDidChangeViewState((e) => {
  //   // Rerender content when panel becomes visible again
  //   if (e.webviewPanel.visible) {
  //     panel.webview.postMessage({
  //       type: "update",
  //       content: initialContent,
  //       currentTheme: currentTheme,
  //       isFileChange: false,
  //       validateOnly: validateOnly,
  //     });
  //   }
  // });
  
  // Ensure panel doesn't close automatically
  panel.onDidDispose(() => {
    // Optional cleanup code here
  });
  
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

// // Add this helper function to create a persistent panel
// export function createPersistentPanel(context: vscode.ExtensionContext, viewType: string, title: string): vscode.WebviewPanel {
//   // Check if we already have a panel stored in context
//   const existingPanel = context.globalState.get<string>('mermaidPreviewPanelId');
  
//   // Create options for a persistent panel
//   const panelOptions = {
//     enableScripts: true,
//     retainContextWhenHidden: true,  // Important to keep panel state when not visible
//     localResourceRoots: [vscode.Uri.file(context.extensionPath)]
//   };
  
//   // Create the panel
//   const panel = vscode.window.createWebviewPanel(
//     viewType,
//     title,
//     vscode.ViewColumn.Beside,
//     panelOptions
//   );
  
//   // Store panel ID
//   context.globalState.update('mermaidPreviewPanelId', panel.title);
  
//   return panel;
// }