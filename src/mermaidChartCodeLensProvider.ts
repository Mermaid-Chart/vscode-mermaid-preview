import * as vscode from "vscode";
import { isAuxFile, MermaidChartToken } from "./util";
import { MermaidChartAuthenticationProvider } from "./mermaidChartAuthenticationProvider";
import { extractIdFromCode, extractMermaidCode } from "./frontmatter";
import path = require("path");

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
      { createIfNone: true }
    );
  
    for (const token of this.mermaidChartTokens) {
      const documentText = editor.document.getText(token.range);
      const mermaidCode = extractMermaidCode(documentText, path.extname(editor.document.fileName)).join("\n\n");
      const diagramId = extractIdFromCode(mermaidCode);
      const isAux = isAuxFile(editor.document.fileName);
      if (isAux) {
        this.addAuxFileCodeLenses(codeLenses, token, session, diagramId);
      } else {
        this.addMainFileCodeLenses(codeLenses, token);
      }
    }
  
    return codeLenses;
  }
  
  private addAuxFileCodeLenses(
    codeLenses: vscode.CodeLens[],
    token: MermaidChartToken,
    session: vscode.AuthenticationSession | undefined,
    diagramId: string | null
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
    codeLenses.push(this.createCodeLens(token, "View Diagram", "extension.viewMermaidChart", [token.uuid]));
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
}
