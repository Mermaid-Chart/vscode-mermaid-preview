import * as vscode from "vscode";
import { addMetadataToFrontmatter, getFirstWordFromDiagram  } from "../../frontmatter";
import analytics from "../../analytics";

import {
  renderPrompt,
	BasePromptElementProps,
} from '@vscode/prompt-tsx';
import { ToolResultMetadata, ToolUserPrompt } from "./toolUserPrompt";
export interface ToolCallRound {
	response: string;
	toolCalls: vscode.LanguageModelToolCallPart[];
}

export interface ToolUserProps extends BasePromptElementProps {
	request: vscode.ChatRequest;
	context: vscode.ChatContext;
	toolCallRounds: ToolCallRound[];
	toolCallResults: Record<string, vscode.LanguageModelToolResult>;
}

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

    let model = request.model;
    if (model.vendor === 'copilot' && model.family.startsWith('o1')) {
        // The o1 models do not currently support tools
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'
        });
        model = models[0];
    }

    // Use all tools, or tools with the tags that are relevant.
    const tools = vscode.lm.tools.filter(tool => tool.tags.includes('mermaid-docs'));
    const options: vscode.LanguageModelChatRequestOptions = {
        justification: 'To make a request to @toolsTSX',
    };

    // Render the initial prompt
    const result = await renderPrompt(
        ToolUserPrompt,
        {
            context: context,
            request,
            toolCallRounds: [],
            toolCallResults: {}
        },
        { modelMaxPromptTokens: model.maxInputTokens },
        model);
    let messages = result.messages;
    result.references.forEach(ref => {
        if (ref.anchor instanceof vscode.Uri || ref.anchor instanceof vscode.Location) {
            stream.reference(ref.anchor);
        }
    });

    const toolReferences = [...request.toolReferences];
    const accumulatedToolResults: Record<string, vscode.LanguageModelToolResult> = {};
    const toolCallRounds: ToolCallRound[] = [];
    const runWithTools = async (): Promise<void> => {
        // If a toolReference is present, force the model to call that tool
        const requestedTool = toolReferences.shift();
        if (requestedTool) {
            options.toolMode = vscode.LanguageModelChatToolMode.Required;
            options.tools = vscode.lm.tools.filter(tool => tool.name === requestedTool.name);
        } else {
            options.toolMode = undefined;
            options.tools = [...tools];
        }

        // Send the request to the LanguageModelChat
        const response = await model.sendRequest(messages, options, token);
        // Stream text output and collect tool calls from the response
        const toolCalls: vscode.LanguageModelToolCallPart[] = [];
        let responseStr = '';
        for await (const part of response.stream) {
            if (part instanceof vscode.LanguageModelTextPart) {
                responseStr += part.value;
            } else if (part instanceof vscode.LanguageModelToolCallPart) {
                toolCalls.push(part);
            }
        }
        await this.streamResponseWithDiagramPreviews(response, stream, request);

        if (toolCalls.length) {
            // If the model called any tools, then we do another round- render the prompt with those tool calls (rendering the PromptElements will invoke the tools)
            // and include the tool results in the prompt for the next request.
            toolCallRounds.push({
                response: responseStr,
                toolCalls
            });
            const result = (await renderPrompt(
                ToolUserPrompt,
                {
                    context: context,
                    request,
                    toolCallRounds,
                    toolCallResults: accumulatedToolResults
                },
                { modelMaxPromptTokens: model.maxInputTokens },
                model));
            messages = result.messages;
            const toolResultMetadata = result.metadatas.getAll(ToolResultMetadata);
            if (toolResultMetadata?.length) {
                // Cache tool results for later, so they can be incorporated into later prompts without calling the tool again
                toolResultMetadata.forEach(meta => accumulatedToolResults[meta.toolCallId] = meta.result);
            }

            // This loops until the model doesn't want to call any more tools, then the request is done.
            return runWithTools();
        }
    };
    await runWithTools();
};
  
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
    for await (const part of chatResponse.text) {
      const simulatedPart = new vscode.LanguageModelTextPart(part);
      if (simulatedPart instanceof vscode.LanguageModelTextPart) {
        fullResponse += simulatedPart.value;
        stream.markdown(simulatedPart.value);
      }
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
