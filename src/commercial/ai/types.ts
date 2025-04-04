import { BasePromptElementProps } from "@vscode/prompt-tsx";
import { ToolFunction } from "@vscode/prompt-tsx/dist/base/promptElements";
import * as vscode from "vscode";
import { ToolCallRound } from "./aiService";

export interface PromptReferencesProps extends BasePromptElementProps {
    references: ReadonlyArray<vscode.ChatPromptReference>;
    excludeReferences?: boolean;
}

export interface PromptReferenceProps extends BasePromptElementProps {
    ref: vscode.ChatPromptReference;
    excludeReferences?: boolean;
}

export interface ToolCallsProps extends BasePromptElementProps {
    toolCallRounds: ToolCallRound[];
    toolCallResults: Record<string, vscode.LanguageModelToolResult>;
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined;
}

export interface ToolCall {
  id: string;
  function: ToolFunction;
  type: 'function';
}

export interface ToolResultElementProps extends BasePromptElementProps {
    toolCall: vscode.LanguageModelToolCallPart;
    toolInvocationToken: vscode.ChatParticipantToolToken | undefined;
    toolCallResult: vscode.LanguageModelToolResult | undefined;
}


export interface HistoryProps extends BasePromptElementProps {
    priority: number;
    context: vscode.ChatContext;
}

export interface TsxToolUserMetadata {
    toolCallsMetadata: ToolCallsMetadata;
  }

  export interface ToolCallsMetadata {
    toolCallRounds: ToolCallRound[];
    toolCallResults: Record<string, vscode.LanguageModelToolResult>;
  }

  export const diagramTypeFiles= [
    "architecture.md", "block.md", "c4.md", "classDiagram.md", 
    "entityRelationshipDiagram.md", "flowchart.md", "gantt.md", 
    "gitgraph.md", "kanban.md", "mindmap.md", "packet.md", 
    "pie.md", "quadrantChart.md", "requirementDiagram.md", 
    "sankey.md", "sequenceDiagram.md", "stateDiagram.md", 
    "timeline.md", "userJourney.md", "xyChart.md"
  ];
