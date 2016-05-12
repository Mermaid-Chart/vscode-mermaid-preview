// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

class MermaidProvider {
    constructor () {
        this._onDidChange =  new vscode.EventEmitter();
    }
    
    provideTextDocumentContent (uri, token) {
        console.log(uri, token);
        return 'preview';
    }
    
    get onDidChange () {
        return this._onDidChange.event;
    }
    
    update (uri) {
        this._onDidChange.fire(uri);
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const registerCommand = vscode.commands.registerCommand;
    let previewUri = vscode.Uri.parse('mermaid-preview://authority/mermaid-preview');
    
    let provider = new MermaidProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('mermaid-preview', provider);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "mermaid-preview" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = registerCommand('extension.previewMermaidDiagram', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two).then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });
    
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
            //vscode.window.showInformationMessage('changed');
        }
    });

    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor === vscode.window.activeTextEditor) {
            //provider.update(previewUri);
            //vscode.window.showInformationMessage('selected');
        }
    });
    
    context.subscriptions.push(disposable, registration);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;