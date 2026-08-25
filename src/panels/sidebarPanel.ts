import * as vscode from "vscode";
import { generateWebviewContent, SidebarView } from "../templates/sidebarTemplate";
import { MERMAID_CHART_EXTENSION_ID, THIS_EXTENSION_ID } from "../conflictHandle";
import {
  enableTelemetrySetting,
  showFeaturePopupsSetting,
  updatePreviewSetting,
} from "../settings";

export class MermaidWebviewProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  private _view?: vscode.WebviewView;
  private currentView: SidebarView = "home";

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (
          event.affectsConfiguration(enableTelemetrySetting) ||
          event.affectsConfiguration(showFeaturePopupsSetting) ||
          event.affectsConfiguration("telemetry.telemetryLevel")
        ) {
          this.postSettings();
        }
      })
    );
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView; 
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "images"),
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };
    this.updateWebviewContent();
    this.postCurrentView();
    this.postSettings();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "openPreview") {
        await vscode.commands.executeCommand("preview.mermaidChart.createMermaidFile");
      }
      if (message.command === "getExtension") {
        await vscode.commands.executeCommand(
          "workbench.extensions.search",
          `@id:${MERMAID_CHART_EXTENSION_ID}`
        );
      }
      if (message.command === "setTelemetry" && typeof message.enabled === "boolean") {
        await updatePreviewSetting("enableTelemetry", message.enabled);
      }
      if (message.command === "setFeaturePopups" && typeof message.enabled === "boolean") {
        await updatePreviewSetting("showFeaturePopups", message.enabled);
      }
      if (message.command === "openSettings") {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          `@ext:${THIS_EXTENSION_ID}`
        );
      }
      if (message.command === "ready") {
        this.postCurrentView();
        this.postSettings();
      }
    });
  }

  refresh() {
    if (this._view) {
      this.updateWebviewContent();
      this.postCurrentView();
      this.postSettings();
    }
  }

  async toggleView(view: SidebarView) {
    this.currentView = this.currentView === view ? "home" : view;
    await vscode.commands.executeCommand("preview_mermaidWebview.focus");
    this.postCurrentView();
    this.postSettings();
  }

  private updateWebviewContent() {
    if (this._view) {
      this._view.webview.html = generateWebviewContent(this._view.webview, this.context.extensionUri);
    }
  }

  private postCurrentView() {
    this._view?.webview.postMessage({ command: "showView", view: this.currentView });
  }

  private postSettings() {
    const configuration = vscode.workspace.getConfiguration("preview.mermaid");
    this._view?.webview.postMessage({
      command: "settingsChanged",
      enableTelemetry: configuration.get<boolean>("enableTelemetry", true),
      showFeaturePopups: configuration.get<boolean>("showFeaturePopups", true),
      vscodeTelemetryEnabled: vscode.env.isTelemetryEnabled,
    });
  }
}
