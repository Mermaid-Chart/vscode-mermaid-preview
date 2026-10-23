import * as vscode from "vscode";
import { MermaidChartToken } from "./util";
import { shouldPreviewOwnUi } from "./conflictHandle";

export class MermaidChartCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(private mermaidChartTokens: MermaidChartToken[]) {}

  setMermaidChartTokens(mermaidChartTokens: MermaidChartToken[]) {
    this.mermaidChartTokens = mermaidChartTokens;
    this._onDidChangeCodeLenses.fire();
  }

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CodeLens[]> {
    if (!(await shouldPreviewOwnUi())) {
      return [];
    }

    if (document.languageId.startsWith("mermaid")) {
      return [];
    }

    return this.mermaidChartTokens.map(
      (token) =>
        new vscode.CodeLens(token.range, {
          title: "Edit Diagram",
          command: "preview.mermaid.editAuxFile",
          arguments: [token.uri, token.range],
        }),
    );
  }
}
