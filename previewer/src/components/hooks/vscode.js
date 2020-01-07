let vscode = undefined;

try {
  vscode = acquireVsCodeApi();
} catch (e) {
  vscode = {
    postMessage: () => {}
  };
}

export const useVscode = () => vscode;
