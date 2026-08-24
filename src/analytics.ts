import httpClient from './httpClient';
import * as vscode from "vscode";
import * as packageJson from '../package.json';

class Analytics {

  public sendEvent(eventName: string, eventID:string, errorMessage?: string, diagramType?:string) {
    const analyticsID = vscode.env.machineId;
    const pluginID= packageJson.name === "vscode-mermaid-chart" ?  "MERMAIDCHART_VS_CODE_PLUGIN" : "MERMAID_PREVIEW_VS_CODE_PLUGIN";
    const payload = {
      analyticsID,
      pluginID,
      eventName,
      eventID,
      errorMessage,
      diagramType
    };

    httpClient.post('/rest-api/plugins/pulse', payload).catch((error: unknown) => {
      console.error('Failed to send analytics event:', error);
    });
  }

  public trackException(error: unknown) {
    if (error instanceof Error) {
      this.sendEvent('VS Code Extension Exception', 'VS_CODE_PLUGIN_EXCEPTION', error.message);
    } else {
      this.sendEvent('VS Code Extension Exception','VS_CODE_PLUGIN_EXCEPTION', "Unknown error occurred");
    }
  }
}


export default new Analytics(); 