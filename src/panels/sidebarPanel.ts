import axios from "axios";
import * as vscode from "vscode";
import * as packageJson from "../../package.json";
import httpClient from "../httpClient";
import { generateWebviewContent, SidebarView } from "../templates/sidebarTemplate";
import { THIS_EXTENSION_ID } from "../conflictHandle";
import {
  enableTelemetrySetting,
  showFeaturePopupsSetting,
  updatePreviewSetting,
} from "../settings";

// Drives which title-bar icon variant is shown, so the open section reads as selected.
const SIDEBAR_VIEW_CONTEXT_KEY = "mermaidPreview:sidebarView";
const LAST_FEEDBACK_SUBMITTED_AT_KEY = "mermaidPreview.lastFeedbackSubmittedAt";
const FEEDBACK_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

/** Set to true only while testing the extension-side feedback flow locally. It will skip the rate limit check. */
/**
 * @todo Remove this once the feedback flow is fully tested.
 */
const feedbackRateLimitDisabledForTesting = true;

interface FeedbackSubmission {
  activity: string;
  frequency: string;
  details: string;
  email: string;
}

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
    void this.setCurrentView(this.currentView);
    this.postCurrentView();
    this.postSettings();

    // Collapsing the view is the only signal VS Code gives us for a click on the
    // "Mermaid Preview" title, so re-expanding always lands back on home.
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.postCurrentView();
        this.postSettings();
      } else {
        void this.setCurrentView("home");
      }
    });

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "openPreview") {
        await vscode.commands.executeCommand(
          "preview.mermaidChart.createMermaidFile",
          "sidebar"
        );
      }
      if (message.command === "getExtension") {
        await vscode.commands.executeCommand(
          "preview.mermaidChart.getChartExtension",
          "sidebar"
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
      if (message.command === "submitFeedback") {
        await this.submitFeedback(message.feedback);
      }
      if (message.command === "ready") {
        this.postCurrentView();
        this.postSettings();
      }
    });
  }

  async refresh() {
    if (!this._view) {
      return;
    }
    // Reloading the settings view restores the defaults, the same way reloading
    // the feedback view clears the form and returns to its first page.
    if (this.currentView === "settings") {
      await updatePreviewSetting("enableTelemetry", undefined);
      await updatePreviewSetting("showFeaturePopups", undefined);
    }
    this.updateWebviewContent();
    this.postCurrentView();
    this.postSettings();
  }

  async toggleView(view: SidebarView) {
    await this.setCurrentView(this.currentView === view ? "home" : view);
    await vscode.commands.executeCommand("preview_mermaidWebview.focus");
    this.postCurrentView();
    this.postSettings();
  }

  private async setCurrentView(view: SidebarView) {
    this.currentView = view;
    await vscode.commands.executeCommand("setContext", SIDEBAR_VIEW_CONTEXT_KEY, view);
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

  private async submitFeedback(feedback: FeedbackSubmission | undefined) {
    if (
      !feedback ||
      !feedback.activity ||
      !feedback.frequency ||
      !feedback.details?.trim() ||
      !feedback.email?.trim()
    ) {
      this.postFeedbackResult("error", "Please complete all feedback fields.");
      return;
    }

    const lastSubmittedAt = feedbackRateLimitDisabledForTesting
      ? undefined
      : this.context.globalState.get<number>(LAST_FEEDBACK_SUBMITTED_AT_KEY);
    if (
      lastSubmittedAt !== undefined &&
      Date.now() - lastSubmittedAt < FEEDBACK_RATE_LIMIT_MS
    ) {
      const message = "You can only send one feedback submission every 24 hours.";
      void vscode.window.showWarningMessage(message);
      this.postFeedbackResult("rateLimited", message);
      return;
    }

    try {
      await httpClient.post("/rest-api/plugins/feedback", {
        activity: feedback.activity,
        frequency: feedback.frequency,
        details: feedback.details.trim(),
        email: feedback.email.trim(),
        pluginSource: "vsCodePreview",
        extensionVersion: packageJson.version,
      });
      await this.context.globalState.update(
        LAST_FEEDBACK_SUBMITTED_AT_KEY,
        // Storing nothing in testing mode keeps a stale timestamp from blocking the next
        // real send once the flag goes back to false.
        feedbackRateLimitDisabledForTesting ? undefined : Date.now()
      );

      const message = "Thank you. Your feedback was sent.";
      void vscode.window.showInformationMessage(message);
      this.postFeedbackResult("success", message);
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message =
        status === 429
          ? "You can only send one feedback submission every 24 hours."
          : "Unable to send feedback. Please try again.";
      void vscode.window.showWarningMessage(message);
      this.postFeedbackResult(status === 429 ? "rateLimited" : "error", message);
    }
  }

  private postFeedbackResult(
    status: "success" | "error" | "rateLimited",
    message: string
  ) {
    void this._view?.webview.postMessage({ command: "feedbackResult", status, message });
  }
}
