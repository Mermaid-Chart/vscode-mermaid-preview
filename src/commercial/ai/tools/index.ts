import * as vscode from 'vscode';
import { MermaidDiagramTool } from './diagramTool';

export function registerTools(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.lm.registerTool('mermaid-diagram-creator', new MermaidDiagramTool())
  );
  
  console.log('Registered Mermaid diagram tools for Copilot Agent Mode');
} 