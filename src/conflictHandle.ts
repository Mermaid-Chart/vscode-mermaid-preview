import * as vscode from "vscode";
export const MERMAID_CHART_EXTENSION_ID = 'MermaidChart.vscode-mermaid-chart';
export const THIS_EXTENSION_ID = 'vstirbu.vscode-mermaid-preview';
export const IS_ACTIVE_CONTEXT_KEY = 'mermaidPreview:isActive';

export async function checkForOfficialExtension(context: vscode.ExtensionContext): Promise<boolean> {
  // Check if the official Mermaid Chart extension is installed
  const officialExtension = vscode.extensions.getExtension(MERMAID_CHART_EXTENSION_ID);
  
  if (officialExtension) {
    // Set context key to indicate we're not active
    await vscode.commands.executeCommand('setContext', IS_ACTIVE_CONTEXT_KEY, false);
    
    // Check if we've shown the message before
    const hasShownDeactivationMessage = context.globalState.get<boolean>('hasShownDeactivationMessage', false);
    
    // Only show the message if we haven't shown it before
    if (!hasShownDeactivationMessage) {
      vscode.window.showWarningMessage(
        'The Mermaid Chart extension is installed. Please refresh VS Code for changes to take effect.',
        'Refresh VS Code'
      ).then(selection => {
        if (selection === 'Refresh VS Code') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
      
      // Mark that we've shown the message
      await context.globalState.update('hasShownDeactivationMessage', true);
    }
    
    // Return false to prevent extension activation
    return false;
  }
  
  // If we get here, the official extension is not installed, so set active context
  await vscode.commands.executeCommand('setContext', IS_ACTIVE_CONTEXT_KEY, true);
  
  // Reset the flag if the official extension was uninstalled
  await context.globalState.update('hasShownDeactivationMessage', false);
  
  // Return true to continue with normal extension activation
  return true;
}
