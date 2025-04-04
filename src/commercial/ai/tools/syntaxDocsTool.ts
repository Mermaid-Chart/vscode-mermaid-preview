import * as vscode from 'vscode';
import axios from 'axios';

interface GetSyntaxDocsParams {
  file: string;
}

export class SyntaxDocumentationTool implements vscode.LanguageModelTool<GetSyntaxDocsParams> {
  private static readonly VALID_FILES = [
    "architecture.md", "block.md", "c4.md", "classDiagram.md", 
    "entityRelationshipDiagram.md", "flowchart.md", "gantt.md", 
    "gitgraph.md", "kanban.md", "mindmap.md", "packet.md", 
    "pie.md", "quadrantChart.md", "requirementDiagram.md", 
    "sankey.md", "sequenceDiagram.md", "stateDiagram.md", 
    "timeline.md", "userJourney.md", "xyChart.md"
  ];

  // This is the description text exactly as defined in package.json
  readonly name = 'get-syntax-docs-mermaid';
  readonly description = 'Get the syntax documentation for a specific diagram type.\n\nAvailable diagram types:\n- `architecture.md`: Cloud/CI/CD Architecture Diagram\n- `block.md`: Block Diagram\n- `c4.md`: C4 Diagram\n- `classDiagram.md`: Class Diagram\n- `entityRelationshipDiagram.md`: Entity Relationship Diagram\n- `flowchart.md`: Flowchart\n- `gantt.md`: Gantt Chart\n- `gitgraph.md`: Git Graph Diagram\n- `kanban.md`: Kanban Diagram\n- `mindmap.md`: Mindmap\n- `packet.md`: Packet Diagram\n- `pie.md`: Pie Chart\n- `quadrantChart.md`: Quadrant Chart\n- `requirementDiagram.md`: Requirement Diagram\n- `sankey.md`: Sankey Diagram\n- `sequenceDiagram.md`: Sequence Diagram\n- `stateDiagram.md`: State Diagram\n- `timeline.md`: Timeline\n- `userJourney.md`: User Journey Diagram\n- `xyChart.md`: XY Chart';

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<GetSyntaxDocsParams>,
    _token: vscode.CancellationToken
  ) {
    return {
      invocationMessage: `Fetching Mermaid documentation for ${options.input.file}`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<GetSyntaxDocsParams>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    try {
      const filename = options.input.file;
      console.log(`[SyntaxDocsTool] Fetching documentation for: ${filename}`);
      
      if (!SyntaxDocumentationTool.VALID_FILES.includes(filename)) {
        console.warn(`[SyntaxDocsTool] Invalid file requested: ${filename}`);
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Error: Invalid file '${filename}'. Please choose from the available files.`)
        ]);
      }
      
      const documentation = await this.fetchMermaidDocumentation(filename);
      console.log(`[SyntaxDocsTool] Documentation fetched successfully for: ${filename}`);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(documentation)
      ]);
    } catch (error) {
      console.error(`[SyntaxDocsTool] Error fetching documentation:`, error);
      // Return a more graceful error that won't break the AI flow
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`I encountered an issue fetching the documentation for this diagram type. Please try again or choose a different diagram type. Error details: ${error instanceof Error ? error.message : String(error)}`)
      ]);
    }
  }

  private async fetchMermaidDocumentation(filename: string): Promise<string> {
    try {
      const MERMAID_DOCS_GIT_TAG = "mermaid@11.4.0";
      const url = `https://www.mermaidchart.com/rest-api/chatgpt/${MERMAID_DOCS_GIT_TAG}/docs/syntax/${filename}`;
      
      console.log(`[SyntaxDocsTool] Requesting documentation from: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'Accept': 'text/plain, text/markdown',
          'User-Agent': 'VSCode-MermaidChart-Extension'
        }
      });
      
      const text = await response.data;
      if (!text || text.trim().length === 0) {
        throw new Error(`Received empty documentation for ${filename}`);
      }
      
      return text;
    } catch (error) {
      console.error(`[SyntaxDocsTool] Network error fetching documentation:`, error);
      // Try fallback URL if main URL fails
      return this.fetchMermaidDocumentationFallback(filename);
    }
  }
  
  // Fallback to GitHub raw URL if the main API fails
  private async fetchMermaidDocumentationFallback(filename: string): Promise<string> {
    try {
      console.log(`[SyntaxDocsTool] Attempting fallback documentation fetch`);
      const MERMAID_DOCS_GIT_TAG = "mermaid@11.4.0";
      const fallbackUrl = `https://raw.githubusercontent.com/mermaid-js/mermaid/${MERMAID_DOCS_GIT_TAG}/docs/syntax/${filename}`;
      
      const response = await fetch(fallbackUrl);
      if (!response.ok) {
        throw new Error(`Fallback fetch failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`[SyntaxDocsTool] Fallback fetch also failed:`, error);
      throw new Error(`Could not retrieve documentation. Both primary and fallback sources failed.`);
    }
  }
}