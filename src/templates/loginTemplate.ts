import * as vscode from "vscode";
export function generateWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const logoSrc = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "images", "panel.svg")
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MermaidChart</title>
    <style>
        :root {
            --vscode-bg: var(--vscode-editor-background);
            --vscode-foreground: var(--vscode-editor-foreground);
        }

    body {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--vscode-bg);
      color: var(--vscode-foreground);
      font-family: Recursive;
      overflow: hidden;
    }

    .container {
      min-width: 100px; 
      max-width: 304px; 
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 24px;
      padding: 20px;
      background-color: var(--vscode-bg);
      border-radius: 10px;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    }

    .logo-container {
      width: 100%;
      max-width: 344px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 20px;
    }

    .logo {
      width: 80px;
      height: auto;
    }
    .welcome-msg{
      margin: 0;
      font-size: 24px;
      line-height: 38px;
      font-weight:420;    
    }

    .description {
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        margin: 0;
        text-align: center;
    }

    .bulletin {
        font-size: 14px;
        line-height: 20px;
        text-align: left;
    }
    .login-btn{
         display: flex;
         justify-content: center;
     }

    .bulletin ul {
        padding-left: 16px;  
        margin: 0;
        text-align: left;
    }

    .bulletin li {
        margin: 4px 0; 
    }

    .highlight-text {
        margin: 0;
        font-weight: 600;
        font-size: 16px;
        line-height: 24px;
        text-align: center;
    }

    button {
        width: 100%;
        max-width: 234px;
        height: 60px;
        padding: 12px;
        border-radius: 12px;
        background: #E0095F;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        line-height: 32px;
    }

    button:hover {
        background: #c40065;
    }
            
    body, .container {
    color: var(--vscode-editor-foreground);
    }

    .vscode-dark body, .vscode-dark .container {
    color: var(--Color-Storm-Grey-300, #BDBCCC);
    }

    .vscode-light body, .vscode-light .container {
    color: var(--Color-Deep-Purple-800, #1E1A2E);
    }

    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img class="logo" src="${logoSrc}" alt="Mermaid Logo">
            <h2 class="welcome-msg">Welcome to the 
            <br>
            Official Mermaid Plugin
            </br></h2>
        </div>
        <p class="description">
            Created by the team behind Mermaid open source, this extension elevates your diagramming experience.
             Sign in to unlock
        </p>
        <div class="bulletin">
    <ul>
        <li>Diagram Sync Seamlessly</li>
        <li>Clickable Diagram References</li>
    </ul>
</div>

        <p class="highlight-text">Join now and supercharge your workflow!</p>
        <div class="login-btn"> 
        <button id="signInButton">Sign in</button>
        </div>
    </div>
     <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('signInButton').addEventListener('click', () => {
            vscode.postMessage({ command: 'signIn' });
        });
    </script>
</body>
</html>`;
}
