import * as vscode from "vscode";
import { MermaidChartProvider, MCTreeItem, getAllTreeViewProjectsCache, getProjectIdForDocument, Document } from "./mermaidChartProvider";
import { MermaidChartVSCode } from "./mermaidChartVSCode";
import {
  applyMermaidChartTokenHighlighting,
  editMermaidChart,
  findComments,
  findDiagramCode,
  findMermaidChartTokens,
  findMermaidChartTokensFromAuxFiles,
  getHelpUrl,
  getMermaidChartTokenDecoration,
  insertMermaidChartToken,
  isAuxFile,
  MermaidChartToken,
  syncAuxFile,
  updateViewVisibility,
  viewMermaidChart,
} from "./util";
import { MermaidChartCodeLensProvider } from "./mermaidChartCodeLensProvider";
import { createMermaidFile, getPreview } from "./commands/createFile";
import { handleTextDocumentChange } from "./eventHandlers";
import { TempFileCache } from "./cache/tempFileCache";
import { PreviewPanel } from "./panels/previewPanel";
import { getSnippetsBasedOnDiagram } from "./constants/condSnippets";
import { ensureIdField, extractIdFromCode, getFirstWordFromDiagram, normalizeMermaidText } from "./frontmatter";
import { customErrorMessage } from "./constants/errorMessages";
import { MermaidWebviewProvider } from "./panels/loginPanel";
import analytics from "./analytics";

let diagramMappings: { [key: string]: string[] } = require('../src/diagramTypeWords.json');
let isExtensionStarted = false;

export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating Mermaid Chart extension");

  const mermaidWebviewProvider = new MermaidWebviewProvider(context);

  const mcAPI = new MermaidChartVSCode();
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.login', async () => {
      await mcAPI.login();
      mermaidChartProvider.refresh();
      analytics.trackLogin();
    })
  );

  await mcAPI.initialize(context, mermaidWebviewProvider);

  const isUserLoggedIn = context.globalState.get<boolean>("isUserLoggedIn", false);

  const mermaidChartProvider: MermaidChartProvider = new MermaidChartProvider(
    mcAPI
  );

  mermaidChartProvider.syncMermaidChart();
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("mermaidWebview", mermaidWebviewProvider)
  );
  
  updateViewVisibility(isUserLoggedIn, mermaidWebviewProvider, mermaidChartProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.preview', getPreview)
  );

  const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && !isExtensionStarted) {
        isExtensionStarted = true;
        handleTextDocumentChange(activeEditor, diagramMappings, true);
    }

  vscode.workspace.onDidChangeTextDocument((event) =>
    handleTextDocumentChange(event, diagramMappings, false)
  );
  vscode.window.onDidChangeActiveTextEditor((event) =>
    handleTextDocumentChange(event, diagramMappings, true)
  );

  
  vscode.commands.registerCommand('mermaidChart.createMermaidFile', async () => {
    createMermaidFile(context, null, false)
  })
  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.logout', async () => {
      mcAPI.logout(context);
      analytics.trackLogout();
    })
  );

 let  mermaidChartTokenDecoration: vscode.TextEditorDecorationType;
  mermaidChartTokenDecoration = getMermaidChartTokenDecoration();
  vscode.window.onDidChangeActiveColorTheme(() => {
    mermaidChartTokenDecoration.dispose(); 
    mermaidChartTokenDecoration = getMermaidChartTokenDecoration(); 
  });
  


    const mermaidChartGutterIconDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(context.asAbsolutePath("images/mermaid-icon-16.png")), // Add the icon file path
      gutterIconSize: "8x8",// Adjust the icon size as desired
    });
  let codeLensProvider: MermaidChartCodeLensProvider | undefined;

  function updateMermaidChartTokenHighlighting() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      let mermaidChartTokens : MermaidChartToken[] = [];
      if (!isAuxFile(activeEditor.document.fileName)) {
        const comments = findComments(activeEditor.document);
        mermaidChartTokens = findMermaidChartTokens(
          activeEditor.document,
          comments
        );
      } else {
        mermaidChartTokens = findMermaidChartTokensFromAuxFiles(activeEditor.document)
      }

      applyMermaidChartTokenHighlighting(
        activeEditor,
        mermaidChartTokens,
        mermaidChartTokenDecoration,
        mermaidChartGutterIconDecoration
      );

      if (!codeLensProvider) {
        codeLensProvider = new MermaidChartCodeLensProvider(mermaidChartTokens);
        context.subscriptions.push(
          vscode.languages.registerCodeLensProvider("*", codeLensProvider)
        );
      } else {
        codeLensProvider.setMermaidChartTokens(mermaidChartTokens);
      }
    }
  }

  updateMermaidChartTokenHighlighting();

  vscode.window.onDidChangeActiveTextEditor(
    () => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    () => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions
  );

  const viewCommandDisposable = vscode.commands.registerCommand(
    "extension.viewMermaidChart",
    (uuid: string) => {
      return viewMermaidChart(mcAPI, uuid);
    }
  );

  context.subscriptions.push(viewCommandDisposable);

  const treeView = vscode.window.createTreeView("mermaidChart", {
    treeDataProvider: mermaidChartProvider,
  });
  vscode.window.registerTreeDataProvider("mermaidChart", mermaidChartProvider);

  const editCommandDisposable = vscode.commands.registerCommand(
    "extension.editMermaidChart",
    (uuid: string) => {
      return editMermaidChart(mcAPI, uuid, mermaidChartProvider);
    }
  );
  context.subscriptions.push(editCommandDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.editLocally", (uuid: string) => {
      const projects = getAllTreeViewProjectsCache();
   
      // Find the diagram code based on the UUID
       const diagramCode = findDiagramCode(projects,uuid);
        
      // Create the Mermaid file if diagramCode is found
      if (diagramCode) {
        const diagramId = uuid;
        
        const processedCode = ensureIdField(diagramCode, diagramId);
        createMermaidFile(context, processedCode, true);
      } else {
        vscode.window.showErrorMessage("Diagram not found for the given UUID.");
      }
    })
  );

context.subscriptions.push(
  vscode.commands.registerCommand('mermaid.editAuxFile', async (uri: vscode.Uri, range: vscode.Range) => {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();
      const blockContent = content.substring(document.offsetAt(range.start), document.offsetAt(range.end));
      const normalizedContent = normalizeMermaidText(blockContent);
      
      if (!normalizedContent) {
        vscode.window.showErrorMessage("No valid Mermaid diagram found in the selected range.");
        return;
      }
      
      const editor = await createMermaidFile(context, normalizedContent, true);
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
  vscode.commands.registerCommand('mermaid.connectDiagram', async (uri: vscode.Uri, range: vscode.Range) => {
    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();
    const blockContent = content.substring(document.offsetAt(range.start), document.offsetAt(range.end)).trim();
    const projects = getAllTreeViewProjectsCache();

    const selectedProject = await vscode.window.showQuickPick(
      projects.map((p) => ({ label: p.title, description: p.title, projectId: p.uuid })),
      { placeHolder: "Select a project to save the diagram" }
    );

    if (!selectedProject || !selectedProject?.projectId) {
      vscode.window.showInformationMessage("Operation cancelled.");
      return;
    }

    try {
      const newDocument = await mcAPI.createDocument(selectedProject.projectId);

      if (!newDocument || !newDocument.documentID) {
        vscode.window.showErrorMessage("Failed to create a new document.");
        return;
      }

      const normalizedContent = normalizeMermaidText(blockContent);
      await mcAPI.setDocument({
        documentID: newDocument.documentID,
        projectID: selectedProject.projectId,
        code: normalizedContent,
      });

      const processedCode = ensureIdField(normalizedContent, newDocument.documentID);
      mermaidChartProvider.refresh();
      const editor = await createMermaidFile(context, processedCode, true);

      if (editor) {
        syncAuxFile(editor.document.uri.toString(), uri, range);
      }
    } catch (error) {
      if (error instanceof Error ) {
        const errMessage = error.message; 
        const matchedError = Object.keys(customErrorMessage).find((key) =>errMessage.includes(key));
        vscode.window.showErrorMessage(matchedError ? customErrorMessage[matchedError] : `Error: ${errMessage}`);
        } else {
        vscode.window.showErrorMessage("Unknown error occurred.");
        }
        analytics.trackException(error);
      }
  })
);

vscode.workspace.onWillSaveTextDocument(async (event) => {
  if (event.document.languageId.startsWith("mermaid")) {
    const content = event.document.getText();
    const diagramId = extractIdFromCode(content);
    if (diagramId) {
      const projectId = getProjectIdForDocument(diagramId);

      if (projectId) {
        await mcAPI.setDocument({
          documentID: diagramId,
          projectID: projectId,
          code: content,
        });
        vscode.window.showInformationMessage(`Diagram synced successfully with Mermaid chart. Diagram ID: ${diagramId}`);
      }
    }
  }
});

  context.subscriptions.push(
    vscode.commands.registerCommand('mermaidChart.syncDiagramWithMermaid', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        syncFileToMermaidChart(editor.document);
      }
    })
  );
  const syncFileToMermaidChart = async (document: vscode.TextDocument): Promise<void> => {
    // Early return if not a mermaid file
    if (!document.languageId.startsWith("mermaid")) {
        vscode.window.showInformationMessage('This file is not a Mermaid diagram.');
        return;
    }

    if (MermaidChartProvider.isSyncing) {
      vscode.window.showInformationMessage('Please wait, diagrams are being synchronized...');
      await MermaidChartProvider.waitForSync();
    }

    const content = document.getText();
    
    // Early return if content is empty
    if (!content.trim()) {
        vscode.window.showInformationMessage('The file is empty.');
        return;
    }

    try {
        const diagramId = extractIdFromCode(content);
        const tempUri = document.uri.toString();

        // Handle temporary buffer case
        if (TempFileCache.hasTempUri(context, tempUri)) {
            if (!diagramId) {
                vscode.window.showInformationMessage('This is a temporary buffer, it cannot be saved locally');
                return;
            }

            const projectId = getProjectIdForDocument(diagramId);
            if (!projectId) {
            vscode.window.showErrorMessage('No project ID found for this diagram.');
            return;
            }

            await mcAPI.setDocument({
                documentID: diagramId,
                projectID: projectId,
                code: content,
            });

            vscode.window.showInformationMessage(
                `Diagram synced successfully with Mermaid chart. Diagram ID: ${diagramId}`
            );
            return;
        }

        // Handle local file case
        await vscode.commands.executeCommand('workbench.action.files.save');
        
        if (diagramId) {
            vscode.window.showInformationMessage(
                `Diagram synced successfully with Mermaid chart. Diagram ID: ${diagramId}`
            );
        } else {
            vscode.window.showInformationMessage('Local file saved successfully.');
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred.";
        analytics.trackException(error);
        vscode.window.showErrorMessage(`Failed to sync file: ${errorMessage}`);
    }
};

context.subscriptions.push(
  vscode.commands.registerCommand('mermaidChart.connectDiagramToMermaidChart', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    const document = activeEditor?.document;

    if (!document) {
      vscode.window.showErrorMessage("No active document found.");
      return;
    }

    const content = document.getText();
    const id = extractIdFromCode(content);
    
    // Check if the document is already connected
    if (id) {
      vscode.window.showWarningMessage("This diagram is already connected to Mermaid Chart.");
      return;
    }

    const projects = getAllTreeViewProjectsCache();
    const selectedProject = await vscode.window.showQuickPick(
      projects.map((p) => ({ label: p.title, description: p.title, projectId: p.uuid })),
      { placeHolder: "Select a project to save the diagram" }
    );

    if (!selectedProject || !selectedProject.projectId) {
      vscode.window.showInformationMessage("Operation cancelled.");
      return;
    }

    try {
    const newDocument = await mcAPI.createDocument(selectedProject.projectId);

    if (!newDocument || !newDocument.documentID) {
      vscode.window.showErrorMessage("Failed to create a new document.");
      return;
    }

    await mcAPI.setDocument({
      documentID: newDocument.documentID,
      projectID: selectedProject.projectId,
      code: content,
    });

    const processedCode = ensureIdField(content, newDocument.documentID);
    mermaidChartProvider.refresh();

    // Apply the new processedCode to the document
    await activeEditor.edit((editBuilder) => {
      const fullRange = new vscode.Range(
        activeEditor.document.positionAt(0),
        activeEditor.document.positionAt(content.length)
      );
      editBuilder.replace(fullRange, processedCode);
    });

    PreviewPanel.createOrShow(document);
    vscode.window.showInformationMessage(`Diagram connected successfully with Mermaid chart.`);
    }   catch(error) {
      if (error instanceof Error ) {
        const errMessage = error.message;
        const matchedError = Object.keys(customErrorMessage).find((key) =>errMessage.includes(key));
        vscode.window.showErrorMessage(matchedError ? customErrorMessage[matchedError] : `Error: ${errMessage}`);
        } else {
        vscode.window.showErrorMessage("Unknown error occurred.");
        }
        analytics.trackException(error);
    }

  })
);

  vscode.commands.registerCommand("mermaidChart.downloadDiagram", async (item: Document) => {
    if (!item || !item.code) {
      vscode.window.showErrorMessage("No code found for this diagram.");
      return;
    }
    const processedCode = ensureIdField(item.code, item.uuid);
    createMermaidFile(context, processedCode, false)
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.focus", () => {
      const emptyMermaidChartToken: MCTreeItem = {
        uuid: "",
        title: "",
        code : "",
        range: new vscode.Range(0, 0, 0, 0),
      };
      treeView.reveal(emptyMermaidChartToken, {
        select: false,
        focus: true,
        expand: false,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mermaidChart.refresh", () => {
      mermaidChartProvider.refresh();
 
    })
  );

  let disposable = vscode.commands.registerCommand(
    "mermaidChart.outline",
    () => {
      vscode.window.registerTreeDataProvider(
        "mermaidChart",
        mermaidChartProvider
      );
    }
  );
  context.subscriptions.push(disposable);

const insertUuidIntoEditorDisposable = vscode.commands.registerCommand(
  "mermaidChart.insertUuidIntoEditor",
  ({ uuid }: MCTreeItem) =>
      uuid ? insertMermaidChartToken(uuid, mermaidChartProvider) 
           : vscode.window.showErrorMessage("Invalid item selected. No UUID found.")
);

  context.subscriptions.push(insertUuidIntoEditorDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.refreshTreeView", () => {
      mermaidChartProvider.refresh();
    })
  );

context.subscriptions.push(
  vscode.commands.registerCommand("mermaidChart.diagramHelp", () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
          const documentText = activeEditor.document.getText();
          const firstWord = getFirstWordFromDiagram(documentText);
          const helpUrl = getHelpUrl(firstWord);
          vscode.env.openExternal(vscode.Uri.parse(helpUrl));
      } else {
          vscode.window.showWarningMessage("No active editor found.");
      }
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

  const triggerCompletions = vscode.commands.registerCommand(
    'mermaidChart.showCompletions',
    () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.commands.executeCommand('editor.action.triggerSuggest');
        }
    }
  );

  context.subscriptions.push(provider, triggerCompletions);

  console.log("Mermaid Charts view registered");

  // Global error handling
  process.on('uncaughtException', (error) => {
    analytics.trackException(error);
  });

  process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
      analytics.trackException(reason);
    } else {
      analytics.trackException(new Error('Unhandled rejection'));
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
