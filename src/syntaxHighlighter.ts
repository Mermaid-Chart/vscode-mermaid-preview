import * as fs from 'fs';
import * as vscode from 'vscode';
import analytics from './analytics';

// Function to map the first word to a diagram type
export function getDiagramTypeFromWord(firstWord: string, diagramMappings: Record<string, string[]>): string | null {
  for (const [diagramType, aliases] of Object.entries(diagramMappings)) {
    if (aliases.map(alias => alias.toLowerCase()).includes(firstWord.toLowerCase())) {
      return diagramType;
    }
  }
  return null;
}

// Create a cache for loaded tmLanguage files
const tmLanguageCache: Record<string, any> = {};

// Function to load the .tmLanguage file with caching
export function loadTmLanguage(filePath: string): any | null {
  // Check if the file is already in cache
  if (tmLanguageCache[filePath]) {
    return tmLanguageCache[filePath];
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    // Store in cache for future use
    tmLanguageCache[filePath] = parsed;
    return parsed;
  } catch (error) {
    console.error(`Error loading tmLanguage file: ${filePath}`, error);
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

// Function to clear the cache (useful if files are updated)
export function clearTmLanguageCache(): void {
  Object.keys(tmLanguageCache).forEach(key => delete tmLanguageCache[key]);
}
