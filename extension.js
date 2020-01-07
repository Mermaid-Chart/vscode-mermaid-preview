// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const findDiagram = require('./lib/find-diagram');

const getContent = ({ context }) => {
  const config = vscode.workspace.getConfiguration('mermaid');
  const configString = JSON.stringify(config);

  const faBase = vscode.Uri.file(
    context.asAbsolutePath(
      'previewer/dist/vendor/font-awesome/css/font-awesome.min.css'
    )
  ).with({
    scheme: 'vscode-resource'
  });

  const jsUrl = vscode.Uri.file(
    context.asAbsolutePath('previewer/dist/index.js')
  ).with({
    scheme: 'vscode-resource'
  });

  return `
<!DOCTYPE html>
<html>
  <head>
    <base href="">
    <link rel="stylesheet" href="${faBase}">
    <script>
      window._config = JSON.parse('${configString}');
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script src="${jsUrl}" />
  </body>
</html>
`;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  let panel;

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidPreview.start', () => {
      const _disposables = [];

      panel = vscode.window.createWebviewPanel(
        'mermaidPreview',
        'Mermaid Preview',
        vscode.ViewColumn.Two,
        {
          enableScripts: true
        }
      );

      const previewHandler = () => {
        const editor = vscode.window.activeTextEditor;
        const text = editor.document.getText();
        const cursor = editor.document.offsetAt(editor.selection.anchor);

        const diagram = /\.mmd$/.test(editor.document.fileName)
          ? text
          : findDiagram(text, cursor);

        panel.webview.postMessage({
          command: 'render',
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
          panel.webview.html = getContent({ context });
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

      panel.webview.html = getContent({ context });
    })
  );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
  console.log('deactivated');
}

exports.deactivate = deactivate;
