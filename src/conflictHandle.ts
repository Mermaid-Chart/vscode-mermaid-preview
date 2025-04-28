import * as vscode from "vscode";
export const MERMAID_CHART_EXTENSION_ID = 'MermaidChart.vscode-mermaid-chart';
export const THIS_EXTENSION_ID = 'vstirbu.vscode-mermaid-preview';
export const DEACTIVATION_NOTIFIED_KEY = 'mermaidPreviewDeactivationNotified';
export const IS_ACTIVE_CONTEXT_KEY = 'mermaidPreview:isActive';

export const handleConflictingExtension = async (context: vscode.ExtensionContext) => {
    await vscode.commands.executeCommand('setContext', IS_ACTIVE_CONTEXT_KEY, false);
    
    const alreadyNotified = context.globalState.get(DEACTIVATION_NOTIFIED_KEY);
    console.log(`Already notified: ${alreadyNotified}`);
    
    if (!alreadyNotified) {
      await context.globalState.update(DEACTIVATION_NOTIFIED_KEY, "true");
      const reloadOption = "Reload VS Code";
      const selection = await vscode.window.showWarningMessage(
        `The "Mermaid Preview" extension (${THIS_EXTENSION_ID}) is deactivated because the official "Mermaid Chart" extension (${MERMAID_CHART_EXTENSION_ID}) is installed. Please use the "Mermaid Chart" extension and consider uninstalling "Mermaid Preview".`,
        reloadOption
      );

      if (selection === reloadOption) {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
    return true;
  };