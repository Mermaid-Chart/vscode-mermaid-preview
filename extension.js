// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const mermaid = require('mermaid');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    class MermaidDocumentContentProvider {
        constructor () {
            this._onDidChange =  new vscode.EventEmitter();
            this.graph = '';
        }
        
        provideTextDocumentContent (uri, token) {
            return `<!DOCTYPE html>
            <html>
            <head>
            <link href="${context.extensionPath}/node_modules/mermaid/dist/mermaid.forest.css" rel="stylesheet">
            <script src="${context.extensionPath}/node_modules/mermaid/dist/mermaid.min.js">
            <script type="text/javascript">
            mermaid.initialize({startOnLoad:true});
            </script>
            </head>
            <body>
            ${this.graph}
            </body>`;
        }
        
        get onDidChange () {
            return this._onDidChange.event;
        }
        
        update (uri) {
            let editor = vscode.window.activeTextEditor;
            let text = editor.document.getText();
            let selStart = editor.document.offsetAt(editor.selection.anchor);
            let propStart = text.lastIndexOf('<div ', selStart);
            let lastDivEnd = text.lastIndexOf('</div>', selStart);
            let propEnd = text.indexOf('</div>', selStart);
            
            console.log(propStart, lastDivEnd);
            
            if ((propStart === -1 || propEnd === -1)||
                (lastDivEnd !== -1 && propStart < lastDivEnd)) {
                console.log("Cannot determine the rule's properties.");
                this.graph = 'select a diagram...'
            } else {
                let graph = text.slice(propStart, propEnd + 6);
                this.graph = graph;
            }
            
            this._onDidChange.fire(uri);
        }
    }
    
    const registerCommand = vscode.commands.registerCommand;
    let previewUri = vscode.Uri.parse('mermaid-preview://authority/mermaid-preview');
    
    let provider = new MermaidDocumentContentProvider();
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
        }
    });

    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    });
    
    context.subscriptions.push(disposable, registration);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;