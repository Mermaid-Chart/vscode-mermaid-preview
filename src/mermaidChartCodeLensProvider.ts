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
    const codeLenses: vscode.CodeLens[] = [];

    for (const token of this.mermaidChartTokens) {
      const viewCommand: vscode.Command = {
        title: "View Diagram",
        command: "extension.viewMermaidChart",
        arguments: [token.uuid],
      };

      const editCommand: vscode.Command = {
        title: "Edit Diagram",
        command: "extension.editMermaidChart",
        arguments: [token.uuid],
      };

      codeLenses.push(new vscode.CodeLens(token.range, viewCommand));
      codeLenses.push(new vscode.CodeLens(token.range, editCommand));
    }

    return codeLenses;
  }
}
