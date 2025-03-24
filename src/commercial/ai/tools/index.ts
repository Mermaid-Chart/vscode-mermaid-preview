import * as vscode from 'vscode';
import { MermaidPreviewTool } from './previewTool';
import { MermaidValidationTool } from './validationTool';

export function registerTools(context: vscode.ExtensionContext): void {

  context.subscriptions.push(
    vscode.lm.registerTool(
      'mermaid-diagram-preview',
      new MermaidPreviewTool()
    ),
  );

  context.subscriptions.push(
    vscode.lm.registerTool(
      'mermaid-diagram-validator',
      new MermaidValidationTool()
    )
  );
  
  console.log('Registered Mermaid diagram tools for Copilot Agent Mode');
} 