import * as vscode from "vscode";
import { generateWebviewContent } from "../templates/loginTemplate";
import * as path from "path";

export class MermaidWebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView; 
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "images"),
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
        vscode.Uri.joinPath(this.context.extensionUri, "docs"),
      ],
    };
    this.updateWebviewContent();

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "signIn") {
        vscode.commands.executeCommand("preview.mermaidChart.login");
      }
      if (message.command === "getStarted") {
        vscode.commands.executeCommand("preview.mermaidChart.createMermaidFile").then(() => {
          vscode.commands.executeCommand('workbench.action.closePanel');
        });
      }
      if (message.command === "showFeatures") {
        const docPath = path.join(this.context.extensionPath, 'docs', message.type === 'local' ? 'mermaidpreview.md' : 'mermaid_preview.md');
        vscode.workspace.openTextDocument(docPath).then(doc => {
          vscode.commands.executeCommand('markdown.showPreview', doc.uri);
        });
      }
    });
  }

  
  
   refresh() {
    if (this._view) {
      this.updateWebviewContent();
    }
  }

 
  private updateWebviewContent() {
    if (this._view) {
      this._view.webview.html = generateWebviewContent(this._view.webview, this.context.extensionUri);
    }
  }
}
