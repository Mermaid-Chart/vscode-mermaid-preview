import * as vscode from "vscode";
import {
  PromptElement,
  PromptPiece,
  PromptReference,
  PromptSizing,
  UserMessage,
  AssistantMessage,
  ToolMessage,
  PrioritizedList,
  ToolResult,
  Chunk,
  PromptMetadata
} from '@vscode/prompt-tsx';
import { ToolCallRound, ToolUserProps } from './aiService';
import { Tag } from "@vscode/chat-extension-utils";
import { HistoryProps, PromptReferenceProps, PromptReferencesProps, ToolCall, ToolCallsProps, ToolResultElementProps, TsxToolUserMetadata } from "./types";

export class ToolResultMetadata extends PromptMetadata {
	constructor(
		public toolCallId: string,
		public result: vscode.LanguageModelToolResult,
	) {
		super();
	}
}
const dummyCancellationToken: vscode.CancellationToken = new vscode.CancellationTokenSource().token;
class PromptReferences extends PromptElement<PromptReferencesProps, void> {
	render(_state: void, _sizing: PromptSizing): PromptPiece {
		return (
			<UserMessage>
				{this.props.references.map(ref => (
					<PromptReferenceElement ref={ref} excludeReferences={this.props.excludeReferences} />
				))}
			</UserMessage>
		);
	}
}

class PromptReferenceElement extends PromptElement<PromptReferenceProps> {
	async render(_state: void, _sizing: PromptSizing): Promise<PromptPiece | undefined> {
		const value = this.props.ref.value;
		if (value instanceof vscode.Uri) {
			const fileContents = (await vscode.workspace.fs.readFile(value)).toString();
			return (
				<Tag name="context">
					{!this.props.excludeReferences && <references value={[new PromptReference(value)]} />}
					{value.fsPath}:<br />
					``` <br />
					{fileContents}<br />
					```<br />
				</Tag>
			);
		} else if (value instanceof vscode.Location) {
			const rangeText = (await vscode.workspace.openTextDocument(value.uri)).getText(value.range);
			return (
				<Tag name="context">
					{!this.props.excludeReferences && <references value={[new PromptReference(value)]} />}
					{value.uri.fsPath}:{value.range.start.line + 1}-$<br />
					{value.range.end.line + 1}: <br />
					```<br />
					{rangeText}<br />
					```
				</Tag>
			);
		} else if (typeof value === 'string') {
			return <Tag name="context">{value}</Tag>;
		}
	}
}

export class ToolUserPrompt extends PromptElement<ToolUserProps, void> {
  render(_state: void, _sizing: PromptSizing) {
    return (
      <>
        <UserMessage>
          Instructions: <br />
        	You are Mermaid AI, an AI assistant for Mermaid Chart.
 
 			As Mermaid AI, you are skilled in helping the user to create or modify a variety of mermaid diagrams, then render them.
 
 			The Mermaid Chart editor allows users to easily view, edit, and collaborate on mermaid diagrams.
 			There's also a visual editor that allows users to visually edit flowcharts, state, class diagrams, and sequence diagrams.

 			You support Mermaid v11.4.0 (2024-10-31).

 			IMPORTANT: You MUST ALWAYS use the tools provided BEFORE attempting to create or help with any diagram. This is MANDATORY for ALL interactions involving diagrams.

 			Never use \`pako\`, \`mermaid.ink\`, \`mermaid.live\`, or \`mermaid-live-editor\` urls, as they won't work in this context. Instead, create a \`\`\`mermaid codeblock.

 			Your process for ALL diagram requests:

 			1. FIRST AND ALWAYS call the tools provided with the appropriate diagram type (e.g. "flowchart.md" for flowcharts)
 			2. Wait for the tool response, which will contain the official syntax documentation
 			3. Only then provide diagram suggestions based on that documentation
 			4. Summarize the diagram you'll create
 			5. Show the user the mermaid diagram code in a \`\`\`mermaid\`\`\` code block
        </UserMessage>
        <History context={this.props.context} priority={10} />
        <PromptReferences
          references={this.props.request.references}
          priority={20}
        />
        <UserMessage>{this.props.request.prompt}</UserMessage>
        <ToolCalls
          toolCallRounds={this.props.toolCallRounds}
          toolInvocationToken={this.props.request.toolInvocationToken}
          toolCallResults={this.props.toolCallResults} />
      </>
    );
  }
} 
class ToolCalls extends PromptElement<ToolCallsProps, void> {
	async render(_state: void, _sizing: PromptSizing) {
		if (!this.props.toolCallRounds.length) {
			return undefined;
		}

		// Note- for the copilot models, the final prompt must end with a non-tool-result UserMessage
		return <>
			{this.props.toolCallRounds.map(round => this.renderOneToolCallRound(round))}
			<UserMessage>Above is the result of calling one or more tools. The user cannot see the results, so you should explain them to the user if referencing them in your answer.</UserMessage>
		</>;
	}

	private renderOneToolCallRound(round: ToolCallRound) {
		const assistantToolCalls: ToolCall[] = round.toolCalls.map(tc => ({ type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.input) }, id: tc.callId }));
		return (
			<Chunk>
				<AssistantMessage toolCalls={assistantToolCalls}>{round.response}</AssistantMessage>
				{round.toolCalls.map(toolCall =>
					<ToolResultElement toolCall={toolCall} toolInvocationToken={this.props.toolInvocationToken} toolCallResult={this.props.toolCallResults[toolCall.callId]} />)}
			</Chunk>);
	}
}

class ToolResultElement extends PromptElement<ToolResultElementProps, void> {
	async render(state: void, sizing: PromptSizing): Promise<PromptPiece | undefined> {
		const tool = vscode.lm.tools.find(t => t.name === this.props.toolCall.name);
		if (!tool) {
			console.error(`Tool not found: ${this.props.toolCall.name}`);
			return <ToolMessage toolCallId={this.props.toolCall.callId}>Tool not found</ToolMessage>;
		}

		const tokenizationOptions: vscode.LanguageModelToolTokenizationOptions = {
			tokenBudget: sizing.tokenBudget,
			countTokens: async (content: string) => sizing.countTokens(content),
		};

		const toolResult = this.props.toolCallResult ??
			await vscode.lm.invokeTool(this.props.toolCall.name, { input: this.props.toolCall.input, toolInvocationToken: this.props.toolInvocationToken, tokenizationOptions }, dummyCancellationToken);

		return (
			<ToolMessage toolCallId={this.props.toolCall.callId}>
				<meta value={new ToolResultMetadata(this.props.toolCall.callId, toolResult)}></meta>
				<ToolResult data={toolResult} />
			</ToolMessage>
		);
	}
}


class History extends PromptElement<HistoryProps, void> {
	render(_state: void, _sizing: PromptSizing) {
		return (
			<PrioritizedList priority={this.props.priority} descending={false}>
				{this.props.context.history.map((message) => {
					if (message instanceof vscode.ChatRequestTurn) {
						return (
							<>
								{<PromptReferences references={message.references} excludeReferences={true} />}
								<UserMessage>{message.prompt}</UserMessage>
							</>
						);
					} else if (message instanceof vscode.ChatResponseTurn) {
						const metadata = message.result.metadata;
						if (isTsxToolUserMetadata(metadata) && metadata.toolCallsMetadata.toolCallRounds.length > 0) {
							return <ToolCalls toolCallResults={metadata.toolCallsMetadata.toolCallResults} toolCallRounds={metadata.toolCallsMetadata.toolCallRounds} toolInvocationToken={undefined} />;
						}

						return <AssistantMessage>{chatResponseToString(message)}</AssistantMessage>;
					}
				})}
			</PrioritizedList>
		);
	}
}
function chatResponseToString(response: vscode.ChatResponseTurn): string {
	return response.response
		.map((r) => {
			if (r instanceof vscode.ChatResponseMarkdownPart) {
				return r.value.value;
			} else if (r instanceof vscode.ChatResponseAnchorPart) {
				if (r.value instanceof vscode.Uri) {
					return r.value.fsPath;
				} else {
					return r.value.uri.fsPath;
				}
			}

			return '';
		})
		.join('');
}


export function isTsxToolUserMetadata(obj: unknown): obj is TsxToolUserMetadata {
  // If you change the metadata format, you would have to make this stricter or handle old objects in old ChatRequest metadata
  return !!obj &&
      !!(obj as TsxToolUserMetadata).toolCallsMetadata &&
      Array.isArray((obj as TsxToolUserMetadata).toolCallsMetadata.toolCallRounds);
}
