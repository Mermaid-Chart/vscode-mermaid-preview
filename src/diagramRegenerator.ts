import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { 
  splitFrontMatter, 
  addMetadataToFrontmatter 
} from './frontmatter';

/**
 * Class responsible for regenerating Mermaid diagrams
 */
export class DiagramRegenerator {
  /**
   * Regenerates a Mermaid diagram based on changes to reference files
   * @param uri The URI of the diagram file
   * @param originalQuery The original query used to generate the diagram
   * @param changedFiles Array of changed file names
   * @param model The model to use for regeneration
   */
  public static async regenerateDiagram(
    uri: vscode.Uri, 
    originalQuery?: string, 
    changedFiles?: string[], 
    model?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Open the document
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();
            
      // Extract the diagram code (without frontmatter)
      const { diagramText } = splitFrontMatter(content);
      
      // Create the prompt
      const prompt = this.createPrompt(diagramText, originalQuery, changedFiles);
      
      // Process reference files
      const referenceInfo = await this.processReferenceFiles(metadata.references, changedFiles || []);
      const fullPrompt = prompt + (referenceInfo ? "\n\n" + referenceInfo : "");
      
      // Create a progress notification
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Updating Mermaid diagram...",
        cancellable: false
      }, async (progress) => {
        try {
          // Get the model and send the request
          const updatedDiagram = await this.getUpdatedDiagramFromAI(fullPrompt, model || metadata.model);
          
          // Update the document
          await this.updateDocument(uri, document, updatedDiagram, metadata);
          
          vscode.window.showInformationMessage("Mermaid diagram updated successfully");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          vscode.window.showErrorMessage(`Error updating diagram: ${errorMessage}`);
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Error updating diagram: ${errorMessage}`);
    }
  }
  
  /**
   * Creates a prompt for the AI
   * @param diagramText The current diagram text
   * @param originalQuery The original query used to generate the diagram
   * @param changedFiles Array of changed file names
   * @returns The prompt text
   */
  private static createPrompt(
    diagramText: string, 
    originalQuery?: string, 
    changedFiles?: string[]
  ): string {
    let prompt = `Update this Mermaid diagram based on changes to the following files: ${changedFiles?.join(', ')}.\n\n`;
    prompt += "Stay as close as possible to the attached diagram generated in a previous diagram generation.\n\n";
    
    if (originalQuery) {
      prompt += `Original query: ${originalQuery}\n\n`;
    }
    
    prompt += `Current diagram:\n\`\`\`mermaid\n${diagramText}\n\`\`\`\n\n`;
    
    return prompt;
  }
  
  /**
   * Processes reference files for the diagram update
   * @param allReferences Array of all reference file paths
   * @param changedFiles Array of changed file names
   * @returns Formatted string with context information
   */
  private static async processReferenceFiles(
    allReferences: string[], 
    changedFiles: string[]
  ): Promise<string> {
    if (!allReferences || allReferences.length === 0) {
      return '';
    }
    
    const changedFileContents: string[] = [];
    const unchangedFiles: string[] = [];
    const deletedFiles: string[] = [];
    
    // Get workspace folder path to resolve relative paths
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspacePath = workspaceFolders && workspaceFolders.length > 0 
      ? workspaceFolders[0].uri.fsPath 
      : '';
    
    for (const reference of allReferences) {
      const match = reference.match(/File: (.*?)(\s|$|\()/);
      if (!match) continue;
      
      let filePath = match[1].trim();
      const fileName = path.basename(filePath);
      
      // Resolve relative paths if needed
      if (!path.isAbsolute(filePath) && workspacePath) {
        // Check if the relative path starts with the workspace folder name
        const workspaceFolderName = path.basename(workspacePath);
        if (filePath.startsWith(workspaceFolderName + '/')) {
          // Remove the duplicate workspace folder name from the path
          const relativePath = filePath.substring(workspaceFolderName.length + 1);
          filePath = path.join(workspacePath, relativePath);
        } else {
          filePath = path.join(workspacePath, filePath);
        }
      }
      
      // Check if this is a changed file
      const isChanged = changedFiles && changedFiles.some(cf => 
        cf === fileName || cf === `${fileName} (deleted)`
      );
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        if (isChanged) {
          // For changed files, include the content
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const extension = path.extname(fileName).substring(1);
            
            changedFileContents.push(`File: ${fileName} (modified)\n\`\`\`${extension}\n${fileContent}\n\`\`\``);
          } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
          }
        } else {
          // For unchanged files, just list them
          unchangedFiles.push(fileName);
        }
      } else {
        // For deleted files
        deletedFiles.push(fileName);
      }
    }
    
    let result = '';
    
    // Add changed file contents
    if (changedFileContents.length > 0) {
      result += "Modified reference files (with updated content):\n\n" + changedFileContents.join("\n\n") + "\n\n";
    }
    
    // Add deleted files
    if (deletedFiles.length > 0) {
      result += "Deleted reference files (remove from diagram):\n" + 
        deletedFiles.map(f => `- ${f}`).join("\n") + "\n\n";
    }
    
    // Add unchanged files
    if (unchangedFiles.length > 0) {
      result += "Unchanged reference files (keep in diagram):\n" + 
        unchangedFiles.map(f => `- ${f}`).join("\n") + "\n\n";
    }
    
    return result;
  }
  
  /**
   * Gets an updated diagram from the AI
   * @param prompt The prompt to send to the AI
   * @param modelName The name of the model to use
   * @returns The updated diagram text
   */
  private static async getUpdatedDiagramFromAI(prompt: string, modelName?: string): Promise<any> {
    try {

      let [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
      });
  
      // init the chat message
      const messages = [
        vscode.LanguageModelChatMessage.User(prompt),
      ];
  
      // make sure the model is available
      if (model) {
        // send the messages array to the model and get the response
        let chatResponse = await model.sendRequest(
          messages,
          {},
          new vscode.CancellationTokenSource().token
        );
        let fullResponse = '';
        for await (const fragment of chatResponse.text) {
          fullResponse += fragment;
        }
        
        // Extract the Mermaid code block
        const mermaidRegex = /```mermaid\s*([\s\S]*?)```/;
        const match = fullResponse.match(mermaidRegex);
        
        if (match && match[1]) {
          return match[1].trim();
        } else {
          // If no code block found, check if the entire response might be valid Mermaid
          return fullResponse.trim();
        }
      }
    } catch (error) {
      console.error('Error getting updated diagram from AI:', error);
      throw new Error(`Failed to generate diagram: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Updates the document with the new diagram
   * @param uri The URI of the document
   * @param document The document to update
   * @param updatedDiagram The updated diagram text
   * @param metadata The original metadata
   */
  private static async updateDocument(
    uri: vscode.Uri, 
    document: vscode.TextDocument, 
    updatedDiagram: string, 
    metadata: any
  ): Promise<void> {
    // Get the original diagram content
    const content = document.getText();
    const { diagramText } = splitFrontMatter(content);
    
    // If diagrams are identical, no need to show suggestion
    if (diagramText.trim() === updatedDiagram.trim()) {
      vscode.window.showInformationMessage("No changes needed to the diagram");
      return;
    }
    
    // Update metadata
    const updatedMetadata = {
      query: metadata.query,
      references: metadata.references,
      model: metadata.model
    };
    
    // Use the existing addMetadataToFrontmatter function from frontmatter.ts
    const updatedContent = addMetadataToFrontmatter(updatedDiagram, updatedMetadata);
    
    // Create a temporary file with the updated content
    const tempDir = vscode.Uri.joinPath(uri.with({ path: uri.path.split('/').slice(0, -1).join('/') }), '.temp');
    const tempUri = vscode.Uri.joinPath(tempDir, `${path.basename(uri.fsPath)}.new`);
    
    try {
      // Ensure temp directory exists
      await vscode.workspace.fs.createDirectory(tempDir);
      
      // Write updated content to temp file
      await vscode.workspace.fs.writeFile(tempUri, Buffer.from(updatedContent));
      
      // Show options directly without redirecting first
      const applyButton = 'Apply Changes';
      const applyAndViewDiffButton = 'Apply and View Diff';
      
      const choice = await vscode.window.showInformationMessage(
        'Mermaid diagram has been updated. What would you like to do?',
        { modal: false },
        applyButton,
        applyAndViewDiffButton
      );
      
      if (choice === applyButton) {
        // Apply the changes directly
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), updatedContent);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage("Diagram updated successfully");
      } else if (choice === applyAndViewDiffButton) {
        // First apply the changes
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), updatedContent);
        await vscode.workspace.applyEdit(edit);
        
        // Create a temporary file with the original content for diff view
        const originalTempUri = vscode.Uri.joinPath(tempDir, `${path.basename(uri.fsPath)}.original`);
        await vscode.workspace.fs.writeFile(originalTempUri, Buffer.from(content));
        
        // Show diff view with original on left and updated on right
        const diffTitle = `Diagram Update: ${path.basename(uri.fsPath)}`;
        await vscode.commands.executeCommand('vscode.diff', originalTempUri, uri, diffTitle, {
          preview: true,
          viewColumn: vscode.ViewColumn.Beside
        });
        
        vscode.window.showInformationMessage("Diagram updated successfully and diff view opened");
        
        // Clean up original temp file after a delay
        setTimeout(async () => {
          try {
            await vscode.workspace.fs.delete(originalTempUri);
          } catch (error) {
            // Ignore errors on delayed cleanup
          }
        }, 60000); // Clean up after 1 minute
      }
      
      // Clean up temp file
      try {
        await vscode.workspace.fs.delete(tempUri);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }
    } catch (error) {
      console.error('Error processing diagram update:', error);
      vscode.window.showErrorMessage(`Error updating diagram: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to direct edit if there's an error
      const acceptFallback = await vscode.window.showInformationMessage(
        'Would you like to apply the changes directly?',
        'Yes', 'No'
      );
      
      if (acceptFallback === 'Yes') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), updatedContent);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage("Diagram updated successfully");
      }
    }
  }
}