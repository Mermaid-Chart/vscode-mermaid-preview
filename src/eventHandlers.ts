import * as vscode from 'vscode';
import * as path from 'path';
import { applySyntaxHighlighting, getDiagramTypeFromWord, } from './syntaxHighlighter';
import { getFirstWordFromDiagram } from './frontmatter';

const firstWordCache: Map<string, string> = new Map();


// Function to handle text document change events
export function handleTextDocumentChange(
  event: vscode.TextDocumentChangeEvent | vscode.TextEditor | undefined,
  diagramMappings: { [key: string]: string[] },
  isTextEditorChanged: boolean
) {
  const document = (event as vscode.TextDocumentChangeEvent)?.document || (event as vscode.TextEditor)?.document;
  if (!document) {
    return;
  };

  const fileExt = path.extname(document.uri.fsPath);
  if ((!document.isUntitled && (fileExt === ".mmd" || fileExt === ".mermaid")) || document.isUntitled) {
    const documentUri = document.uri.toString();
    const firstWord = getFirstWordFromDiagram(document.getText());

    if ((firstWordCache.get(documentUri) === firstWord || firstWord === '') && !isTextEditorChanged) {
      return;
    }

    // Update the cache with the new first word
    firstWordCache.set(documentUri, firstWord);

    // Check if the first word matches any diagram type
    const diagramType = getDiagramTypeFromWord(firstWord, diagramMappings);

    if (diagramType) {
   
      const grammarPath = path.join(__dirname, '..', 'syntaxes', `mermaid-${diagramType}.tmLanguage.json`);

      // Apply the syntax highlighting from the appropriate .tmLanguage file
      applySyntaxHighlighting(document, grammarPath);
    }
  }
}
