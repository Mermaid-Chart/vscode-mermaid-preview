import * as vscode from 'vscode';
import * as path from 'path';
import { applySyntaxHighlighting, getDiagramTypeFromWord, getFirstWord } from './syntaxHighlighter';

const firstWordCache: Map<string, string> = new Map();


// Function to handle text document change events
export function handleTextDocumentChange(event: any, diagramMappings: { [key: string]: string[] }, isTextEditorChanged: boolean) {
  const document = event?.document;
  if (document) {
    const documentUri = document.uri.toString();
    const firstWord = getFirstWord(document.getText());
  
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
