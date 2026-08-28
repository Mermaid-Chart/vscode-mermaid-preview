import * as vscode from "vscode";

export type SidebarView = "home" | "settings" | "feedback";

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
  const settingsIconDark = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "images", "icons", "settings-dark.svg")
  );
  const settingsIconLight = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "images", "icons", "settings-light.svg")
  );
  const feedbackIconDark = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "images", "icons", "feedback-dark.svg")
  );
  const feedbackIconLight = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "images", "icons", "feedback-light.svg")
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

    .view {
      display: none;
      padding: 16px;
      box-sizing: border-box;
    }

    .view.is-active {
      display: flex;
      flex-direction: column;
    }

    #view-home {
      align-items: center;
      text-align: center;
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
    .arrow {
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

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .section-header .glyph {
      width: 14px;
      height: 14px;
    }

    .vscode-light .dark-icon,
    .vscode-dark .light-icon,
    .vscode-high-contrast .light-icon {
      display: none;
    }

    .setting-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
    }

    .setting-label {
      margin: 0;
      font-size: 13px;
    }

    .setting-description {
      margin: 2px 0 0 0;
      color: var(--text-color);
      font-size: 11px;
      line-height: 15px;
    }

    .toggle {
      position: relative;
      flex: 0 0 auto;
      width: 32px;
      height: 16px;
      margin-top: 2px;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: #4A4A55;
      cursor: pointer;
    }

    .toggle::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #E9E9EF;
      transition: left 120ms ease-in-out;
    }

    .toggle[aria-checked="true"] {
      background: var(--pink-color);
    }

    .toggle[aria-checked="true"]::after {
      left: 18px;
    }

    .settings-link {
      align-self: flex-start;
      margin-top: 8px;
      color: inherit;
      font-size: 12px;
      text-decoration: underline;
      cursor: pointer;
    }

    .feedback-intro {
      margin: 0;
      color: var(--text-color);
      font-size: 12px;
      line-height: 17px;
    }

    .open-form-btn {
      width: 100%;
      margin-top: 16px;
      padding: 10px 0;
      border: none;
      border-radius: 4px;
      background: var(--pink-color);
      color: #FFFFFF;
      font-family: "Recursive", serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .open-form-btn:hover {
      background: #FF257C;
    }

    .field {
      margin-bottom: 16px;
    }

    .field-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    .field select,
    .field input,
    .field textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid var(--vscode-input-border, #3D3D46);
      border-radius: 4px;
      outline: none;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: "Recursive", serif;
      font-size: 12px;
    }

    .field select:focus,
    .field input:focus,
    .field textarea:focus {
      border-color: var(--vscode-focusBorder);
    }

    .field textarea {
      min-height: 72px;
      resize: vertical;
    }

    .field select:invalid,
    .field input::placeholder,
    .field textarea::placeholder {
      color: var(--vscode-input-placeholderForeground, var(--text-color));
    }

    .send-btn {
      width: 100%;
      padding: 10px 0;
      border: none;
      border-radius: 4px;
      background: #453C6D;
      color: #FFFFFF;
      font-family: "Recursive", serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .send-btn:hover {
      background: #524877;
    }

    .send-btn:disabled {
      cursor: wait;
      opacity: 0.7;
    }

    .feedback-status {
      min-height: 18px;
      margin: 8px 0 0;
      color: var(--text-color);
      font-size: 11px;
      line-height: 15px;
    }
    </style>
</head>
<body>
    <section id="view-home" class="view is-active">
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

    <section id="view-settings" class="view">
        <div class="section-header">
            <img class="glyph dark-icon" src="${settingsIconDark}" alt="">
            <img class="glyph light-icon" src="${settingsIconLight}" alt="">
            <span>Settings</span>
        </div>

        <div class="setting-row">
            <div>
                <p class="setting-label">Share usage analytics</p>
                <p id="telemetryDescription" class="setting-description">On by default. Render bugs only.</p>
            </div>
            <button id="telemetryToggle" class="toggle" role="switch" aria-checked="true" aria-label="Share usage analytics"></button>
        </div>

        <div class="setting-row">
            <div>
                <p class="setting-label">"Feature moved" popups</p>
                <p class="setting-description">Notices when a feature moved to Mermaid Chart.</p>
            </div>
            <button id="featurePopupsToggle" class="toggle" role="switch" aria-checked="true" aria-label="Feature moved popups"></button>
        </div>

        <a id="openSettings" class="settings-link">Open VS code Mermaid settings <span class="arrow">&#10132;</span></a>
    </section>

    <section id="view-feedback" class="view">
        <div class="section-header">
            <img class="glyph dark-icon" src="${feedbackIconDark}" alt="">
            <img class="glyph light-icon" src="${feedbackIconLight}" alt="">
            <span>Send us feedback</span>
        </div>

        <p class="feedback-intro">Share feedback with the Mermaid team. Takes a minute, no account needed.</p>
        <button id="openFeedbackForm" class="open-form-btn">Open feedback form</button>
    </section>

    <section id="view-feedback-form" class="view">
        <div class="section-header">
            <img class="glyph dark-icon" src="${feedbackIconDark}" alt="">
            <img class="glyph light-icon" src="${feedbackIconLight}" alt="">
            <span>Send us feedback</span>
        </div>

        <form id="feedbackForm">
            <div class="field">
                <label class="field-label" for="feedbackActivity">What were you doing?</label>
                <select id="feedbackActivity" required>
                    <option value="" selected disabled hidden>Choose an activity</option>
                    <option>Previewing a diagram</option>
                    <option>Editing a diagram</option>
                    <option>Exporting a diagram</option>
                    <option>Previewing a markdown file</option>
                    <option>Something else</option>
                </select>
            </div>

            <div class="field">
                <label class="field-label" for="feedbackFrequency">How often?</label>
                <select id="feedbackFrequency" required>
                    <option value="" selected disabled hidden>Choose a frequency</option>
                    <option>Every time</option>
                    <option>Often</option>
                    <option>Sometimes</option>
                    <option>Only once</option>
                </select>
            </div>

            <div class="field">
                <label class="field-label" for="feedbackDetails">What blocked or bothered you?</label>
                <textarea id="feedbackDetails" required maxlength="4000" placeholder="Tell us what happened"></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="feedbackEmail">Email</label>
                <input id="feedbackEmail" type="email" required maxlength="320" placeholder="you@example.com">
            </div>

            <button id="sendFeedback" class="send-btn" type="submit">Send feedback</button>
            <p id="feedbackStatus" class="feedback-status" role="status" aria-live="polite"></p>
        </form>
    </section>

    <script>
        const vscode = acquireVsCodeApi();
        const telemetryToggle = document.getElementById('telemetryToggle');
        const featurePopupsToggle = document.getElementById('featurePopupsToggle');
        const feedbackForm = document.getElementById('feedbackForm');
        const sendFeedback = document.getElementById('sendFeedback');
        const feedbackStatus = document.getElementById('feedbackStatus');

        document.getElementById('openPreview').addEventListener('click', () => {
            vscode.postMessage({ command: 'openPreview' });
        });

        document.getElementById('getExtension').addEventListener('click', () => {
            vscode.postMessage({ command: 'getExtension' });
        });

        telemetryToggle.addEventListener('click', () => {
            vscode.postMessage({
                command: 'setTelemetry',
                enabled: telemetryToggle.getAttribute('aria-checked') !== 'true'
            });
        });

        featurePopupsToggle.addEventListener('click', () => {
            vscode.postMessage({
                command: 'setFeaturePopups',
                enabled: featurePopupsToggle.getAttribute('aria-checked') !== 'true'
            });
        });

        document.getElementById('openSettings').addEventListener('click', () => {
            vscode.postMessage({ command: 'openSettings' });
        });

        document.getElementById('openFeedbackForm').addEventListener('click', () => {
            document.querySelectorAll('.view').forEach((section) => {
                section.classList.toggle('is-active', section.id === 'view-feedback-form');
            });
        });

        feedbackForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!feedbackForm.reportValidity()) {
                return;
            }

            sendFeedback.disabled = true;
            sendFeedback.textContent = 'Sending...';
            feedbackStatus.textContent = '';
            vscode.postMessage({
                command: 'submitFeedback',
                feedback: {
                    activity: document.getElementById('feedbackActivity').value,
                    frequency: document.getElementById('feedbackFrequency').value,
                    details: document.getElementById('feedbackDetails').value,
                    email: document.getElementById('feedbackEmail').value
                }
            });
        });

        window.addEventListener('message', (event) => {
            if (event.data?.command === 'showView') {
                document.querySelectorAll('.view').forEach((section) => {
                    section.classList.toggle('is-active', section.id === 'view-' + event.data.view);
                });
            }

            if (event.data?.command === 'settingsChanged') {
                telemetryToggle.setAttribute('aria-checked', String(event.data.enableTelemetry));
                featurePopupsToggle.setAttribute('aria-checked', String(event.data.showFeaturePopups));
                document.getElementById('telemetryDescription').textContent =
                    event.data.vscodeTelemetryEnabled
                        ? 'On by default. Render bugs only.'
                        : 'Disabled by VS Code telemetry settings.';
            }

            if (event.data?.command === 'feedbackResult') {
                feedbackStatus.textContent = event.data.message;
                sendFeedback.disabled = false;
                sendFeedback.textContent = 'Send feedback';
                if (event.data.status === 'success') {
                    feedbackForm.reset();
                }
            }
        });

        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
}
