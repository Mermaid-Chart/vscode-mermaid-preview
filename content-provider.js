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
    const svgPanZoomUrl = fileUrl(this.context.asAbsolutePath('node_modules/svg-pan-zoom/dist/svg-pan-zoom.min.js'));
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
            <script src="${svgPanZoomUrl}"></script>
            ${faStyle}
        </head>
        <body>
            <div class="mermaid">
            ${this.graph}
            </div>

            <script type="text/javascript">
                const style = document.body.classList.contains('vscode-dark') ? 'dark' : 'forest';

                const config = JSON.parse('${config}');
                config.startOnLoad = true;
                config.theme = style;

                mermaid.initialize(config, () => {
                  console.log('rendered');
                });
                setTimeout(() => {
                  const target = document.getElementsByTagName('svg')[0];
                  const viewBox = target.getAttribute('viewBox');
                  const spz = svgPanZoom(target);
                  target.setAttribute('viewBox', viewBox);
                }, 200);
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
