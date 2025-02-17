import * as fs from 'fs';
import * as vscode from 'vscode';

// Function to map the first word to a diagram type
export function getDiagramTypeFromWord(firstWord: string, diagramMappings: Record<string, string[]>): string | null {
  for (const [diagramType, aliases] of Object.entries(diagramMappings)) {
    if (aliases.map(alias => alias.toLowerCase()).includes(firstWord.toLowerCase())) {
      return diagramType;
    }
  }
  return null;
}

// Function to load the .tmLanguage file
export function loadTmLanguage(filePath: string): any | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error loading tmLanguage file: ${filePath}`, err);
    return null;
  }
}

// Function to apply syntax highlighting
export function applySyntaxHighlighting(document: vscode.TextDocument, tmLanguageFilePath: string) {
  const tmLanguage = loadTmLanguage(tmLanguageFilePath);
  if (tmLanguage) {
    const languageId = `mermaid.${tmLanguage.name}`; // Get languageId from tmLanguage name

    // Set the text document language using languageId
    vscode.languages.setTextDocumentLanguage(document, languageId).then(
      () => {
        // console.log(`Applied syntax highlighting for ${languageId}`);
      },
      (error) => {
        console.error('Failed to apply syntax highlighting:', error);
      }
    );
  }
}
