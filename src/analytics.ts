import httpClient from './httpClient';
import * as vscode from "vscode";
import * as packageJson from '../package.json';
import { isPreviewTelemetryEnabled } from "./settings";

export interface PulseEventOptions {
  errorMessage?: string;
  diagramType?: string;
  pluginSource?: 'vsCodePreview';
}

class Analytics {

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
      ...options,
    };

    httpClient.post('/rest-api/plugins/pulse', payload).catch((error: unknown) => {
      console.error('Failed to send analytics event:', error);
    });
  }

  public trackException(error: unknown) {
    if (error instanceof Error) {
      this.sendEvent('VS Code Preview Extension Exception', 'VS_CODE_PREVIEW_PLUGIN_EXCEPTION', { errorMessage: error.message });
    } else {
      this.sendEvent('VS Code Preview Extension Exception', 'VS_CODE_PREVIEW_PLUGIN_EXCEPTION', { errorMessage: "Unknown error occurred" });
    }
  }

  public trackPreviewRenderFailed(errorMessage: string, diagramType?: string) {
    this.sendEvent('VS Code Preview Render Failed', 'VS_CODE_PLUGIN_PREVIEW_RENDER_FAILED', {
      errorMessage,
      diagramType,
    });
  }
}


export default new Analytics();
