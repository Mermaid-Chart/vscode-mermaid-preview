import * as vscode from 'vscode';
import { IMermaidPreviewParameters } from './interfaces';
import { PreviewPanel } from '../../../panels/previewPanel';

export class MermaidPreviewTool implements vscode.LanguageModelTool<IMermaidPreviewParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IMermaidPreviewParameters>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    
    try {
      // If a documentUri is provided, use that existing document
      if (params.documentUri) {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(params.documentUri));
        PreviewPanel.createOrShow(document);
        
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Mermaid diagram preview opened for existing document.`)
        ]);
      }
      
      // Otherwise use the code parameter as before
      const activeEditor = vscode.window.activeTextEditor;
      const activeDocument = activeEditor?.document;
      
      if (!activeDocument || activeDocument.getText() !== params.code) {
        await vscode.commands.executeCommand(
          "mermaidChart.openResponsePreview", 
          params.code
        );
      } else {
        PreviewPanel.createOrShow(activeDocument);
      }
      
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Mermaid diagram preview opened successfully.${params.showSource ? ' Source code editor is also opened.' : ''}`)
      ]);
    } catch (error) {
      console.error("Error previewing Mermaid diagram:", error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      ]);
    }
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IMermaidPreviewParameters>,
    _token: vscode.CancellationToken
  ){
    return {
      invocationMessage: `Opening Mermaid diagram preview`,
      requiresConfirmation: false
    };
  }
} 