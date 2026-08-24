import * as vscode from "vscode";
import { MermaidChartToken } from "./util";

export class MermaidChartCodeLensProvider implements vscode.CodeLensProvider {
  constructor(private mermaidChartTokens: MermaidChartToken[]) {}

  setMermaidChartTokens(mermaidChartTokens: MermaidChartToken[]) {
    this.mermaidChartTokens = mermaidChartTokens;
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    if (document.languageId.startsWith("mermaid")) {
      return [];
    }

    return this.mermaidChartTokens.map(
      (token) =>
        new vscode.CodeLens(token.range, {
          title: "Edit Diagram",
          command: "preview.mermaid.editAuxFile",
          arguments: [token.uri, token.range],
        })
    );
  }
}
