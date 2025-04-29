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

  public trackActivation() {
    this.sendEvent('VS Code Extension Activated','VS_CODE_PLUGIN_ACTIVATION');
  }

  public trackException(error: unknown) {
    if (error instanceof Error) {
      this.sendEvent('VS Code Extension Exception', 'VS_CODE_PLUGIN_EXCEPTION', error.message);
    } else {
      this.sendEvent('VS Code Extension Exception','VS_CODE_PLUGIN_EXCEPTION', "Unknown error occurred");
    }
  }

  public trackLogin() {
    this.sendEvent('VS Code User Logged In','VS_CODE_PLUGIN_LOGIN');
  }

  public trackLogout() {
    this.sendEvent('VS Code User Logged Out','VS_CODE_PLUGIN_LOGOUT');
  }

  public trackAIChatInvocation() {
    this.sendEvent('VS Code AI Chat Participant Invoked','VS_CODE_PLUGIN_AI_CHAT_INVOCATION');
  }
  
  public trackAIGeneratedDiagram(diagramType: string) {
    this.sendEvent(`VS Code AI Chat Generated Diagram`, 'VS_CODE_PLUGIN_AI_CHAT_GENERATE_DIAGRAM', undefined, diagramType);
  }
  
  public trackRegenerateCommandInvoked() {
    this.sendEvent('VS Code Regenerate Command Invoked','VS_CODE_PLUGIN_REGENERATE_DIAGRAM');
  }
  public trackModelNotFound() {
    this.sendEvent('VS Code AI  Model Not Found','VS_CODE_PLUGIN_MODEL_NOT_FOUND');
  }
}


export default new Analytics(); 