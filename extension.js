// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const findDiagram = require('./lib/find-diagram');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  const registerCommand = vscode.commands.registerCommand;

  let command = registerCommand('mermaidPreview.start', () => {
    const _disposables = [];

    const panel = vscode.window.createWebviewPanel(
      'mermaidPreview',
      'Mermaid Preview',
      vscode.ViewColumn.Two,
      {
        enableScripts: true
      }
    );

    const getContent = () => {
      const config = vscode.workspace.getConfiguration('mermaid');
      const configString = JSON.stringify(config);
      const d3LibPath = 'node_modules/d3/build/d3.min.js';
      const d3Url = vscode.Uri.file(context.asAbsolutePath(d3LibPath)).with({
        scheme: 'vscode-resource'
      });
      const mermaidLibPath = 'node_modules/mermaid/dist/mermaid.min.js';
      const mermaidUrl = vscode.Uri.file(
        context.asAbsolutePath(mermaidLibPath)
      ).with({
        scheme: 'vscode-resource'
      });

      const fsStylesheetPath =
        'node_modules/font-awesome/css/font-awesome.min.css';
      const faBase = vscode.Uri.file(
        context.asAbsolutePath(fsStylesheetPath)
      ).with({
        scheme: 'vscode-resource'
      });

      return `
<!DOCTYPE html>
<html>
  <head>
    <base href="">
    <link rel="stylesheet" href="${faBase}">
    <script src="${mermaidUrl}"></script>
    <script src="${d3Url}"></script>
  </head>
  <body>
    <div id="diagram" class="mermaid" style="height: 100vh"></div>

    <div id="minimap" class="mermaid" style="position: fixed; top: 0; left: 0; width: 75px; height: 50px; z-index: 100; display: block"></div>
    <script>
      const minimap = document.getElementById('minimap');
      const diagram = document.getElementById('diagram');

      function recenter() {
        if (diagram.firstChild) {
          const element = d3.select(diagram.firstChild);
          const { height, width } = element.node().getClientRects()[0];

          diagram.firstChild.setAttribute('height', '100%');

          const zoomHandler = d3
            .zoom()
            .translateExtent([[-200, -200], [width + 200, height + 200]])
            .on('zoom', () => {
              d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation();

              element.attr('transform', d3.event.transform);
            });

          element.call(zoomHandler).on('touchmove.zoom', null);
        }
      }

      window.addEventListener('message', event => {
        const message = event.data;

        minimap.textContent = message.diagram;
        minimap.removeAttribute('data-processed');
        
        diagram.textContent = message.diagram;
        diagram.removeAttribute('data-processed');

        mermaid.init();
        recenter();
      });
      
      const config = JSON.parse('${configString}');
      config.startOnLoad = false;

      if (config.theme !== null) {
        const theme = document.body.classList.contains('vscode-dark') ? 'dark' : 'forest';

        config.theme = theme;
        
        if (theme === 'dark') {
          config.themeCSS = '.loopText tspan { fill: inherit; }';
        } else {
          config.themeCSS = '';
        }
      }
      
      mermaid.initialize(config);
      recenter();
    </script>
  </body>
</html>
`;
    };

    const previewHandler = () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor.document.getText();
      const cursor = editor.document.offsetAt(editor.selection.anchor);

      const diagram = /\.mmd$/.test(editor.document.fileName)
        ? text
        : findDiagram(text, cursor);

      panel.webview.postMessage({
        diagram
      });
    };

    vscode.workspace.onDidChangeTextDocument(
      e => {
        if (e.document === vscode.window.activeTextEditor.document) {
          previewHandler();
        }
      },
      null,
      _disposables
    );

    vscode.workspace.onDidChangeConfiguration(
      e => {
        panel.webview.html = getContent();
      },
      null,
      _disposables
    );

    vscode.window.onDidChangeTextEditorSelection(
      e => {
        if (e.textEditor === vscode.window.activeTextEditor) {
          previewHandler();
        }
      },
      null,
      _disposables
    );

    panel.onDidDispose(
      () => {
        console.log('panel closed');

        while (_disposables.length) {
          const item = _disposables.pop();
          if (item) {
            item.dispose();
          }
        }
      },
      null,
      context.subscriptions
    );

    panel.webview.html = getContent();
  });

  context.subscriptions.push(command);

  return {
    extendMarkdownIt(md) {
      const highlight = md.options.highlight;
      md.options.highlight = (code, lang) => {
        if (lang && lang.toLowerCase() === 'mermaid') {
          return `<div class="mermaid">${code}</div>`;
        }
        return highlight(code, lang);
      };
      return md;
    }
  };
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
  console.log('deactivated');
}
exports.deactivate = deactivate;
