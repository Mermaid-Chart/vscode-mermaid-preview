// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const findDiagram = require('./lib/find-diagram');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  const registerCommand = vscode.commands.registerCommand;

  let command = registerCommand('mermaidPreview.start', () => {
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
  </head>
  <body>
    <div id="diagram" class="mermaid" style="height: 100vh"></div>

    <div id="minimap" class="mermaid" style="position: fixed; top: 0; left: 0; width: 75px; height: 50px; z-index: 100; display: block"></div>
    <script>
      const minimap = document.getElementById('minimap');
      const diagram = document.getElementById('diagram');
      const theme = document.body.classList.contains('vscode-dark') ? 'dark' : 'forest';

      window.addEventListener('message', event => {
        const message = event.data;

        minimap.textContent = message.diagram;
        minimap.removeAttribute('data-processed');
        
        diagram.textContent = message.diagram;
        diagram.removeAttribute('data-processed');

        mermaid.init();
      });
      
      const config = JSON.parse('${configString}');
      config.startOnLoad = false;
      config.theme = theme;
      
      if (theme === 'dark') {
        config.themeCSS = '.loopText tspan { fill: inherit; }';
      }
      
      mermaid.initialize(config);
    </script>
  </body>
</html>
`;
    };

    const previewHandler = () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor.document.getText();
      const cursor = editor.document.offsetAt(editor.selection.anchor);

      const diagram = findDiagram(text, cursor);

      panel.webview.postMessage({
        diagram
      });
    };

    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === vscode.window.activeTextEditor.document) {
        previewHandler();
      }
    });

    vscode.workspace.onDidChangeConfiguration(e => {
      panel.webview.html = getContent();
    });

    vscode.window.onDidChangeTextEditorSelection(e => {
      if (e.textEditor === vscode.window.activeTextEditor) {
        previewHandler();
      }
    });

    panel.onDidDispose(
      () => {
        console.log('panel closed');
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
function deactivate() {}
exports.deactivate = deactivate;
