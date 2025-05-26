import * as vscode from "vscode";

export function generateWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const logoSrc = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "images", "panel.svg")
  );
  const fontUrl = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media","recursive-latin-full-normal.woff2")
  );
  

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MermaidChart</title>
    <style>
    @font-face {
      font-family: "Recursive";
      src: url("${fontUrl}") format("woff2");
      font-weight: 300 900;
      font-style: normal;
    }

    :root {
      --vscode-bg: var(--vscode-editor-background);
      --vscode-foreground: var(--vscode-editor-foreground);
      --pink-color: #E0095F;
      --text-color: #8585A4;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--vscode-bg);
       font-family: "Recursive", serif;
       overflow: auto;
       padding: 20px 20px 0 20px;
       height: 96vh
    }

    .container {
      max-width: 340px; 
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
       height: 96vh
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
    }

    .logo {
      width: 60px;
      height: 60px  ;
    }
    .welcome-msg{
      margin: 0;
      font-size: 24px;
      line-height: 38px;
      font-weight:420;    
    }

    .features-section {
      text-align: left;
    }
    .description-section {
      width: 100%;
      text-align: left;
    }

    .get-started-text {
      font-size: 14px;
      margin: 0 0 8px 0;
    }

    .get-started-main {
  
    }

    .get-started-secondary {
     color: #FF2D81 /* Customize this */
    }

    .features-list {
      list-style-type: none;
      padding: 0;
      margin: 0 0 16px 0;
    }

    .features-list li {
      font-size: 14px;
      line-height: 20px;
      margin: 4px 0;
      padding-left: 16px;
      position: relative;
    }

    .features-list li::before {
      content: "•";
      position: absolute;
      left: 0;
    }

    .view-all-features {
      font-size: 12px;
      text-decoration: none;
      display: block;
      margin-top: 4px;
      margin-bottom: 16px;
      margin-left: 16px;
      cursor: pointer;
      text-decoration: underline;
    }

    .vscode-light .view-all-features {
      color: #0000EE;
    }

    .vscode-dark .view-all-features {
      color: #7A7AFF;
    }

    .vscode-dark .view-all-features:hover {
      color: #6565FF;
    }
    
     .vscode-light .view-all-features:hover {
      color: #3A3AFF;
    }

    .divider {
      width: 100%;
      text-align: center;
      color: var(--text-color);
      font-size: 14px;
      margin: 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .divider::before,
    .divider::after {
      content: "";
      flex: 1;
      height: 1px;
      background-color: var(--text-color);
      opacity: 0.2;
    }

    button {
      width: 100%;
      padding: 12px 0;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      font-family: "Recursive", serif;
    }

    .get-started-btn {
      background: var(--pink-color);
      color: white;
      border-radius: 12px;
    }
   .get-started-btn:hover {
      background: #FF257C;
    }
    
    .sign-in-btn {
      background: transparent;
      border: 2px solid var(--vscode-foreground);
      color: color: var(--vscode-bg);
      border-radius: 12px;
    }
   .vscode-dark  .sign-in-btn:hover {
      background: #2B2B2B;
    }
    
     .vscode-light  .sign-in-btn:hover {
      background: #E1E1E1;
    }
    .footer {
      font-size: 12px;
      text-align: center;
    }

    .vscode-light .footer {
      color: var(--Color-Deep-Purple-700, #272040);
    }

    .vscode-dark .footer {
    color: var(--Color-Storm-Grey-400, #8585A4);
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

    .vscode-light body, .vscode-light .container .bulletin ul {
      color: #272040;
    }

    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img class="logo" src="${logoSrc}" alt="Mermaid Logo">
            <h2 class="welcome-msg">Welcome to the<br>Mermaid Preview Plugin</h2>
        </div>

        <div class="features-section">
        <div class="description-section">
            <p class="get-started-text">
        <span class="get-started-main">Get started</span>
       <span class="get-started-secondary">without signing in:</span>
        </p>
            <ul class="features-list">
                <li>Real-time local editing and preview</li>
                <li>Mermaid diagram preview in markdown files</li>
            </ul>
            <a class="view-all-features" id="viewLocalFeatures">View all features and commands</a>
            </div>
            <button id="getStartedButton" class="get-started-btn">Create new diagram</button>

            <div class="divider">OR</div>
 <div class="description-section">
            <p class="get-started-text">Sign in to unlock advanced features:</p>
            <ul class="features-list">
                <li>Smart code linking with Mermaid Chart</li>
                <li>Smart sync and conflict detection</li>
            </ul>
            <a class="view-all-features" id="viewPremiumFeatures">View all features and commands</a>
</div>
            <button id="signInButton" class="sign-in-btn">Sign in for More Features</button>
        </div>

        <p class="footer">Created by the Mermaid open-source team.</p>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('signInButton').addEventListener('click', () => {
            vscode.postMessage({ command: 'signIn' });
        });
        
        document.getElementById('getStartedButton').addEventListener('click', () => {
            vscode.postMessage({ command: 'getStarted' });
        });

        // Add click handlers for viewing features
        document.getElementById('viewLocalFeatures').addEventListener('click', () => {
            vscode.postMessage({ command: 'showFeatures', type: 'local' });
        });

        document.getElementById('viewPremiumFeatures').addEventListener('click', () => {
            vscode.postMessage({ command: 'showFeatures', type: 'premium' });
        });
    </script>
</body>
</html>`;
}
