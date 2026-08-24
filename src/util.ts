import * as vscode from "vscode";
import * as path from 'path';
import { extractIdFromCode } from "./frontmatter";

const activeListeners = new Map<string, vscode.Disposable>();
const REOPEN_CHECK_DELAY_MS = 500; // Delay before checking if temp file is reopened
import { getSampleDiagrams } from "./constants/diagramTemplates";
const config = vscode.workspace.getConfiguration();
export const defaultBaseURL = config.get<string>('preview.mermaid.baseUrl', 'https://www.mermaid.ai');
export const configSection = 'mermaid';


export const pattern : Record<string, RegExp> = {
  ".md": /```mermaid([\s\S]*?)```/g,
  ".html": /<div class=["']mermaid["']>([\s\S]*?)<\/div>/g,
  ".hugo": /{{<mermaid[^>]*>}}([\s\S]*?){{<\/mermaid>}}/g,
  ".rst": /\.\. mermaid::(?:[ \t]*)?$(?:(?:\n[ \t]+:(?:(?:\\:\s)|[^:])+:[^\n]*$)+\n)?((?:\n(?:[ \t][^\n]*)?$)+)?/gm,
};

export interface MermaidChartToken {
  uuid: string;
  title: string;
  range: vscode.Range;
  collapsibleState?: vscode.TreeItemCollapsibleState;
  uri?: vscode.Uri
}
export function findMermaidChartTokensFromAuxFiles(document: vscode.TextDocument): MermaidChartToken[] {
  const mermaidChartTokens: MermaidChartToken[] = [];
  const text = document.getText();
  const fileExt = path.extname(document.fileName);
  const regex = pattern[fileExt];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Get the full match range
    const fullRange = new vscode.Range(
      document.positionAt(match.index),
      document.positionAt(match.index + match[0].length)
    );

    // Extract only the Mermaid content (match[1] contains the content between delimiters)
    const contentStart = match.index + match[0].indexOf(match[1]);
    const contentRange = new vscode.Range(
      document.positionAt(contentStart),
      document.positionAt(contentStart + match[1].length)
    );

    const extractedId = extractIdFromCode(match[1]) || "";
    mermaidChartTokens.push({
      title: `Chart - ${extractedId}`,
      uri: document.uri,
      range: contentRange, // Use the content-only range
      uuid: extractedId,
    });
  }

  return mermaidChartTokens;
}

export function applyMermaidChartTokenHighlighting(
  editor: vscode.TextEditor,
  mermaidChartTokens: MermaidChartToken[],
  mermaidChartGutterIconDecoration: vscode.TextEditorDecorationType
) {
  const gutterIconDecorations: vscode.DecorationOptions[] = mermaidChartTokens.map(token => ({
    range: new vscode.Range(token.range.start, token.range.start), // Only first line for gutter icon
  }));
  editor.setDecorations(mermaidChartGutterIconDecoration, gutterIconDecorations);
}

export function syncAuxFile(tempFileUri: string, originalFileUri: vscode.Uri, range: vscode.Range) {
  
  if (activeListeners.has(tempFileUri)) {
    activeListeners.get(tempFileUri)?.dispose();
    activeListeners.delete(tempFileUri);
  }

  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.toString() === tempFileUri) {
      syncFiles(originalFileUri, event.document.getText(), range);
    }
  });

  activeListeners.set(tempFileUri, disposable);

  vscode.workspace.onDidCloseTextDocument((closedDoc) => {
    if (closedDoc.uri.toString() === tempFileUri) {
      setTimeout(() => {
        const isReopened = vscode.workspace.textDocuments.some(
          (doc) => doc.uri.toString() === tempFileUri
        );
        
        // Only remove the listener if the file was not reopened
        if (!isReopened) {
          activeListeners.get(tempFileUri)?.dispose();
          activeListeners.delete(tempFileUri);
        } 
      }, REOPEN_CHECK_DELAY_MS);
    }
  });
}

export function syncFiles(
  fileUri: vscode.Uri,
  mermaidCode: string,
  range: vscode.Range 
) {
  if (!mermaidCode || mermaidCode.trim() === "") {
    return;
  }

  vscode.workspace.openTextDocument(fileUri).then((doc) => {
    const text = doc.getText();
    const fileExt = fileUri.fsPath.split('.').pop()?.toLowerCase();

    const patterns: Record<string, RegExp> = {
      "md": /```mermaid([\s\S]*?)```/g,
      "html": /<div class=["']mermaid["']>([\s\S]*?)<\/div>/g,
      "hugo": /{{<mermaid[^>]*>}}([\s\S]*?){{<\/mermaid>}}/g,
      "rst": /\.\. mermaid::(?:[ \t]*)?$(?:(?:\n[ \t]+:(?:(?:\\:\s)|[^:])+:[^\n]*$)+\n)?((?:\n(?:[ \t][^\n]*)?$)+)?/gm
    };

    const startTags: Record<string, string> = {
      "md": "```mermaid\n",
      "html": '<div class="mermaid">\n',
      "hugo": "{{<mermaid>}}\n",
      "rst": ".. mermaid::\n" 
    };

    const endTags: Record<string, string> = {
      "md": "\n```",
      "html": "\n</div>",
      "hugo": "\n{{</mermaid>}}",
      "rst": "" 
    };

    if (!fileExt || !patterns[fileExt]) {
      vscode.window.showErrorMessage(`Unsupported file type: .${fileExt}`);
      return;
    }

    const regex = patterns[fileExt];
    let match = regex.exec(text);
    let lastMatchRange: vscode.Range | null = null;

    while (match) {
      const start = match.index;
      const end = start + match[0].length;
      lastMatchRange = new vscode.Range(doc.positionAt(start), doc.positionAt(end));
      
      if (lastMatchRange.contains(range.start)) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        let formattedCode = `${startTags[fileExt]}${mermaidCode}${endTags[fileExt]}`;

        // Add indentation for .rst files
        if (fileExt === "rst") {
          formattedCode = startTags[fileExt] + 
                          mermaidCode
                            .split("\n")
                            .map(line => `  ${line}`) // Add 2 spaces at the start of each line
                            .join("\n") + 
                          endTags[fileExt];
        }

        workspaceEdit.replace(fileUri, lastMatchRange, formattedCode);
        vscode.workspace.applyEdit(workspaceEdit);
        break; 
      }
      match = regex.exec(text); 
    }
  });
}

export function isAuxFile(fileName: string): boolean {
  const allowedExt = [".md", ".html", ".hugo", ".rst"];
  const fileExt = path.extname(fileName).toLowerCase();

  return allowedExt.includes(fileExt);
}
export const getHelpUrl = (diagramType: string) => {
  switch (diagramType) {
    case 'erdiagram': {
      diagramType = 'entityRelationshipDiagram';

      break;
    }
        case 'graph': {
      diagramType = 'flowchart';

      break;
    }
    case 'gitgraph': {
      diagramType = 'gitgraph';

      break;
    }
    case 'journey': {
      diagramType = 'userJourney';

      break;
    }
    case 'classdiagram': {
      diagramType = 'classDiagram';

      break;
    }
  
    case 'statediagram': {
      diagramType = 'stateDiagram';

      break;
    }
    case 'sequencediagram': {
      diagramType = 'sequenceDiagram';

      break;
    }

    case 'requirement':
    case 'requirementdiagram': {
      diagramType = 'requirementDiagram';

      break;
    }
    case 'xychart': {
      diagramType = 'xyChart';

      break;
    }
    case 'quadrantchart':{
      diagramType = 'quadrantChart';

      break;
    }
    
    case 'c4container':
    case 'c4component':
    case 'c4dynamic':
    case 'c4deployment':
    case 'c4context':{
      diagramType = 'c4';

      break;
    }
    case 'section': {
      diagramType = 'gantt';

      break;
    }
    case 'blockdiagram': {
      diagramType = 'block';

      break;
    }
    // No default
  }
  return diagramType
    ? (`https://mermaid.js.org/syntax/${diagramType}.html` as const)
    : ('https://mermaid.js.org/intro/' as const);
};



export function getDiagramTemplates() {
  return getSampleDiagrams(); 
}

export function triggerSuggestIfEmpty(document: vscode.TextDocument) {
  if (document.languageId.startsWith("mermaid") && document.getText().trim() === "") {
    setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document) {
        vscode.commands.executeCommand("editor.action.triggerSuggest");
      } 
    }, 100);
  }
}