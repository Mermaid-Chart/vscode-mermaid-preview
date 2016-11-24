const vscode = require('vscode');
const _ = require('lodash');

const findDiagram = require('./find-diagram');

module.exports = class MermaidDocumentContentProvider {
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
            <base href="">
            <script src="${this.context.extensionPath}/node_modules/mermaid/dist/mermaid.min.js"></script>
        </head>
        <body>
            <script type="text/javascript">
                css = document.createElement('link');
                style = document.body.classList.contains('vscode-dark') ? 'dark' : 'forest';
                
                css.setAttribute('rel', 'stylesheet');
                // css.setAttribute('type', 'text/css');
                css.setAttribute('href', '${this.context.extensionPath}/node_modules/mermaid/dist/mermaid.' + style + '.css');

                document.body.appendChild(css);
            </script>

            <div class="mermaid">
            ${this.graph}
            </div>

            <script type="text/javascript">
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