import * as vscode from "vscode";
import { debounce } from "../utils/debounce";
import { getWebviewHTML } from "../templates/previewTemplate";
const DARK_THEME_KEY = "mermaid.vscode.dark";
const LIGHT_THEME_KEY = "mermaid.vscode.light";
const DEFAULT_DARK_THEME = "neo-dark";
const DEFAULT_LIGHT_THEME = "neo";
export class PreviewPanel {
  private static currentPanel: PreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private document: vscode.TextDocument;
  private readonly disposables: vscode.Disposable[] = [];
  private isFileChange = false;
  private readonly diagnosticsCollection: vscode.DiagnosticCollection;


  private constructor(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
    this.panel = panel;
    this.document = document;
    this.diagnosticsCollection = vscode.languages.createDiagnosticCollection("mermaid");


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
  
    // Get the current active theme (dark or light)
    const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;

    // Fetch the configuration from VSCode workspace
    const config = vscode.workspace.getConfiguration();

    // Get the theme settings from configuration
    const darkTheme = config.get<string>(DARK_THEME_KEY, "NA");
    const lightTheme = config.get<string>(LIGHT_THEME_KEY, "NA");

    // Determine the current theme based on the user's preference and the active color theme
    const currentTheme = isDarkTheme
      ? (darkTheme !== "NA" ? darkTheme : DEFAULT_DARK_THEME)
      : (lightTheme !== "NA" ? lightTheme : DEFAULT_LIGHT_THEME);

    // Initial content to be used (defaults to a single space if empty)
    const initialContent = this.document.getText() || " ";
  
    if (!this.panel.webview.html) {
      this.panel.webview.html = getWebviewHTML(this.panel, extensionPath, initialContent, currentTheme);
    }

    this.panel.webview.postMessage({
      type: "update",
      content: this.document.getText() || " ",
      currentTheme: currentTheme,
      isFileChange: this.isFileChange,
    });
    this.isFileChange = false;
  }

  private setupListeners() {
    const debouncedUpdate = debounce(() => this.update(), 300);

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === this.document) {
        debouncedUpdate();
      }
    }, this.disposables);
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (
        editor && 
        editor?.document && 
        (editor?.document?.fileName.endsWith('.mmd') || editor.document.fileName.endsWith('.mermaid') || editor.document.languageId.startsWith('mermaid')) && editor.document.uri.toString() !== this.document.uri.toString()
      ) {
          this.document = editor.document; 
          this.isFileChange = true; 
          debouncedUpdate(); 
      }
    }, this.disposables);
    vscode.window.onDidChangeActiveColorTheme(() => {
      this.update(); 
  }, this.disposables);

    this.panel.webview. onDidReceiveMessage((message) => {
      if (message.type === "error" && message.message) {
        this.handleDiagramError(message.message);
      } else if (message.type === "clearError") {
        this.diagnosticsCollection.clear();
    }
    });

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private handleDiagramError(errorMessage: string) {
    const diagnostics: vscode.Diagnostic[] = [];
    const errorDetails = this.getErrorLine(errorMessage);
  
    if (errorDetails) {
      const caretPositionMatch = errorMessage.match(/(\^)/);
      const lineText = errorMessage.split("\n")[1].trim();
      const caretIndex = caretPositionMatch?.index ?? 0;
      const wordsBeforeCaret = lineText.substring(0, caretIndex).split(/\s+/);
      const wordsAfterCaret = lineText.substring(caretIndex + 1).split(/\s+/);
  
      const startWord = wordsBeforeCaret[wordsBeforeCaret.length - 1];
      const endWord = wordsAfterCaret[0];
  
      const startCharacter = lineText.indexOf(startWord);
      const endCharacter = lineText.indexOf(endWord) + endWord.length;
  
      const range = new vscode.Range(
        errorDetails.line, 
        startCharacter, 
        errorDetails.line, 
        endCharacter
      );
  
      const diagnostic = new vscode.Diagnostic(
        range,
        `Syntax error: ${errorDetails.message}`,
        vscode.DiagnosticSeverity.Error
      );
      
      diagnostics.push(diagnostic);
    }
  
    this.diagnosticsCollection.clear();
    this.diagnosticsCollection.set(this.document.uri, diagnostics);
  }
  
  private getErrorLine(errorMessage: string): { line: number; message: string } | null {
  
    const match = errorMessage.match(/line (\d+):\s*([\s\S]+)/i); // Case-insensitive match for "line <number>: <message>"
    if (match) {
      const line = parseInt(match[1], 10) - 1; // Convert to zero-based index
      const message = errorMessage;
      return { line, message };
    }
    return null;
  }

  public dispose() {
    PreviewPanel.currentPanel = undefined;
    this.diagnosticsCollection.clear();
    this.diagnosticsCollection.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
