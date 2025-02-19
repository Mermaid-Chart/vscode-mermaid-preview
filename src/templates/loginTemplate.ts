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
            height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--vscode-bg);
            color: var(--vscode-foreground);
            font-family: Arial, sans-serif;
        }

        .container {
            width: 90%;
            max-width: 384px;
            height: auto;
            min-height: 800px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 20px;
            background-color: var(--vscode-bg);
            border-radius: 10px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .logo-container {
            width: 100%;
            max-width: 344px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .logo {
            width: 80px;
            height: auto;
        }

        .description {
            width: 100%;
            max-width: 384px;
            text-align: center;
        }

       .bulletin {
    width: 100%;
    max-width: 344px;
    text-align: left;
    padding: 0;
    margin: 0;
}

.bulletin ul {
    list-style-type: disc; /* Ensures bullet points are shown */
    padding-left: 16px;  /* Adjust based on preference */
    margin: 0;
}

.bulletin li {
    margin: 4px 0; /* Reduces unnecessary space */
    padding: 0;
}

        .highlight-text {
            width: 90%;
            max-width: 330px;
            font-weight: bold;
            text-align: center;
        }

        button {
            width: 80%;
            max-width: 234px;
            height: 50px;
            padding: 12px;
            border-radius: 12px;
            background: #E0095F;
            

            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        }

        button:hover {
            background: #c40065;
        }

        @media (prefers-color-scheme: dark) {
            body, .container {
                background-color: var(--dark-bg);
            }
        }

        @media (prefers-color-scheme: light) {
            body, .container {
                background-color: var(--light-bg);
            }
        }

        @media (max-width: 300px) {
            .container {
                width: 100%;
                padding: 10px;
            }

            button {
                width: 100%;
            }
        }

    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img class="logo" src="${logoSrc}" alt="Mermaid Logo">
            <h2>Welcome to the Official Mermaid Plugin</h2>
        </div>
        <p class="description">
            Created by the team behind Mermaid open source, this extension elevates your diagramming experience.
        </p>
        <div class="bulletin">
    <ul>
        <li>Diagram Sync Seamlessly</li>
        <li>Clickable Diagram References</li>
    </ul>
</div>

        <p class="highlight-text">Join now and supercharge your workflow!</p>
        <button id="signInButton">Sign in</button>
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
