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
      // Create a temporary file with the Mermaid code if requested
    //   if (params.showSource) {
        // Check if there's a document with the same mermaid code already open
        const activeEditor = vscode.window.activeTextEditor;
        const activeDocument = activeEditor?.document;
        
        // Only open a new document if we don't already have one with this content or if no editor is open
        if (!activeDocument || activeDocument.getText() !== params.code) {
          // const document = await vscode.workspace.openTextDocument({
          //   content: params.code,
          //   language: 'mermaid'
          // });
          // await vscode.window.showTextDocument(document, { preview: false });
          await vscode.commands.executeCommand(
                "mermaidChart.openResponsePreview", 
                params.code
              );
        } else {
          PreviewPanel.createOrShow(activeDocument);
        }
    //   }
      
      // Open the diagram in the preview panel
    //   await vscode.commands.executeCommand(
    //     "mermaidChart.openResponsePreview", 
    //     params.code
    //   );
    // PreviewPanel.createOrShow(activeDocument);
      // Return the result
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