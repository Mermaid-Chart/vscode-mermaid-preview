import * as vscode from 'vscode';
import { IMermaidValidationParameters } from './interfaces';
import { getWebviewHTML } from '../../../templates/previewTemplate';

export class MermaidValidationTool implements vscode.LanguageModelTool<IMermaidValidationParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IMermaidValidationParameters>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    
    try {
      // Use the existing validation mechanism
      const validationResult = await this.validateUsingExistingTemplate(params.code);
      
      if (validationResult.valid) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`The Mermaid diagram syntax is valid.`)
        ]);
      } else {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Mermaid syntax error: ${validationResult.error || 'Unknown error'}`)
        ]);
      }
    } catch (error) {
      console.error("Error validating Mermaid diagram:", error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      ]);
    }
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IMermaidValidationParameters>,
    _token: vscode.CancellationToken
  ){
    return {
      invocationMessage: `Validating Mermaid diagram syntax`,
      requiresConfirmation: false
    };
  }
  
  /**
   * Validate Mermaid code using the existing Svelte app template
   * This leverages the same webview used for preview but with validation-only mode
   */
  private async validateUsingExistingTemplate(code: string): Promise<{valid: boolean, error?: string}> {
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
      panel.webview.html = getWebviewHTML(panel, extensionPath, code, currentTheme);
      
      // We need to wait for the webview to load before hiding it
      setTimeout(() => {
        // Try to hide the panel by moving it to background
        panel.reveal(vscode.ViewColumn.Two, true);
      }, 100);

      // Set a timeout for validation
      const timeoutId = setTimeout(() => {
        resolve({ valid: false, error: 'Validation timed out' });
        panel.dispose();
      }, 15000); // Increased timeout to 15 seconds
      
      // Listen for validation results from the webview
      const disposable = panel.webview.onDidReceiveMessage(
        message => {
          if (message.type === 'validationResult') {
            clearTimeout(timeoutId);
            resolve({
              valid: message.valid,
              error: message.valid ? undefined : message.message
            });
            panel.dispose();
            disposable.dispose();
          }
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