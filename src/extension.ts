import * as vscode from "vscode";
import * as path from "path";
import type MarkdownIt from 'markdown-it';
import {
  applyMermaidChartTokenHighlighting,
  configSection,
  findMermaidChartTokensFromAuxFiles,
  getDiagramTemplates,
  getHelpUrl,
  isAuxFile,
  MermaidChartToken,
  syncAuxFile,
  triggerSuggestIfEmpty,
} from "./util";
import { MermaidChartCodeLensProvider } from "./mermaidChartCodeLensProvider";
import { createMermaidFile, getPreview } from "./commands/createFile";
import { handleTextDocumentChange } from "./eventHandlers";
import { getSnippetsBasedOnDiagram } from "./constants/condSnippets";
import { getFirstWordFromDiagram, normalizeMermaidText } from "./frontmatter";
import analytics from "./analytics";
import { injectMermaidTheme } from "./previewmarkdown/themeing";
import { extendMarkdownItWithMermaid } from "./previewmarkdown/shared-md-mermaid";
import { checkForOfficialExtension } from "./conflictHandle";
import { clearTmLanguageCache } from "./syntaxHighlighter";
import { MermaidWebviewProvider } from "./panels/sidebarPanel";
import { shouldShowFeaturePopups } from "./settings";

let diagramMappings: { [key: string]: string[] } = require('../src/diagramTypeWords.json');
let isExtensionStarted = false;

const movedFeatureMessage =
  "Mermaid Preview Alert: This functionality has moved to the Mermaid Chart extension. Click Show more to understand more.";

async function showMovedFeaturePopup(context: vscode.ExtensionContext) {
  if (!shouldShowFeaturePopups()) {
    return;
  }

  const choice = await vscode.window.showInformationMessage(
    movedFeatureMessage,
    "Show more",
    "Discard"
  );

  if (choice !== "Show more") {
    return;
  }

  const docPath = path.join(context.extensionPath, "docs", "MermaidPreviewChanges.md");
  const doc = await vscode.workspace.openTextDocument(docPath);
  await vscode.commands.executeCommand("markdown.showPreview", doc.uri);
}

export async function activate(context: vscode.ExtensionContext) {
  if (!(await checkForOfficialExtension(context))) {
    return;
  }
  // Listen for extension changes (install/uninstall) while VS Code is running
  context.subscriptions.push(
    vscode.extensions.onDidChange(async () => {
      // Re-check for official extension conflicts
      await checkForOfficialExtension(context);
    })
  );


  context.subscriptions.push(
    vscode.commands.registerCommand('preview.mermaidChart.preview', getPreview)
  );

  const mermaidWebviewProvider = new MermaidWebviewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("preview_mermaidWebview", mermaidWebviewProvider),
    vscode.commands.registerCommand("preview.mermaidChart.reloadSidebar", () => {
      mermaidWebviewProvider.refresh();
    }),
    vscode.commands.registerCommand("preview.mermaidChart.openSettings", () => {
      mermaidWebviewProvider.toggleView("settings");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "preview.mermaidChart.syncDiagramWithMermaid",
      async () => {
        void showMovedFeaturePopup(context);
        await vscode.commands.executeCommand("workbench.action.files.save");
      }
    ),
    vscode.commands.registerCommand(
      "preview.mermaidChart.connectDiagramToMermaidChart",
      () => showMovedFeaturePopup(context)
    ),
    vscode.commands.registerCommand(
      "preview.mermaidChart.insertUuidIntoEditor",
      () => showMovedFeaturePopup(context)
    )
  );

  const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && !isExtensionStarted) {
        isExtensionStarted = true;
        handleTextDocumentChange(activeEditor, diagramMappings, true);
    }

  vscode.workspace.onDidChangeTextDocument((event) =>
    {
      handleTextDocumentChange(event, diagramMappings, false);
      updateMermaidChartTokenHighlighting();
      triggerSuggestIfEmpty(event.document);
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeActiveTextEditor(
    (event) => {
      handleTextDocumentChange(event, diagramMappings, true);
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions
  );

  const mermaidChartGutterIconDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath: vscode.Uri.file(context.asAbsolutePath("images/mermaid-icon.svg")),
    gutterIconSize: "8x8",
  });
  let codeLensProvider: MermaidChartCodeLensProvider | undefined;

  function updateMermaidChartTokenHighlighting() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const mermaidChartTokens: MermaidChartToken[] = isAuxFile(activeEditor.document.fileName)
      ? findMermaidChartTokensFromAuxFiles(activeEditor.document)
      : [];

    applyMermaidChartTokenHighlighting(
      activeEditor,
      mermaidChartTokens,
      mermaidChartGutterIconDecoration
    );

    if (codeLensProvider) {
      codeLensProvider.setMermaidChartTokens(mermaidChartTokens);
    } else {
      codeLensProvider = new MermaidChartCodeLensProvider(mermaidChartTokens);
      context.subscriptions.push(
        vscode.languages.registerCodeLensProvider("*", codeLensProvider)
      );
    }
  }

  updateMermaidChartTokenHighlighting();

  vscode.commands.registerCommand('preview.mermaidChart.createMermaidFile', async () => {
    createMermaidFile(null);
  });

context.subscriptions.push(
  vscode.commands.registerCommand('preview.mermaid.editAuxFile', async (uri: vscode.Uri, range: vscode.Range) => {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();
      const blockContent = content.substring(document.offsetAt(range.start), document.offsetAt(range.end));
      const normalizedContent = normalizeMermaidText(blockContent);
      
      if (!normalizedContent) {
        vscode.window.showErrorMessage("No valid Mermaid diagram found in the selected range.");
        return;
      }
      
      const editor = await createMermaidFile(normalizedContent);
      if (editor) {
        syncAuxFile(editor.document.uri.toString(), uri, range);
      }
    } catch (error) {
      analytics.trackException(error);
      vscode.window.showErrorMessage(`Error processing Mermaid diagram: ${error instanceof Error ? error.message : "Unknown error occurred."}`);
    }
  })
);

  context.subscriptions.push(
    vscode.commands.registerCommand("preview.mermaidChart.diagramHelp", async() => {
      const activeEditor = await vscode.window.activeTextEditor;
      let helpUrl = 'https://mermaid.js.org/intro/';
      
      if (activeEditor) {
        if (activeEditor.document.languageId.includes('mermaid')) {
          const documentText = activeEditor.document.getText();
          const firstWord = getFirstWordFromDiagram(documentText);
          if (firstWord) {
            let foundDiagramType = '';
            const firstWordLower = firstWord.toLowerCase();
            for (const [diagramType, aliases] of Object.entries(diagramMappings)) {
              if (aliases.some(alias => alias.toLowerCase() === firstWordLower)) {
                foundDiagramType = firstWord;
                break;
              }
            }
            if (foundDiagramType) {
              helpUrl = getHelpUrl(foundDiagramType);
            }
          }
        }
      }
      vscode.env.openExternal(vscode.Uri.parse(helpUrl));
    })
  );

  const provider = vscode.languages.registerCompletionItemProvider(
    [
      { scheme: 'file' },
      { scheme: 'untitled' }
    ],
    {
        provideCompletionItems(document, position, token, context) {
            const languageId = document.languageId.toLowerCase();
            if (document.getText().trim() === "") {
              return;
            }
            // Ensure the languageId is exactly "mermaid" or starts with "mermaid"
            if (!(languageId === 'mermaid' || languageId.startsWith('mermaid'))) {
                return [];
            }

            const snippets = getSnippetsBasedOnDiagram(languageId);

            const suggestions: vscode.CompletionItem[] = snippets.map(snippet => {
                const item = new vscode.CompletionItem(
                    snippet.id,
                    vscode.CompletionItemKind.Snippet
                );
                item.insertText = new vscode.SnippetString(snippet.completion);
                item.documentation = new vscode.MarkdownString(
                    `**${snippet.name}**\n\n\`\`\`mermaid\n${snippet.sample}\n\`\`\``
                );
                return item;
            });

            return suggestions;
        },
    },
    'm'
  );
  context.subscriptions.push(provider);

context.subscriptions.push(
  vscode.languages.registerCompletionItemProvider(
    [
      { scheme: 'file' },
      { scheme: 'untitled' }
    ],
    {
      provideCompletionItems(document) {
        if (document.getText().trim() === "") {
          const templates = getDiagramTemplates();
          const templateEntries = Object.entries(templates);

          const suggestions = templateEntries.map(([name, code]) => {
            const item = new vscode.CompletionItem(
              name,
              vscode.CompletionItemKind.Snippet
            );
            item.insertText = new vscode.SnippetString(code);
            item.documentation = new vscode.MarkdownString(
              `**${name}**\n\n\`\`\`mermaid\n${code}\n\`\`\``
            );
            return item;
          });
          return suggestions;
        }
        return [];
      },
    },
  )
);
vscode.workspace.onDidOpenTextDocument((document) => {
  triggerSuggestIfEmpty(document);
});
vscode.window.visibleTextEditors.forEach((editor) => {
  triggerSuggestIfEmpty(editor.document);
});

// Register markdown preview handler
context.subscriptions.push(
  vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'markdown') {
      const content = document.getText();
      if (content.includes('```mermaid')) {
        // This will ensure our custom preview script is loaded
        vscode.commands.executeCommand('markdown.preview.refresh');
      }
    }
  })
);
context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
  if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
      vscode.commands.executeCommand('markdown.preview.refresh');
  }
}));

return {
  extendMarkdownIt(md: MarkdownIt) {
      extendMarkdownItWithMermaid(md, {
          languageIds: () => {
              return vscode.workspace.getConfiguration(configSection).get<string[]>('languages', ['mermaid']);
          }
      });
      md.use(injectMermaidTheme);
      return md;
  }
};
}

// This method is called when your extension is deactivated
export function deactivate() {
  clearTmLanguageCache();
}
