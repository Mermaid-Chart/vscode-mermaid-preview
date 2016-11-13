// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const _ = require('lodash');

const findDiagram = require('./find-diagram');

class MermaidDocumentContentProvider {
    constructor (context) {
        this._onDidChange =  new vscode.EventEmitter();
        this.graph = '';
        this.update = _.throttle(this.unthrottledUpdate, 250);

        this.context = context;
    }

    provideTextDocumentContent (uri, token) {
        const config = JSON.stringify(vscode.workspace.getConfiguration('mermaid'));

        return `<!DOCTYPE html>
        <html>
        <head>
            <script src="${this.context.extensionPath}/node_modules/mermaid/dist/mermaid.min.js"></script>
        </head>
        <body>
            <div class="mermaid">
            ${this.graph}
            </div>

            <script type="text/javascript">
                css = document.createElement('link');
                style = document.body.classList.contains('vscode-dark') ? 'dark' : 'forest';
                
                css.setAttribute('rel', 'stylesheet');
                css.setAttribute('type', 'text/css');
                css.setAttribute('href', '${this.context.extensionPath}/node_modules/mermaid/dist/mermaid.' + style + '.css');

                document.head.appendChild(css);
                mermaidAPI.initialize(JSON.parse('${config}'));
            </script>
        </body>`;
    }
    
    get onDidChange () {
        return this._onDidChange.event;
    }
    
    unthrottledUpdate (uri) {
        const editor = vscode.window.activeTextEditor;
        const text = editor.document.getText();
        const selStart = editor.document.offsetAt(editor.selection.anchor);
        
        const graph = findDiagram(text, selStart);
        
        if (graph) {
            this.graph = graph;
        } else {
            console.log("Cannot determine the rule's properties.");
            this.graph = 'select a diagram...'
        }
        
        this._onDidChange.fire(uri);
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const registerCommand = vscode.commands.registerCommand;
    let previewUri = vscode.Uri.parse('mermaid-preview://authority/mermaid-preview');
    
    let provider = new MermaidDocumentContentProvider(context);
    let registration = vscode.workspace.registerTextDocumentContentProvider('mermaid-preview', provider);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "mermaid-preview" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = registerCommand('extension.previewMermaidDiagram', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Mermaid Preview').then((success) => {
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