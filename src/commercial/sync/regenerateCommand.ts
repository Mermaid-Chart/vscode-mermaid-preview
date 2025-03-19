import * as vscode from "vscode";
import { DiagramRegenerator } from './diagramRegenerator';
import { MermaidChartVSCode } from "../../mermaidChartVSCode";

export function registerRegenerateCommand(context: vscode.ExtensionContext, mcAPI: MermaidChartVSCode) {
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.regenerateDiagram', 
      async (uri: vscode.Uri, originalQuery?: string, changedFiles?: string[], metadata?: any, isLoggedIn?: boolean) => {
        if (isLoggedIn) {
          await DiagramRegenerator.regenerateDiagram(uri, originalQuery, changedFiles, metadata);
        } else {
          const result = await vscode.window.showInformationMessage(
            'Please login to Mermaid Chart to regenerate diagrams.',
            { modal: true }, 
            'Login',
          );
          if (result === 'Login') {
            await mcAPI.login();
          } else {
            console.log('Login cancelled');
          }
        }
      }
    )
  );
} 