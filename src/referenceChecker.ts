import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { extractMetadataFromCode } from './frontmatter';

export class ReferenceChecker {
  private fileModificationCache: Map<string, number> = new Map();
  private context: vscode.ExtensionContext;
  private lastCheckedDocument: string | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initialize();
  }

  private initialize() {
    // Register an event handler for when text documents are opened
    vscode.workspace.onDidOpenTextDocument(this.checkDocumentReferences.bind(this), null, this.context.subscriptions);
    
    // Register an event handler for when the active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        // Only check if this is a different document than the last one we checked
        const documentPath = editor.document.uri.fsPath;
        if (documentPath !== this.lastCheckedDocument) {
          this.checkDocumentReferences(editor.document);
          this.lastCheckedDocument = documentPath;
        }
      }
    }, null, this.context.subscriptions);
    
    // Also check the currently active editor if there is one
    if (vscode.window.activeTextEditor) {
      this.checkDocumentReferences(vscode.window.activeTextEditor.document);
      this.lastCheckedDocument = vscode.window.activeTextEditor.document.uri.fsPath;
    }
  }

  /**
   * Checks if references in a document have been modified since the document was created
   * @param document The document to check references for
   */
  private async checkDocumentReferences(document: vscode.TextDocument) {
    // Only process Mermaid files
    if (!document.fileName.endsWith('.mmd') && document.languageId !== 'mermaid') {
      return;
    }

    try {
      const content = document.getText();
      const metadata = extractMetadataFromCode(content);
      
      if (metadata.references.length === 0 || !metadata.generationTime) {
        return;
      }
      
      const changedReferences: string[] = [];
      
      for (const reference of metadata.references) {
        // Extract file path from reference (assuming format "File: /path/to/file")
        const match = reference.match(/File: (.*?)(\s|$|\()/);
        if (!match) continue;
        
        const filePath = match[1].trim();
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          changedReferences.push(`${path.basename(filePath)} (deleted)`);
          continue;
        }
        
        // Get last modification time
        const stats = fs.statSync(filePath);
        const lastModified = stats.mtimeMs;
        
        // If reference file was modified after diagram generation
        if (lastModified > metadata.generationTime.getTime()) {
          changedReferences.push(path.basename(filePath));
        }
      }
      
      // Show notification if any references have changed
      if (changedReferences.length > 0) {
        this.showChangedReferencesNotification(document.uri, changedReferences, metadata.query, metadata.model, metadata);
      }
    } catch (error) {
      console.error(`Error checking references for ${document.fileName}:`, error);
    }
  }

  /**
   * Shows a notification about changed reference files
   * @param documentUri The URI of the Mermaid document
   * @param changedFiles Array of changed file names
   * @param originalQuery The original query used to generate the diagram
   */
  private showChangedReferencesNotification(documentUri: vscode.Uri, changedFiles: string[], originalQuery?: string, model?: string, metadata?: any) {
    const fileNames = changedFiles.join(', ');
    const message = changedFiles.length === 1
      ? `Reference file has changed: ${fileNames}`
      : `Reference files have changed: ${fileNames}`;
    
    vscode.window.showWarningMessage(
      message,
      'Update Diagram'
    ).then(selection => {
      if (selection === 'Update Diagram') {
        // Extract metadata to get the model
        vscode.workspace.openTextDocument(documentUri).then(document => {
          const content = document.getText();
          // const metadata = extractMetadataFromCode(content);
          
          // Pass the original query, changed files, and model to the regenerate command
          vscode.commands.executeCommand(
            'mermaidChart.regenerateDiagram', 
            documentUri, 
            originalQuery, 
            changedFiles,
            model,
            metadata
          );
        });
      }
    });
  }

  /**
   * Shows a quick pick menu to select and open changed reference files
   * @param documentUri The URI of the Mermaid document
   * @param changedFiles Array of changed file names
   */
  // private async showChangedFilesQuickPick(documentUri: vscode.Uri, changedFiles: string[]) {
  //   const document = await vscode.workspace.openTextDocument(documentUri);
  //   const content = document.getText();
  //   const metadata = extractMetadataFromCode(content);
    
  //   const items: vscode.QuickPickItem[] = [];
    
  //   for (const reference of metadata.references) {
  //     const match = reference.match(/File: (.*?)(\s|$|\()/);
  //     if (!match) continue;
      
  //     const filePath = match[1].trim();
  //     const fileName = path.basename(filePath);
      
  //     if (changedFiles.includes(fileName) || changedFiles.includes(`${fileName} (deleted)`)) {
  //       items.push({
  //         label: fileName,
  //         description: filePath,
  //         detail: fs.existsSync(filePath) ? 'Modified' : 'Deleted'
  //       });
  //     }
  //   }
    
  //   const selected = await vscode.window.showQuickPick(items, {
  //     placeHolder: 'Select a reference file to open'
  //   });
    
    // if (selected && fs.existsSync(selected.description)) {
    //   const document = await vscode.workspace.openTextDocument(selected.description);
    //   await vscode.window.showTextDocument(document);
    // }
  // }
} 