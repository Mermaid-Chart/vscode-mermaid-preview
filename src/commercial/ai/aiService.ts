import * as vscode from "vscode";
import { PROMPT_TEMPLATES } from "./prompts";
import { addMetadataToFrontmatter, getFirstWordFromDiagram  } from "../../frontmatter";
import analytics from "../../analytics";

/**
 * AI service to handle chat requests related to Mermaid diagrams
 */
export class MermaidAIService {
  /**
   * Handles chat requests and provides Mermaid diagram assistance
   * @param request - The chat request from VS Code
   * @param context - The chat context containing history
   * @param stream - Stream for responding to the user
   * @param token - Cancellation token
   */
  public static async handleChatRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      analytics.trackAIChatInvocation();
      
      // Check if model is available (GitHub Copilot is installed)
      if (!request?.model) {
        analytics.trackModelNotFound();
        stream.markdown("**GitHub Copilot Required**\n\nTo use the Mermaid Chart AI features, you need to have the GitHub Copilot extension installed and properly configured. Please install GitHub Copilot from the VS Code marketplace and try again.");
        return;
      }
      
      // Initialize messages with Mermaid AI system prompt from web app
      const messages = [
        vscode.LanguageModelChatMessage.User(PROMPT_TEMPLATES.SYSTEM_MESSAGE)
      ];
      
      // Process previous conversation history
      await this.addPreviousMessages(messages, context.history);
  
      // Process current user request with references
      const userPrompt = await this.processUserPromptWithReferences(request);
      messages.push(vscode.LanguageModelChatMessage.User(userPrompt));

  
      // // Get the registered syntax documentation tool
      const syntaxDocsTool = vscode.lm.tools.filter(tool => tool.tags.includes('get_syntax_docs'));
      let options : vscode.LanguageModelChatRequestOptions = {};
      if (syntaxDocsTool.length > 0) {
        options = {
          tools: syntaxDocsTool,
          toolMode: vscode.LanguageModelChatToolMode.Required,
          justification: `The user is requesting a diagram. The AI must always call the get_syntax_docs function to get the latest up-to-date syntax for the requested diagram type.`,
        };
      }
      
      // Send request to language model with the tools
      const chatResponse = await request.model.sendRequest(
        messages, 
        options,
        token
      );
      for await (const part of chatResponse.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
            stream.markdown(part.value);
        }
    }
      
      // Stream the response and add diagram preview buttons
      await this.streamResponseWithDiagramPreviews(chatResponse, stream, request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error in AI handler: ${errorMessage}`);
      
      // Provide a friendly error message with troubleshooting steps
      stream.markdown(`**Error: Unable to use AI features**\n\nI encountered an error: ${errorMessage}\n\n**Troubleshooting steps:**\n1. Make sure GitHub Copilot extension is installed and properly configured\n2. Check your GitHub Copilot subscription status\n3. Try restarting VS Code`);
    }
  }
  
  /**
   * Streams the response and adds buttons for Mermaid diagram previews
   * @param chatResponse - The response from the language model
   * @param stream - The stream to output to
   * @param request - The original chat request
   */
  private static async streamResponseWithDiagramPreviews(
    chatResponse: vscode.LanguageModelChatResponse,
    stream: vscode.ChatResponseStream,
    request: vscode.ChatRequest
  ): Promise<void> {
    // Stream the response
    let fullResponse = '';
    for await (const fragment of chatResponse.text) {
      fullResponse += fragment;
      stream.markdown(fragment); // Stream each fragment to the user as it arrives
    }
    
    // After streaming the full response, extract any mermaid code blocks
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
    const mermaidBlocks: string[] = [];
    
    let match;
    while ((match = mermaidRegex.exec(fullResponse)) !== null) {
      const mermaidCode = match[1].trim();
      if (mermaidCode) {
        // Prepare metadata for the diagram
        const metadata = {
          query: request.prompt,
          references: await this.extractReferenceInfo(request.references),
          generationTime: new Date(),
        };
        
        // Add metadata to the mermaid code
        const codeWithMetadata = addMetadataToFrontmatter(mermaidCode, metadata);
        const firstWord = getFirstWordFromDiagram(codeWithMetadata);
        if (firstWord) {
          // Track the diagram type
          analytics.trackAIGeneratedDiagram(firstWord);
        }
        mermaidBlocks.push(codeWithMetadata);
      }
    }
    
    // If mermaid blocks were found, add buttons to preview them
    if (mermaidBlocks.length > 0) {      
      for (let i = 0; i < mermaidBlocks.length; i++) {
        stream.button({
          title: `Go to Diagram ${mermaidBlocks.length > 1 ? (i + 1) : ''}`,
          command: "mermaidChart.openResponsePreview",
          arguments: [mermaidBlocks[i]]
        });
        
        if (i < mermaidBlocks.length - 1) {
          stream.markdown(" ");
        }
      }
    }
  }
  
  /**
   * Extracts reference information in a simplified format
   * @param references - The references from the request
   * @returns Array of reference descriptions
   */
  private static async extractReferenceInfo(
    references?: ReadonlyArray<vscode.ChatPromptReference>
  ): Promise<string[]> {
    if (!references || references.length === 0) {
      return [];
    }

    const referenceInfo: Set<string> = new Set();

    for (const reference of references) {
      try {
        const value = reference.value;

        if (value instanceof vscode.Uri) {
          // For file references, just store the path
          const relativePath = vscode.workspace.asRelativePath(value, true);
          referenceInfo.add(`File: ${relativePath}`);
        } else if (value instanceof vscode.Location) {
          const relativePath = vscode.workspace.asRelativePath(value.uri, true);
          referenceInfo.add(`File: ${relativePath}`);
        }
        else if (typeof value === 'string') {
          referenceInfo.add(`Reference: ${value}`);
        }
      } catch (error) {
        console.error(`Error extracting reference info: ${error}`);
      }
    }

    return Array.from(referenceInfo);
  
  }
  
  /**
   * Initialize messages array with system prompt
   * @param request - Chat request
   * @returns Array of initial messages
   */
  // private static initializeMessages(request: vscode.ChatRequest): vscode.LanguageModelChatMessage[] {
  //   return [vscode.LanguageModelChatMessage.User(PROMPT_TEMPLATES.BASE)];
  // }
  
  /**
   * Add previous conversation messages to the messages array
   * @param messages - Messages array to append to
   * @param history - Chat history
   */
  private static async addPreviousMessages(
    messages: vscode.LanguageModelChatMessage[],
    history: ReadonlyArray<vscode.ChatRequestTurn | vscode.ChatResponseTurn>
  ): Promise<void> {
    for (const turn of history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        // Process user messages from history
        let userMessage = turn.prompt;
        
        if (turn.references?.length) {
          userMessage = await this.appendReferences(userMessage, turn.references);
        }
        
        messages.push(vscode.LanguageModelChatMessage.User(userMessage));
      } else if (turn instanceof vscode.ChatResponseTurn) {
        // Process assistant responses from history
        const fullMessage = this.combineResponseParts(turn.response);
        if (fullMessage) {
          messages.push(vscode.LanguageModelChatMessage.Assistant(fullMessage));
        }
      }
    }
  }
  
  /**
   * Process the current user prompt with any references
   * @param request - Chat request
   * @returns Processed user prompt with references
   */
  private static async processUserPromptWithReferences(
    request: vscode.ChatRequest
  ): Promise<string> {
    let userPrompt = request.prompt;
  
    if (request.references?.length) {
      userPrompt = await this.appendReferences(userPrompt, request.references);
    }
  
    return userPrompt;
  }
  
  /**
   * Append reference content to a message
   * @param message - Original message
   * @param references - Array of references
   * @returns Message with appended reference content
   */
  private static async appendReferences(
    message: string,
    references: ReadonlyArray<vscode.ChatPromptReference>
  ): Promise<string> {
    let result = message;
    
    for (const reference of references) {
      try {
        const value = reference.value;
        
        if (value instanceof vscode.Uri) {
          result = await this.appendFileReference(result, value);
        } else if (value instanceof vscode.Location) {
          result = await this.appendLocationReference(result, value);
        } else if (typeof value === 'string') {
          result += `\n\nReference: ${value}`;
        }
        
        // Add model description if available
        if (reference.modelDescription) {
          result += `\n(${reference.modelDescription})`;
        }
      } catch (error) {
        console.error(`Error processing reference: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    return result;
  }
  
  /**
   * Append file content reference to a message
   * @param message - Original message
   * @param uri - File URI
   * @returns Message with appended file content
   */
  private static async appendFileReference(message: string, uri: vscode.Uri): Promise<string> {
    const fileContent = await vscode.workspace.fs.readFile(uri);
    const fileText = new TextDecoder().decode(fileContent);
    const fileName = uri.path.split('/').pop() || 'file';
    
    return `${message}\n\nReference file: ${fileName}\n\`\`\`\n${fileText}\n\`\`\``;
  }
  
  /**
   * Append location reference to a message
   * @param message - Original message
   * @param location - File location
   * @returns Message with appended location content
   */
  
  private static async appendLocationReference(
  message: string, 
  location: vscode.Location
): Promise<string> {
  const { uri, range } = location;
  const fileName = uri.path.split('/').pop() || 'file';
  const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());

  let fileText: string;
  if (openDoc) {
    fileText = openDoc.getText();
  } else {
    const fileContent = await vscode.workspace.fs.readFile(uri);
    fileText = new TextDecoder().decode(fileContent);
  }
  const documentUri = vscode.window.activeTextEditor?.document.uri;

  if(uri.path === documentUri?.path) {
    return `${message}\n\nReference file: ${fileName}\n\`\`\`\n${fileText}\n\`\`\``;
  }

  // Extract the selected range text
  const lines = fileText.split('\n');
  const startLine = range.start.line;
  const endLine = range.end.line;
  const startChar = range.start.character;
  const endChar = range.end.character;

  const selectedText = this.extractTextFromRange(lines, startLine, endLine, startChar, endChar);

  return `${message}\n\nReference file: ${fileName} (lines ${startLine + 1}-${endLine + 1})\n\`\`\`\n${selectedText}\n\`\`\``;
}

  
  /**
   * Extract text from a range in lines of text
   * @param lines - Array of text lines
   * @param startLine - Starting line number
   * @param endLine - Ending line number
   * @param startChar - Starting character position
   * @param endChar - Ending character position
   * @returns Extracted text
   */
  private static extractTextFromRange(
    lines: string[],
    startLine: number,
    endLine: number,
    startChar: number,
    endChar: number
  ): string {
    if (startLine === endLine) {
      // Range within a single line
      return lines[startLine].substring(startChar, endChar);
    }
    
    // Range spans multiple lines
    let text = lines[startLine].substring(startChar) + '\n';
    
    // Add all lines in between
    for (let i = startLine + 1; i < endLine; i++) {
      text += lines[i] + '\n';
    }
    
    // Add the last line
    text += lines[endLine].substring(0, endChar);
    
    return text;
  }
  
  /**
   * Combine response parts into a single string
   * @param response - Response parts
   * @returns Combined response text
   */
  private static combineResponseParts(
    response?: ReadonlyArray<vscode.ChatResponsePart>
  ): string {
    if (!response) return '';
    
    let fullMessage = '';
    for (const part of response) {
      if (part instanceof vscode.ChatResponseMarkdownPart) {
        fullMessage += part.value.value;
      } else {
        fullMessage += part.toString();
      }
    }
    return fullMessage;
  }
}

/**
 * Handler for VS Code chat requests
 */
export const aiHandler: vscode.ChatRequestHandler = async (
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
) => {
  await MermaidAIService.handleChatRequest(request, context, stream, token);
};
