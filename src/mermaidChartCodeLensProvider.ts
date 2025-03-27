import * as vscode from "vscode";
import {  applyGutterIconDecoration, isAuxFile, MermaidChartToken } from "./util";
import { MermaidChartAuthenticationProvider } from "./mermaidChartAuthenticationProvider";
import { extractIdFromCode, extractMetadataFromCode, checkReferencedFiles, findDiagramContentStartPosition } from "./frontmatter";

export class MermaidChartCodeLensProvider implements vscode.CodeLensProvider {
  constructor(private mermaidChartTokens: MermaidChartToken[]) {}

  setMermaidChartTokens(mermaidChartTokens: MermaidChartToken[]) {
    this.mermaidChartTokens = mermaidChartTokens;
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const editor = vscode.window.activeTextEditor;
    if (!editor) return codeLenses;
  
    const session = await vscode.authentication.getSession(
      MermaidChartAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    if (editor?.document?.languageId.startsWith('mermaid')){
      this.provideCodeLensesForMermaid(document, codeLenses, session);
    } else {
      for (const token of this.mermaidChartTokens) {
        const documentText = editor.document.getText(token.range);
        const diagramId = extractIdFromCode(documentText);
        const isAux = isAuxFile(editor.document.fileName);
        if (isAux) {
          this.addAuxFileCodeLenses(codeLenses, token, session, diagramId);
        } else {
          this.addMainFileCodeLenses(codeLenses, token);
        }
      }
    }
  
    return codeLenses;
  }
  
  private addAuxFileCodeLenses(
    codeLenses: vscode.CodeLens[],
    token: MermaidChartToken,
    session: vscode.AuthenticationSession | undefined,
    diagramId: string | undefined
  ) {
    if (session && !diagramId) {
      codeLenses.push(this.createCodeLens(token, "Connect Diagram", "mermaid.connectDiagram", [token.uri, token.range]));
    } else if (session && diagramId) {
      codeLenses.push(this.createCodeLens(token, "Edit Diagram in Mermaid Chart", "extension.editMermaidChart", [diagramId]));
    }
    codeLenses.push(this.createCodeLens(token, "Edit Diagram", "mermaid.editAuxFile", [token.uri, token.range]));
  }
  
  private addMainFileCodeLenses(
    codeLenses: vscode.CodeLens[],
    token: MermaidChartToken
  ) {
    codeLenses.push(this.createCodeLens(token, "View Diagram", "mermaidChart.viewMermaidChart", [token.uuid]));
    codeLenses.push(this.createCodeLens(token, "Edit Diagram in Mermaid Chart", "extension.editMermaidChart", [token.uuid]));
    codeLenses.push(this.createCodeLens(token, "Edit Diagram", "mermaidChart.editLocally", [token.uuid]));
  }
  
  private createCodeLens(
    token: MermaidChartToken,
    title: string,
    command: string,
    args: any[]
  ): vscode.CodeLens {
    return new vscode.CodeLens(token.range, { title, command, arguments: args });
  }

  private provideCodeLensesForMermaid(document: vscode.TextDocument, codeLenses: vscode.CodeLens[], session: vscode.AuthenticationSession | undefined) {
    const text = document.getText();
    const metadata = extractMetadataFromCode(text);
    if (metadata?.references) {
      let workspacePath = '';
      
      // Handle untitled files differently
      if (document.uri.scheme === 'untitled') {
        // Use the first workspace folder as fallback for untitled files
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          workspacePath = workspaceFolders[0].uri.fsPath;
        }
      } else {
        // For regular files, use the containing workspace folder
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        workspacePath = workspaceFolder ? workspaceFolder.uri.fsPath : '';
      }
      
      // Only proceed with checking references if we have a valid workspace path
      if (workspacePath) {
        const changedReferencesList = checkReferencedFiles(metadata, workspacePath);
        if (changedReferencesList?.length > 0) {
          // Get the position where diagram text starts
          const diagramStartIndex = findDiagramContentStartPosition(text);
          const diagramStartPosition = document.positionAt(diagramStartIndex);
          
          // Create a range at the beginning of the line where diagram text starts
          const codeLensPosition = new vscode.Range(diagramStartPosition.line, 0, diagramStartPosition.line, 0);
          
          codeLenses.push(
            new vscode.CodeLens(codeLensPosition, {
              title: "▷ Regenerate Diagram",
              command: "mermaidChart.regenerateDiagram",
              arguments: [document.uri, metadata.query, changedReferencesList, metadata, session ? true: false],
            })
          );
          applyGutterIconDecoration(codeLensPosition);
        }
      }
    }
  }
}
