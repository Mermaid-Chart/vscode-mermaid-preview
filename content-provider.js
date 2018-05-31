const vscode = require("vscode");
const _ = require("lodash");
const fileUrl = require("file-url");

const findDiagram = require("./lib/find-diagram");
const usesFontAwesome = require("./lib/uses-fontawesome");

module.exports = class MermaidDocumentContentProvider {
  constructor(context) {
    this._onDidChange = new vscode.EventEmitter();
    this.update = _.throttle(this.unthrottledUpdate, 250);

    this.context = context;
  }

  provideTextDocumentContent(uri, token) {
    const config = JSON.stringify(vscode.workspace.getConfiguration("mermaid"));
    const mermaidUrl = fileUrl(
      this.context.asAbsolutePath("node_modules/mermaid/dist/mermaid.min.js")
    );
    const faBase = fileUrl(
      this.context.asAbsolutePath(
        "node_modules/font-awesome/css/font-awesome.min.css"
      )
    );

    const faStyle = usesFontAwesome(this.graph)
      ? `<link rel="stylesheet" href="${faBase}">`
      : "";

    const content = this.graph
      ? `<!DOCTYPE html>
        <html>
        <head>
            <base href="">
            <script src="${mermaidUrl}"></script>
            ${faStyle}
        </head>
        <body class="vscode-body">
            <div class="mermaid" style="height: 100vh">
            ${this.graph}
            </div>

            <div class="mermaid" style="position: fixed; top: 0; left: 0; width: 75px; height: 50px; z-index: 100; display: block">
            ${this.graph}
            </div>

            <script type="text/javascript">
                const style = document.body.classList.contains('vscode-dark') ? 'dark' : 'forest';

                const config = JSON.parse('${config}');
                config.startOnLoad = true;
                config.theme = style;

                if (style == 'dark') {
                  config.themeCSS = '.loopText tspan { fill: inherit; }';
                }

                mermaid.initialize(config);
            </script>
        </body>`
      : "select a diagram...";

    return content;
  }

  get onDidChange() {
    return this._onDidChange.event;
  }

  unthrottledUpdate(uri) {
    const editor = vscode.window.activeTextEditor;
    const text = editor.document.getText();
    const selStart = editor.document.offsetAt(editor.selection.anchor);

    const graph = /\.mmd$/.test(editor.document.fileName)
      ? text
      : findDiagram(text, selStart);

    if (graph) {
      this.graph = graph;
    } else {
      console.log("Cannot determine the rule's properties.");
      this.graph = null;
    }

    this._onDidChange.fire(uri);
  }
};
