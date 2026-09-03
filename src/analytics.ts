import httpClient from './httpClient';
import * as vscode from "vscode";
import * as packageJson from '../package.json';
import { isPreviewTelemetryEnabled } from "./settings";

/** Where the user started the action.
 *  commandPalette     — Command Palette (Preview Diagram / Create Diagram)
 *  contextMenu        — right-click in the editor (Preview Diagram)
 *  sidebar            — Open preview or the Chart call to action on the sidebar
 *  markdownCodeBlock  — a mermaid block in Markdown, via the Edit Diagram CodeLens
 *                       or the VS Code Markdown preview
 *  featureMovedPopup  — the "feature moved to Mermaid Chart" notification
 */
export type PreviewEntryPoint =
  | "commandPalette"
  | "contextMenu"
  | "featureMovedPopup"
  | "markdownCodeBlock"
  | "sidebar";

export type PreviewRenderErrorType =
  | "maxTextSizeExceeded"
  | "maxEdgesExceeded"
  | "unknownDiagramType"
  | "syntaxError";

export interface PulseEventOptions {
  action?: "PNG" | "SVG";
  creationMethod?: "command" | "sidebarAdd" | "markdownCodeBlock";
  diagramType?: string;
  entryPoint?: PreviewEntryPoint;
  errorMessage?: string;
  errorType?: PreviewRenderErrorType;
  isFirstPreviewOfSession?: boolean;
  pluginSource?: 'vsCodePreview';
  status?: "ok" | "failed";
}

class Analytics {
  private hasPreviewedInSession = false;

  public sendEvent(eventName: string, eventID: string, options?: PulseEventOptions) {
    if (!isPreviewTelemetryEnabled()) {
      return;
    }
    const analyticsID = vscode.env.machineId;
    const pluginID= packageJson.name === "vscode-mermaid-chart" ?  "MERMAIDCHART_VS_CODE_PLUGIN" : "MERMAID_PREVIEW_VS_CODE_PLUGIN";
    const payload = {
      analyticsID,
      pluginID,
      eventName,
      eventID,
      pluginSource: 'vsCodePreview' as const,
      extensionVersion: packageJson.version,
      vscodeVersion: vscode.version,
      ...options,
    };

    httpClient.post('/rest-api/plugins/pulse', payload).catch((error: unknown) => {
      console.error('Failed to send analytics event:', error);
    });
  }

  public trackException(error: unknown) {
    if (error instanceof Error) {
      this.sendEvent('VS Code Preview Extension Exception', 'VS_CODE_PREVIEW_EXCEPTION', { errorMessage: error.message });
    } else {
      this.sendEvent('VS Code Preview Extension Exception', 'VS_CODE_PREVIEW_EXCEPTION', { errorMessage: "Unknown error occurred" });
    }
  }

  // The diagram type is only known once mermaid has parsed the source in the webview,
  // which has not happened yet at creation time.
  public trackDiagramCreated(
    creationMethod: "command" | "sidebarAdd" | "markdownCodeBlock",
    entryPoint: PreviewEntryPoint,
    status: "ok" | "failed"
  ) {
    this.sendEvent(
      "VS Code Preview Diagram Created",
      "VS_CODE_PREVIEW_DIAGRAM_CREATED",
      { creationMethod, entryPoint, status }
    );
  }

  /** `status` is omitted for the Markdown preview, where mermaid runs in a webview owned
   *  by the built-in Markdown extension that cannot report the outcome back to us. */
  public trackDiagramPreviewed(
    entryPoint: PreviewEntryPoint,
    details: {
      status?: "ok" | "failed";
      diagramType?: string;
      errorType?: PreviewRenderErrorType;
      errorMessage?: string;
    } = {}
  ) {
    const isFirstPreviewOfSession = !this.hasPreviewedInSession;
    this.hasPreviewedInSession = true;

    this.sendEvent(
      "VS Code Preview Diagram Previewed",
      "VS_CODE_PREVIEW_DIAGRAM_PREVIEWED",
      { entryPoint, isFirstPreviewOfSession, ...details }
    );
  }

  /** A call to action that opens the Mermaid Chart extension in the Marketplace. */
  public trackInstallationClick(entryPoint: PreviewEntryPoint) {
    this.sendEvent(
      "VS Code Preview Installation Click",
      "VS_CODE_PREVIEW_INSTALLATION_CLICK",
      { entryPoint }
    );
  }

  public trackShowMoreClick() {
    this.sendEvent(
      "VS Code Preview Show More Click",
      "VS_CODE_PREVIEW_SHOW_MORE_CLICK",
      { entryPoint: "featureMovedPopup" }
    );
  }

  public trackPreviewExportAction(action: "PNG" | "SVG", diagramType?: string) {
    this.sendEvent(
      "VS Code Preview Export Action",
      "VS_CODE_PREVIEW_EXPORT_ACTION",
      { action, diagramType }
    );
  }
}


export default new Analytics();
