import * as vscode from "vscode";
import type MarkdownIt from 'markdown-it';
import { MermaidChartProvider, MCTreeItem, getAllTreeViewProjectsCache, getProjectIdForDocument, Document, getDiagramFromCache, updateDiagramInCache } from "./mermaidChartProvider";
import { MermaidChartVSCode } from "./mermaidChartVSCode";
import {
  applyMermaidChartTokenHighlighting,
  editMermaidChart,
  findComments,
  findDiagramCode,
  findMermaidChartTokens,
  findMermaidChartTokensFromAuxFiles,
  flattenProjects,
  getDiagramTemplates,
  getHelpUrl,
  getMermaidChartTokenDecoration,
  insertMermaidChartToken,
  isAuxFile,
  syncAuxFile,
  triggerSuggestIfEmpty,
  updateViewVisibility,
  viewMermaidChart,
} from "./util";
import { MermaidChartCodeLensProvider } from "./mermaidChartCodeLensProvider";
import { createMermaidFile, getPreview, openMermaidPreview } from "./commands/createFile";
import { TempFileCache } from "./cache/tempFileCache";
import { PreviewPanel } from "./panels/previewPanel";
import { getSnippetsBasedOnDiagram } from "./constants/codeSnippets";
import { ensureIdField, extractIdFromCode, getFirstWordFromDiagram, normalizeMermaidText } from "./frontmatter";
import { MermaidWebviewProvider } from "./panels/loginPanel";
import analytics from "./analytics";
import { RemoteSyncHandler } from "./remoteSyncHandler";
import { registerRegenerateCommand } from './commercial/sync/regenerateCommand';
import { initializeAIChatParticipant } from "./commercial/ai/chatParticipant";
import { setPreviewBridge, registerTools, setValidationBridge,initializePlugin } from '@mermaid-chart/vscode-utils';
import { PreviewBridgeImpl } from "./commercial/ai/tools/previewTool";
import { ValidationBridgeImpl } from "./commercial/ai/tools/validationTool";
import { injectMermaidTheme } from "./previewmarkdown/themeing";
import { extendMarkdownItWithMermaid } from "./previewmarkdown/shared-md-mermaid";
import { checkForOfficialExtension } from "./conflictHandle";
import * as packageJson from '../package.json'; 
import { configSection, customErrorMessage, MermaidChartToken, pluginID } from "./types";

let isExtensionStarted = false;

export async function activate(context: vscode.ExtensionContext) {
  initializePlugin(pluginID);

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

  analytics.trackActivation();

  // Register AI tools first to ensure they're available
  console.log("[MermaidExtension] Registering AI tools...");
  registerTools(context);
  
  // Initialize the bridge for commercial tools
  setPreviewBridge(new PreviewBridgeImpl());
  setValidationBridge(new ValidationBridgeImpl());
  
  // Initialize AI chat participant after tools are registered
  initializeAIChatParticipant(context);

  const mermaidWebviewProvider = new MermaidWebviewProvider(context);

  const mcAPI = new MermaidChartVSCode();
  context.subscriptions.push(
    vscode.commands.registerCommand('preview.mermaidChart.login', async () => {
      await mcAPI.login();
      analytics.trackLogin();
    })
  );

  await mcAPI.initialize(context, mermaidWebviewProvider);

  const isUserLoggedIn = context.globalState.get<boolean>("isUserLoggedIn", false);

  const mermaidChartProvider: MermaidChartProvider = new MermaidChartProvider(
    mcAPI
  );


  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("preview_mermaidWebview", mermaidWebviewProvider)
  );
  
  updateViewVisibility(isUserLoggedIn, mermaidWebviewProvider, mermaidChartProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('preview.mermaidChart.preview', getPreview)
  );

  const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && !isExtensionStarted) {
        isExtensionStarted = true;
    }

  vscode.workspace.onDidChangeTextDocument((event) =>
    {
      updateMermaidChartTokenHighlighting();
      triggerSuggestIfEmpty(event.document);
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeActiveTextEditor(
    (event) => {
      updateMermaidChartTokenHighlighting();
    },
    null,
    context.subscriptions
  );
  
  vscode.commands.registerCommand('preview.mermaidChart.createMermaidFile', async () => {
    createMermaidFile(context, null, false);
  });
  context.subscriptions.push(
    vscode.commands.registerCommand('preview.mermaidChart.logout', async () => {
      mcAPI.logout(context);
    })
  );

 let  mermaidChartTokenDecoration: vscode.TextEditorDecorationType;
  mermaidChartTokenDecoration = getMermaidChartTokenDecoration();
  vscode.window.onDidChangeActiveColorTheme(() => {
    mermaidChartTokenDecoration.dispose(); 
    mermaidChartTokenDecoration = getMermaidChartTokenDecoration(); 
  });
  


    const mermaidChartGutterIconDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(context.asAbsolutePath("images/mermaid-icon.svg")), // Add the icon file path
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
        applyMermaidChartTokenHighlighting(
          activeEditor,
          mermaidChartTokens,
          mermaidChartTokenDecoration,
          mermaidChartGutterIconDecoration,
          false
        );
      } else {
        mermaidChartTokens = findMermaidChartTokensFromAuxFiles(activeEditor.document);
        applyMermaidChartTokenHighlighting(
          activeEditor,
          mermaidChartTokens,
          mermaidChartTokenDecoration,
          mermaidChartGutterIconDecoration,
          true
        );
      }

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


  const viewCommandDisposable = vscode.commands.registerCommand(
    "preview.mermaidChart.viewMermaidChart",
    (uuid: string) => {
      console.log("Viewing Mermaid Chart with UUID: ", uuid);
      return viewMermaidChart(mcAPI, uuid);
    }
  );

  context.subscriptions.push(viewCommandDisposable);

  const treeView = vscode.window.createTreeView("preview_mermaidChart", {
    treeDataProvider: mermaidChartProvider,
  });
  vscode.window.registerTreeDataProvider("preview_mermaidChart", mermaidChartProvider);

  const editCommandDisposable = vscode.commands.registerCommand(
    "preview.extension.editMermaidChart",
    (uuid: string) => {
      return editMermaidChart(mcAPI, uuid, mermaidChartProvider);
    }
  );
  context.subscriptions.push(editCommandDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("preview.mermaidChart.editLocally", async (uuid: string) => {
      const projects = getAllTreeViewProjectsCache();
   
      // Find the diagram code based on the UUID
       const diagramCode = findDiagramCode(projects,uuid);
        
      // Create the Mermaid file if diagramCode is found
      if (diagramCode) {
      const diagramId = uuid;
      const processedCode = ensureIdField(diagramCode, diagramId);
      const projectId = getProjectIdForDocument(diagramId);

      if (projectId) {
        await mcAPI.setDocument({
          documentID: diagramId,
          projectID: projectId,
          code: processedCode,
        });
        updateDiagramInCache(diagramId, processedCode);
      }
      createMermaidFile(context, processedCode, true);
      } else {
        vscode.window.showErrorMessage("Diagram not found for the given UUID.");
      }
    })
  );

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
  vscode.commands.registerCommand('preview.mermaid.connectDiagram', async (uri: vscode.Uri, range: vscode.Range) => {
    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();
    const blockContent = content.substring(document.offsetAt(range.start), document.offsetAt(range.end)).trim();
    if(MermaidChartProvider.isSyncing) {
      await MermaidChartProvider.waitForSync();
    }
    const projects = getAllTreeViewProjectsCache();
    let flattenedProjects = flattenProjects(projects);
    if (flattenedProjects.length === 0) {
      vscode.window.showInformationMessage('Please wait, diagrams are being synchronized...');
      await mermaidChartProvider.syncMermaidChart();
      const updatedProjects = getAllTreeViewProjectsCache();
      flattenedProjects = flattenProjects(updatedProjects);
    }
    if (flattenedProjects.length === 0) {
      vscode.window.showInformationMessage('No projects available to connect the diagram. Please try again later.');
      return;
    }
    const selectedProject = await vscode.window.showQuickPick(
      flattenedProjects.map((p) => ({ label: p.title, description: p.title, projectId: p.uuid })),
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
      const processedCode = ensureIdField(normalizedContent, newDocument.documentID);
      await mcAPI.setDocument({
        documentID: newDocument.documentID,
        projectID: selectedProject.projectId,
        code: processedCode,
      });
      mermaidChartProvider.syncMermaidChart();
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
  if (event.reason !== vscode.TextDocumentSaveReason.Manual) {
    if (event.document.languageId.startsWith("mermaid")) {
      return;
    }
  }
  if (event.document.languageId.startsWith("mermaid")) {
    const content = event.document.getText();
    const diagramId = extractIdFromCode(content);
    if (diagramId) {
      const projectId = getProjectIdForDocument(diagramId);

      if (projectId) {

      const remoteSyncHandler = new RemoteSyncHandler(mcAPI);
      const syncDecision = await remoteSyncHandler.handleRemoteChanges(
        event.document,
          diagramId
      );

      if (syncDecision === 'abort') {
          // vscode.window.showInformationMessage('Sync cancelled');
          return;
      }
      // Proceed with saving
      await mcAPI.setDocument({
        documentID: diagramId,
        projectID: projectId,
        code: content,
      });

      // Update the cache with the new code
        updateDiagramInCache(diagramId, event.document.getText());
        vscode.window.showInformationMessage(`Diagram synced successfully with Mermaid chart. Diagram ID: ${diagramId}`);
      }
    }
  }
});

  context.subscriptions.push(
    vscode.commands.registerCommand('preview.mermaidChart.syncDiagramWithMermaid', async () => {
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
        const progressPromise = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Syncing diagram with Mermaid Chart...',
            cancellable: false
        }, async (progress) => {
            const diagramId = extractIdFromCode(content);
            const tempUri = document.uri.toString();

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

                progress.report({ message: 'Checking for remote changes...' });
                // Create a promise that resolves when remote sync is complete
                const remoteSyncHandler = new RemoteSyncHandler(mcAPI);
                const syncDecision = await remoteSyncHandler.handleRemoteChanges(
                    document,
                    diagramId
                );

                if (syncDecision === 'abort') {
                    return;
                }

                progress.report({ message: 'Saving changes...' });
                
                // Proceed with saving
                await mcAPI.setDocument({
                    documentID: diagramId,
                    projectID: projectId,
                    code: document.getText(),
                });

                // Update the cache with the new code
                updateDiagramInCache(diagramId, document.getText());

                vscode.window.showInformationMessage(
                    `Diagram synced successfully with Mermaid Chart.`
                );
                return;
            }

            // Handle local file case
            await vscode.commands.executeCommand('workbench.action.files.save');
        });

        // Set a timeout to ensure the progress indicator doesn't hang
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Sync operation timed out')), 100000);
        });

        await Promise.race([progressPromise, timeoutPromise]);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred.";
        analytics.trackException(error);
        vscode.window.showErrorMessage(`Failed to sync file: ${errorMessage}`);
    }
};

context.subscriptions.push(
  vscode.commands.registerCommand('preview.mermaidChart.connectDiagramToMermaidChart', async () => {
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
    if(MermaidChartProvider.isSyncing) {
      await MermaidChartProvider.waitForSync();
    }
    const projects = getAllTreeViewProjectsCache();
    let flattenedProjects = flattenProjects(projects);
    if (flattenedProjects.length === 0) {
      vscode.window.showInformationMessage('Please wait, diagrams are being synchronized...');
      await mermaidChartProvider.syncMermaidChart();
      const updatedProjects = getAllTreeViewProjectsCache();
      flattenedProjects = flattenProjects(updatedProjects);
    }
    if (flattenedProjects.length === 0) {
      vscode.window.showInformationMessage('No projects available to connect the diagram. Please try again later.');
      return;
    }

    const selectedProject = await vscode.window.showQuickPick(
      flattenedProjects.map((p) => ({ label: p.title, description: p.title, projectId: p.uuid })),
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

    const processedCode = ensureIdField(content, newDocument.documentID);
    await mcAPI.setDocument({
      documentID: newDocument.documentID,
      projectID: selectedProject.projectId,
      code: processedCode,
    });
    mermaidChartProvider.syncMermaidChart();

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

  vscode.commands.registerCommand("preview.mermaidChart.downloadDiagram", async (item: Document) => {
    if (!item || !item.code) {
      vscode.window.showErrorMessage("No code found for this diagram.");
      return;
    }

    const projectId = getProjectIdForDocument(item.uuid);
    if (!projectId) {
        vscode.window.showErrorMessage('No project ID found for this diagram.');
        return;
    }
    const processedCode = ensureIdField(item.code, item.uuid);
    await mcAPI.setDocument({
      documentID: item.uuid,
      projectID: projectId,
      code: processedCode,
    });
    updateDiagramInCache(item.uuid, processedCode);
    createMermaidFile(context, processedCode, false);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("preview.mermaidChart.focus", () => {
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
    vscode.commands.registerCommand("preview.mermaidChart.refresh", () => {
      mermaidChartProvider.refresh();
 
    })
  );

  let disposable = vscode.commands.registerCommand(
    "preview.mermaidChart.outline",
    () => {
      vscode.window.registerTreeDataProvider(
        "mermaidChart",
        mermaidChartProvider
      );
    }
  );
  context.subscriptions.push(disposable);

const insertUuidIntoEditorDisposable = vscode.commands.registerCommand(
  "preview.mermaidChart.insertUuidIntoEditor",
  ({ uuid }: MCTreeItem) =>
      uuid ? insertMermaidChartToken(uuid, mermaidChartProvider) 
           : vscode.window.showErrorMessage("Invalid item selected. No UUID found.")
);

  context.subscriptions.push(insertUuidIntoEditorDisposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("preview.extension.refreshTreeView", () => {
      mermaidChartProvider.refresh();
    })
  );

context.subscriptions.push(
  vscode.commands.registerCommand("preview.mermaidChart.diagramHelp", () => {
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

  // const triggerCompletions = vscode.commands.registerCommand(
  //   'preview.mermaidChart.showCompletions',
  //   () => {
  //       const editor = vscode.window.activeTextEditor;
  //       if (editor) {
  //           vscode.commands.executeCommand('editor.action.triggerSuggest');
  //       }
  //   }
  // );

  // context.subscriptions.push(provider, triggerCompletions);

  console.log("Mermaid Charts view registered");

  context.subscriptions.push(
    vscode.commands.registerCommand("preview.mermaidChart.openCopilotChat", async () => {
      const copilotExtension = vscode.extensions.getExtension("GitHub.copilot-chat");
      if (!copilotExtension) {
        const installOption = "Install GitHub Copilot Chat";
        const selection = await vscode.window.showErrorMessage(
          "GitHub Copilot Chat extension is not installed. Please install it from the VS Code Marketplace.",
          installOption
        );
  
        if (selection === installOption) {
          await vscode.commands.executeCommand("preview.extension.open", "GitHub.copilot-chat");
        }
        return;
      }
      await vscode.commands.executeCommand(
        "workbench.panel.chat.view.copilot.focus"
      );
    
      await vscode.commands.executeCommand("workbench.action.chat.focusInput");
      await vscode.commands.executeCommand("deleteAllLeft");
      await vscode.commands.executeCommand("default:type", { text: "@mermaid-chart" });
    })
  );

context.subscriptions.push(
  vscode.commands.registerCommand('preview.mermaidChart.openResponsePreview', async (mermaidCode: string) => {
    if (!mermaidCode) {
      vscode.window.showErrorMessage("No Mermaid code provided");
      return;
    }
    await openMermaidPreview(context, mermaidCode);
  })
);


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

// Register the regenerate command from commercial directory
registerRegenerateCommand(context, mcAPI);

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
export function deactivate() {}
