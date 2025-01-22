import * as vscode from "vscode";
import { debounce } from "../utils/debounce";
import { getWebviewHTML } from "../templates/previewTemplate";
export class PreviewPanel {
  private static currentPanel: PreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private document: vscode.TextDocument;
  private readonly disposables: vscode.Disposable[] = [];
  private isFileChange = false;

  private constructor(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
    this.panel = panel;
    this.document = document;

    this.update();
    this.setupListeners();
  }

  public static createOrShow(document: vscode.TextDocument) {
    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "mermaidPreview",
      "Mermaid Preview",
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    PreviewPanel.currentPanel = new PreviewPanel(panel, document);
  }

  private update() {
    const extensionPath = vscode.extensions.getExtension("MermaidChart.vscode-mermaid-chart")?.extensionPath;

    if (!extensionPath) {
      throw new Error("Unable to resolve the extension path");
    }

    if (!this.panel.webview.html) {
    this.panel.webview.html = getWebviewHTML(this.panel, extensionPath);
    }

    const isDarkTheme =
        vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
      const theme = isDarkTheme ? "neo-dark" : "neo";

    this.panel.webview.postMessage({
      type: "update",
      content: this.document.getText(),
      currentTheme: theme,
      isFileChange:this.isFileChange
    });
    this.isFileChange=false
  }

  private setupListeners() {
    const debouncedUpdate = debounce(() => this.update(), 300);

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === this.document) {
        debouncedUpdate();
      }
    }, this.disposables);
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document !== this.document) {
        if (editor.document.uri.toString() !== this.document.uri.toString()) {
          this.document = editor.document; 
          this.isFileChange = true; 
          debouncedUpdate(); 
        }
      }
    }, this.disposables);


    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public dispose() {
    PreviewPanel.currentPanel = undefined;

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
