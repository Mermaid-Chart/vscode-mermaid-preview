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
    <title>Mermaid Preview</title>
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
      --card-bg: rgba(255, 255, 255, 0.03);
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--vscode-bg);
      font-family: "Recursive", serif;
      color: var(--vscode-editor-foreground);
      font-size: 13px;
      line-height: 18px;
    }

    .vscode-dark body {
      color: var(--Color-Storm-Grey-300, #BDBCCC);
    }

    .vscode-light body {
      color: var(--Color-Deep-Purple-800, #1E1A2E);
      --card-bg: rgba(0, 0, 0, 0.03);
    }

    #view-home {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px;
      box-sizing: border-box;
    }

    .logo {
      width: 48px;
      height: 48px;
      margin-top: 8px;
    }

    .intro {
      margin: 16px 0 0 0;
      font-size: 14px;
      line-height: 17px;
    }

    .open-preview-btn {
      width: 100%;
      margin-top: 24px;
      padding: 10px 0;
      border: none;
      border-radius: 999px;
      background: var(--pink-color);
      color: #FFFFFF;
      font-family: "Recursive", serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .open-preview-btn:hover {
      background: #FF257C;
    }

    .upsell {
      margin-top: 56px;
      font-size: 12px;
      line-height: 15px;
    }

    .upsell-link {
      display: inline-block;
      margin-top: 8px;
      font-size: 12px;
      line-height: 20px;
      letter-spacing: -0.2px;
      text-decoration: underline;
      cursor: pointer;
      color: inherit;
    }

    /* The bundled Recursive subset has no arrow glyphs, so without this the
       arrow falls back to a thin, undersized serif glyph. */
    .upsell-link .arrow {
      font-family: var(--vscode-font-family, system-ui);
      font-size: 14px;
      line-height: 1;
      vertical-align: -1px;
    }

    .split-note {
      margin: 56px -16px 0 -16px;
      padding: 16px;
      background: var(--card-bg);
      border-radius: 4px;
      text-align: left;
      font-size: 10px;
      line-height: 14px;
    }

    .split-note-title {
      margin: 0 0 8px 0;
      font-size: 10px;
      font-weight: 700;
    }

    .split-note p {
      margin: 0;
    }
    </style>
</head>
<body>
    <section id="view-home">
        <img class="logo" src="${logoSrc}" alt="Mermaid Preview logo">
        <p class="intro">Generate, edit, and preview diagrams right in your editor for free.</p>
        <button id="openPreview" class="open-preview-btn">Open preview</button>

        <p class="upsell">
            Want to sync your account or AI features?<br>
            <a id="getExtension" class="upsell-link">Get the Mermaid Chart extension <span class="arrow">&#10132;</span></a>
        </p>

        <div class="split-note">
            <p class="split-note-title">Why two extensions?</p>
            <p>AI and cloud sync cost money to run. The paid extension funds Mermaid's open-source work and keeps this one free.</p>
        </div>
    </section>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('openPreview').addEventListener('click', () => {
            vscode.postMessage({ command: 'openPreview' });
        });

        document.getElementById('getExtension').addEventListener('click', () => {
            vscode.postMessage({ command: 'getExtension' });
        });
    </script>
</body>
</html>`;
}
