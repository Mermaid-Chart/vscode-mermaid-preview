import * as vscode from "vscode";
import * as packageJson from '../package.json';
// Define your own version of MCProject
export interface MCProject {
  id: string;
  title: string;
  parentID?: string; // Add parentID here
  // Add other properties that you expect from the SDK's MCProject
}

export interface MermaidChartToken {
  uuid: string;
  title: string;
  range: vscode.Range;
  collapsibleState?: vscode.TreeItemCollapsibleState;
  uri?: vscode.Uri
}

export  const exampleContent = `flowchart TD
    %% Nodes
        A("fab:fa-youtube Starter Guide")
        B("fab:fa-youtube Make Flowchart")
        n1@{ icon: "fa:gem", pos: "b", h: 24}
        C("fa:fa-book-open Learn More")
        D{"Use the editor"}
        n2(Many shapes)@{ shape: delay}
        E(fa:fa-shapes Visual Editor)
        F("fa:fa-chevron-up Add node in toolbar")
        G("fa:fa-comment-dots AI chat")
        H("fa:fa-arrow-left Open AI in side menu")
        I("fa:fa-code Text")
        J(fa:fa-arrow-left Type Mermaid syntax)

    %% Edge connections between nodes
        A --> B --> C --> n1 & D & n2
        D -- Build and Design --> E --> F
        D -- Use AI --> G --> H
        D -- Mermaid js --> I --> J

    %% Individual node styling. Try the visual editor toolbar for easier styling!
        style E color:#FFFFFF, fill:#AA00FF, stroke:#AA00FF
        style G color:#FFFFFF, stroke:#00C853, fill:#00C853
        style I color:#FFFFFF, stroke:#2962FF, fill:#2962FF

    %% You can add notes with two "%" signs in a row!`;

    export const customErrorMessage: Record<string, string> = {
      //  the API response contains the error code as a string within `error.message`,
          "402": "Upgrade Required: Please upgrade your plan to connect more Mermaid diagrams.",
        };
    export const DARK_THEME_KEY = "mermaid.vscode.dark_theme";
    export const LIGHT_THEME_KEY = "mermaid.vscode.light_theme";
    export const MAX_ZOOM= "mermaid.vscode.max_Zoom";
    export const MAX_CHAR_LENGTH = "mermaid.vscode.max_CharLength";
    export const MAX_EDGES = "mermaid.vscode.max_Edges";
    export const analyticsID = vscode.env.machineId;
    export const pluginID= packageJson.name === "vscode-mermaid-chart" ?  "MERMAIDCHART_VS_CODE_PLUGIN" : "MERMAID_PREVIEW_VS_CODE_PLUGIN";
    export const MERMAID_CHART_EXTENSION_ID = 'MermaidChart.vscode-mermaid-chart';
    export const THIS_EXTENSION_ID = 'vstirbu.vscode-mermaid-preview';
    export const IS_ACTIVE_CONTEXT_KEY = 'mermaidPreview:isActive';
    export const COMMENT_REGEX = /^\s*%%(?!{)[^\n]+\n?/gm;
    export const DIRECTIVE_REGEX = /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;
    export const FIRST_WORD_REGEX = /^\s*(\w+)/;
    export const anyCommentRegex = /\s*%%.*\n/gm;
    export const utmSource = 'mermaid_preview_vs_code';
    export const utmCampaign = "VSCode extension";
    export const ITEM_TYPE_PROJECT = "project";
    export const ITEM_TYPE_DOCUMENT = "document";
    export const ITEM_TYPE_UNKNOWN = "unknown";
    export const activeListeners = new Map<string, vscode.Disposable>();
    export const REOPEN_CHECK_DELAY_MS = 500; // Delay before checking if temp file is reopened
    export const config = vscode.workspace.getConfiguration();
    export const defaultBaseURL = config.get<string>('preview.mermaidChart.baseUrl', 'https://www.mermaidchart.com');
    export const DARK_BACKGROUND = "rgba(176, 19, 74, 0.5)"; // #B0134A with 50% opacity
    export const LIGHT_BACKGROUND = "#FDE0EE";
    export const DARK_COLOR = "#FFFFFF";
    export const LIGHT_COLOR = "#1E1A2E";
    export const configSection = 'mermaid';
    export const pattern : Record<string, RegExp> = {
      ".md": /```mermaid([\s\S]*?)```/g,
      ".html": /<div class=["']mermaid["']>([\s\S]*?)<\/div>/g,
      ".hugo": /{{<mermaid[^>]*>}}([\s\S]*?){{<\/mermaid>}}/g,
      ".rst": /\.\. mermaid::(?:[ \t]*)?$(?:(?:\n[ \t]+:(?:(?:\\:\s)|[^:])+:[^\n]*$)+\n)?((?:\n(?:[ \t][^\n]*)?$)+)?/gm,
    };
