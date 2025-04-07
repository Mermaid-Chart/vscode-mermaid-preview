
import { ValidationBridge } from '@mermaid-chart/vscode-utils';
import * as vscode from 'vscode';
import { getWebviewHTML } from '../../../templates/previewTemplate';

export class ValidationBridgeImpl implements ValidationBridge {

  async validateDiagram(code: string): Promise<{valid: boolean, error?: string}> {
     return new Promise<{valid: boolean, error?: string}>((resolve) => {
       // Create a webview panel but keep it invisible
       const panel = vscode.window.createWebviewPanel(
         'mermaidValidator',
         'Mermaid Validator',
         {
           viewColumn: vscode.ViewColumn.Two, // Use a real view column but we'll hide it soon
           preserveFocus: true
         },
         { 
           enableScripts: true,
           retainContextWhenHidden: true
         }
       );
       
       // Get extension path correctly
       const extensionPath = vscode.extensions.getExtension("MermaidChart.vscode-mermaid-chart")?.extensionPath;
       
       if (!extensionPath) {
         panel.dispose();
         resolve({ valid: false, error: "Unable to resolve the extension path" });
         return;
       }
       
       // Get the current active theme (dark or light)
       const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
       const config = vscode.workspace.getConfiguration();
       const darkTheme = config.get<string>("mermaid.vscode.dark", "dark");
       const lightTheme = config.get<string>("mermaid.vscode.light", "default");
       const currentTheme = isDarkTheme ? darkTheme : lightTheme;
       
       // Use the same template as the preview panel
       panel.webview.html = getWebviewHTML(panel, extensionPath, code, currentTheme, true);
       
       // We need to wait for the webview to load before hiding it
       setTimeout(() => {
         // Try to hide the panel by moving it to background
         panel.reveal(vscode.ViewColumn.Two, true);
       }, 200);
 
       // Set a timeout for validation
       const timeoutId = setTimeout(() => {
         resolve({ valid: false, error: 'Validation timed out' });
         panel.dispose();
       }, 20000); // Increased timeout to 15 seconds
       
       // Listen for validation results from the webview
       const disposable = panel.webview.onDidReceiveMessage(
         message => {
             resolve({
               valid: message.valid,
               error: message.valid ? undefined : message.message
             });
             panel.dispose();
             disposable.dispose();
             clearTimeout(timeoutId);
         }
       );
       
       // Send message to trigger validation mode
       setTimeout(() => {
         panel.webview.postMessage({ 
           type: 'update', 
           content: code,
           currentTheme: currentTheme,
           validateOnly: true
         });
       }, 1000); // Give more time for the webview to initialize
     });
   }
  }