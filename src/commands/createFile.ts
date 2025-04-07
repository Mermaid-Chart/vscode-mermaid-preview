import * as vscode from "vscode";
import { PreviewPanel } from "../panels/previewPanel";
import { TempFileCache } from "../cache/tempFileCache";
import analytics from "../analytics";
import { normalizeMermaidText } from "../frontmatter";

export async function createMermaidFile(
  context: vscode.ExtensionContext,
  diagramContent: string | null,
  isTempFile: boolean
): Promise<vscode.TextEditor | null> {
  const exampleContent = `flowchart TD
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

  try {
    const document = await vscode.workspace.openTextDocument({
      language: "mermaid",
      content: diagramContent ?? exampleContent
    });

    const editor = await vscode.window.showTextDocument(document);
    if (!editor?.document) {
      return null;
    }

    const uri = editor.document.uri.toString();

    if (isTempFile) {
      TempFileCache.addTempUri(context, uri);
    } else {
      TempFileCache.removeTempUri(context, uri);
    }
    PreviewPanel.createOrShow(editor.document);
    return editor;
  } catch (error) {
    console.error("Error creating Mermaid file:", error);
    analytics.trackException(error);
    return null;
  }
}

export function getPreview() {
  const activeEditor = vscode.window.activeTextEditor;
  
  if (!activeEditor) {
    vscode.window.showErrorMessage("No active editor. Open a .mmd file to preview.");
    return;
  }

  const document = activeEditor.document;
  if (document.languageId !== "plaintext" && 
      !document.fileName.endsWith(".mmd") && 
      !document.fileName.endsWith(".mermaid") && 
      !document.languageId.startsWith('mermaid')) {
    vscode.window.showErrorMessage("Mermaid Preview is only available for mermaid files.");
    return;
  }
  PreviewPanel.createOrShow(document);
}

export async function openMermaidPreview(
  context: vscode.ExtensionContext,
  mermaidCode: string
): Promise<vscode.TextEditor | null> {
  try {
    // Normalize the Mermaid code using the frontmatter utility
    const normalizedCode = normalizeMermaidText(mermaidCode);
    
    // Create new file with the normalized code
    return await createMermaidFile(context, normalizedCode, false);
  } catch (error) {
    console.error("Error opening Mermaid preview:", error);
    analytics.trackException(error);
    vscode.window.showErrorMessage("Failed to open Mermaid preview");
    return null;
  }
}