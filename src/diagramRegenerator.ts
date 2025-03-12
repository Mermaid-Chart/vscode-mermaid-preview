import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { 
  extractMetadataFromCode, 
  splitFrontMatter, 
  addMetadataToFrontmatter 
} from './frontmatter';
import * as os from 'os';

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
    
    for (const reference of allReferences) {
      const match = reference.match(/File: (.*?)(\s|$|\()/);
      if (!match) continue;
      
      const filePath = match[1].trim();
      const fileName = path.basename(filePath);
      
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










//       // Get available models
//       const models = await vscode.extensions.getExtension('github.copilot')?.exports?.getLanguageModels();
//       if (!models || models.length === 0) {
//         throw new Error('No language models available');
//       }
      
//       // Select the model to use
//       let selectedModel = models[0]; // Default to first available model
//       if (modelName) {
//         const matchingModel = models.find((m: any) => 
//           m.name.toLowerCase().includes(modelName.toLowerCase())
//         );
//         if (matchingModel) {
//           selectedModel = matchingModel;
//         }
//       }
      
//       // Create messages array with the correct enum values
//       const messages = [
//         // System message with instructions
//         new vscode.LanguageModelChatMessage(1, `
// You are an expert in Mermaid diagrams. Your task is to update an existing Mermaid diagram based on changes to reference files.

// Follow these guidelines:
// 1. Maintain the same diagram type and overall structure
// 2. Update only the parts that need to change based on the modified files
// 3. Keep the same styling and formatting as the original diagram
// 4. Ensure the diagram is valid Mermaid syntax
// 5. Return ONLY the Mermaid diagram code without any explanations

// Respond with only the updated Mermaid diagram code in a code block.`),
        
//         // User message with the prompt
//         vscode.LanguageModelChatMessage.User(prompt)
//       ];
      
      // Send request to language model
      // const chatResponse = await selectedModel.sendRequest(messages, {});
      
      // Extract the response text

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
    const { diagramText, frontMatter } = splitFrontMatter(content);
    
    // If diagrams are identical, no need to show suggestion
    if (diagramText.trim() === updatedDiagram.trim()) {
      vscode.window.showInformationMessage("No changes needed to the diagram");
      return;
    }
    
    // Update metadata
    const updatedMetadata = {
      query: metadata.query,
      references: metadata.references,
      generationTime: new Date(),
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
      
      // Show diff view
      const diffTitle = `Diagram Update: ${path.basename(uri.fsPath)}`;
      await vscode.commands.executeCommand('vscode.diff', uri, tempUri, diffTitle, {
        preview: true,
        viewColumn: vscode.ViewColumn.Active
      });
      
      // Show accept/reject buttons
      const acceptButton = 'Accept Changes';
      const rejectButton = 'Reject Changes';
      
      const choice = await vscode.window.showInformationMessage(
        'Review the proposed changes to your Mermaid diagram.',
        { modal: false },
        acceptButton,
        rejectButton
      );
      
      if (choice === acceptButton) {
        // Apply the changes
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), updatedContent);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage("Diagram updated successfully");
      } else {
        vscode.window.showInformationMessage("Diagram update cancelled");
      }
      
      // Clean up temp file
      try {
        await vscode.workspace.fs.delete(tempUri);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }
    } catch (error) {
      console.error('Error showing diff view:', error);
      vscode.window.showErrorMessage(`Error showing diagram diff: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to direct edit if diff view fails
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