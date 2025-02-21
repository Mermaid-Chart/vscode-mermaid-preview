import * as vscode from "vscode";
import { generateWebviewContent } from "../templates/loginTemplate";
export class MermaidWebviewProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  private _view?: vscode.WebviewView;

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
      ],
    };
    this.updateWebviewContent();



   
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "signIn") {
        vscode.commands.executeCommand("mermaidChart.login");
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
