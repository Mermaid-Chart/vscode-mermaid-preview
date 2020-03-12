// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const findDiagram = require('./lib/find-diagram');

const getContent = ({ context }) => {
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
  let previewPanel;

  let renderedDiagram;

  const _disposables = [];

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidPreview.start', () => {
      const previewHandler = () => {
        const editor = vscode.window.activeTextEditor;
        const text = editor.document.getText();
        const cursor = editor.document.offsetAt(editor.selection.anchor);

        const diagram = /\.mmd$/.test(editor.document.fileName)
          ? text
          : findDiagram(text, cursor);

        previewPanel.webview.postMessage({
          command: 'render',
          diagram
        });

        renderedDiagram = diagram;
      };

      if (previewPanel === undefined) {
        previewPanel = vscode.window.createWebviewPanel(
          'mermaidPreview',
          'Mermaid Preview',
          vscode.ViewColumn.Two,
          {
            enableScripts: true
          }
        );

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
            previewPanel.webview.html = getContent({ context });
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

        previewPanel.onDidDispose(
          () => {
            console.log('panel closed');

            while (_disposables.length) {
              const item = _disposables.pop();
              if (item) {
                item.dispose();
              }
            }

            previewPanel = undefined;
          },
          null,
          context.subscriptions
        );

        previewPanel.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case 'ready':
                previewPanel.webview.postMessage({
                  command: 'configure',
                  configuration: vscode.workspace.getConfiguration('mermaid')
                });
              default:
            }
          },
          undefined,
          _disposables
        );
      }

      previewPanel.webview.html = getContent({ context });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidPreview.export', () => {
      const disposables = [];

      if (!renderedDiagram)
        return vscode.window.showWarningMessage('Preview a diagram first');

      const exportPanel = vscode.window.createWebviewPanel(
        'mermaidExport',
        'Mermaid Export',
        vscode.ViewColumn.Two,
        {
          enableScripts: true
        }
      );

      exportPanel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'ready':
              const configuration = vscode.workspace.getConfiguration(
                'mermaid'
              );

              exportPanel.webview.postMessage({
                command: 'configure',
                configuration: {
                  ...configuration,
                  theme: 'neutral'
                }
              });

              exportPanel.webview.postMessage({
                command: 'export',
                diagram: renderedDiagram
              });
              break;
            case 'svg':
              console.log(message);

              // exportPanel.dispose();
              break;
            default:
          }
        },
        undefined,
        disposables
      );

      previewPanel.onDidDispose(
        () => {
          console.log('export panel closed');

          while (disposables.length) {
            const item = disposables.pop();
            if (item) {
              item.dispose();
            }
          }

          previewPanel = undefined;
        },
        null,
        disposables
      );

      exportPanel.webview.html = getContent({ context });
    })
  );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
  console.log('deactivated');
}

exports.deactivate = deactivate;
