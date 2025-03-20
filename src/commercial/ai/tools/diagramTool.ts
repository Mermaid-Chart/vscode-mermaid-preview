import * as vscode from 'vscode';
import { PROMPT_TEMPLATES } from '../prompts';

interface IMermaidDiagramParameters {
  description: string;
  type?: 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gantt' | 'pie';
}

export class MermaidDiagramTool implements vscode.LanguageModelTool<IMermaidDiagramParameters> {
  
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IMermaidDiagramParameters>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    
    try {
      // Create a focused prompt for diagram generation
      let diagramPrompt = `${PROMPT_TEMPLATES.BASE}\n\nPlease create a Mermaid diagram based on this description: ${params.description}`;
      
      if (params.type) {
        diagramPrompt += `\n\nThe diagram should be of type: ${params.type}`;
      }
      
      // Get the appropriate model
      const model = await vscode.commands.executeCommand<vscode.LanguageModelChat>(
        "vscode.languageModels.getLanguageModel"
      );
      
      if (!model) {
        throw new Error("Could not access language model");
      }
      
      // Create a chat message to send to the model
      const messages = [vscode.LanguageModelChatMessage.User(diagramPrompt)];
      
      // Get the response from the model
      const response = await model.sendRequest(messages, {}, token);
      
      // Extract the Mermaid code from the response
      const mermaidCode = await this.extractMermaidCode(response);
      
      if (!mermaidCode) {
        throw new Error("No valid Mermaid diagram was generated");
      }
      
      // Open the diagram in the preview panel
      await vscode.commands.executeCommand(
        "mermaidChart.openResponsePreview", 
        mermaidCode
      );
      
      // Return the result
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nThe diagram has been created and opened in the preview panel.`)
      ]);
    } catch (error) {
      console.error("Error creating Mermaid diagram:", error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      ]);
    }
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IMermaidDiagramParameters>,
    _token: vscode.CancellationToken
  ){
    const diagramType = options.input.type || 'a';
    
    return {
      invocationMessage: `Creating ${diagramType} diagram from description`,
      confirmationMessages: {
        title: 'Create Mermaid Diagram',
        message: new vscode.MarkdownString(
          `Create a Mermaid diagram based on this description?\n\n"${options.input.description}"`
        ),
      }
    };
  }
  
  /**
   * Extract Mermaid code from the model response
   */
  private async extractMermaidCode(
    response: vscode.LanguageModelChatResponse
  ): Promise<string | null> {
    let fullResponse = '';
    
    // Collect the full response
    for await (const chunk of response.text) {
      fullResponse += chunk;
    }
    
    // Extract the Mermaid code using regex
    const mermaidMatch = fullResponse.match(/```mermaid\s*([\s\S]*?)```/);
    
    if (mermaidMatch && mermaidMatch[1]) {
      return mermaidMatch[1].trim();
    }
    
    return null;
  }
} 