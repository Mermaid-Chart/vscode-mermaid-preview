import * as vscode from 'vscode';
import { PreviewBridge } from "@mermaid-chart/vscode-utils";
import { PreviewPanel } from "../../../panels/previewPanel";

export class PreviewBridgeImpl implements PreviewBridge {
  async createOrShowPreview(documentUri?: string, code?: string): Promise<void> {
    try {
      // If a documentUri is provided, use that existing document
      if (documentUri) {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(documentUri));
        PreviewPanel.createOrShow(document);
        return;
      }
      
      // Otherwise use the code parameter
      if (code) {
        const activeEditor = vscode.window.activeTextEditor;
        const activeDocument = activeEditor?.document;
        
        if (!activeDocument || activeDocument.getText() !== code) {
          await vscode.commands.executeCommand(
            "mermaidChart.openResponsePreview", 
            code
          );
        } else {
          PreviewPanel.createOrShow(activeDocument);
        }
      }
    } catch (error) {
      console.error("Error in preview bridge:", error);
      throw error;
    }
  }
}