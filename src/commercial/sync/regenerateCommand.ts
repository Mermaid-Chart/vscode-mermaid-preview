import * as vscode from "vscode";
import { MermaidChartVSCode } from "../../mermaidChartVSCode";
import analytics from "../../analytics";
import { DiagramRegenerator } from '@mermaid-chart/vscode-utils';


export function registerRegenerateCommand(context: vscode.ExtensionContext, mcAPI: MermaidChartVSCode) {
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.regenerateDiagram', 
      async (uri: vscode.Uri, originalQuery?: string, changedFiles?: string[], metadata?: any, isLoggedIn?: boolean) => {
        // Track regenerate command invocation
        analytics.trackRegenerateCommandInvoked();
        
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