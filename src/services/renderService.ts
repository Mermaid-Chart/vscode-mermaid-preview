import * as vscode from 'vscode';
import path from 'path';

async function suggestFilenameWithAI(diagramCode: string): Promise<string | undefined> {
    try {
        // Check if VS Code LM API is available
        if (!vscode.lm) {
            return undefined;
        }
        
        // Try to get any available AI model
        const [model] = await vscode.lm.selectChatModels({});
        if (!model) {
            return undefined;
        }

        const messages = [
            vscode.LanguageModelChatMessage.Assistant('You generate concise, descriptive filenames for Mermaid diagrams.'),
            vscode.LanguageModelChatMessage.User(`Generate a short, descriptive filename (without extension) for this Mermaid diagram.
            Use only alphanumeric characters, underscores, and hyphens.
            
            IMPORTANT RULES:
            1. Keep it VERY concise - use at most 2-4 words total (max 25 characters).
            2. Focus on the main concept or purpose, not individual steps or details.
            3. Do NOT include the diagram type (like "flowchart", "sequence", "class", "gantt", etc.) in the filename.
            4. Ignore icon or formatting prefixes (like "fa:", "fab:", "fa-", etc.) when creating the filename.
            
            Examples:
            - For a sequence diagram about patient registration → "patient_registration"
            - For a flowchart about YouTube starter guide → "youtube_guide"
            - For a class diagram of a library system → "library_system"
            - For a CI/CD pipeline with code commits, tests, builds and deployments → "cicd_pipeline" (not "code_commit_test_build_deploy")
            
            Diagram: ${diagramCode}
            
            Respond with only the filename.`)
          ];
        
        const response = await model.sendRequest(
            messages,
            {},
            new vscode.CancellationTokenSource().token
          );
        // Process the response
        let suggestedName = '';
        for await (const chunk of response.text) {
            suggestedName += chunk;
        }
        
        // Clean and sanitize the filename
        suggestedName = suggestedName.trim()
            .replace(/[^\w\-]/g, '_')  // Replace invalid chars
            .replace(/_+/g, '_')       // Replace multiple underscores
            .toLowerCase();
            
        if (suggestedName && suggestedName.length > 0) {
            return suggestedName;
        }
    } catch (error) {
        console.log('AI filename suggestion failed:', error);
    }
    
    return undefined;
}

function getDefaultSaveLocation(document: vscode.TextDocument, extension: string, diagramCode: string = ''): Promise<vscode.Uri | undefined> {
    return new Promise(async (resolve) => {
        try {
            // Get either AI-suggested name or default name
            let baseName;
            
            if (diagramCode) {
                const aiSuggestedName = await suggestFilenameWithAI(diagramCode);
                if (aiSuggestedName) {
                    baseName = aiSuggestedName;
                } else {
                    baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
                }
            } else {
                baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
            }
            
            // If document has a URI, use its parent directory
            if (document.uri && document.uri.scheme === 'file') {
                resolve(vscode.Uri.joinPath(document.uri, `../${baseName}.${extension}`));
                return;
            }
            
            // For untitled documents, try to use workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                resolve(vscode.Uri.joinPath(workspaceFolders[0].uri, `${baseName}.${extension}`));
                return;
            }
            
            resolve(undefined);
        } catch (error) {
            console.error('Error getting save location:', error);
            // Fall back to original logic
            const baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
            
            if (document.uri && document.uri.scheme === 'file') {
                resolve(vscode.Uri.joinPath(document.uri, `../${baseName}.${extension}`));
            } else {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    resolve(vscode.Uri.joinPath(workspaceFolders[0].uri, `${baseName}.${extension}`));
                } else {
                    resolve(undefined);
                }
            }
        }
    });
}

export async function exportDiagramAsSvg(document: vscode.TextDocument, svgcode: string, diagramCode: string = ''): Promise<void> {
    try {
        const defaultUri = await getDefaultSaveLocation(document, 'svg', diagramCode);

        // Ask user where to save the file
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: defaultUri,
            filters: {
                'SVG Image': ['svg']
            },
            title: `Export Mermaid Diagram as SVG image`
        });
        
        if (saveUri) {
            // Convert base64 to buffer
            const svgBuffer = Buffer.from(svgcode, 'base64');
            
            // Write the SVG file
            await vscode.workspace.fs.writeFile(saveUri, svgBuffer);
            vscode.window.showInformationMessage(`Diagram exported to ${saveUri.fsPath}`);
        }
    } catch (error) {
        console.error('Error in SVG export:', error);
        vscode.window.showErrorMessage(`Sorry, we were unable to generate a SVG of your diagram. Please make sure your diagram has no syntax errors in it and try again.`);
    }
}

export async function exportDiagramAsPng(document: vscode.TextDocument, pngBase64: string, diagramCode: string = ''): Promise<void> {
    try {
        const defaultUri = await getDefaultSaveLocation(document, 'png', diagramCode);

        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: defaultUri,
            filters: {
                'PNG Image': ['png']
            },
            title: `Export Mermaid Diagram as PNG image`
        });
        
        if (saveUri) {
             // Convert base64 to buffer
            const pngBuffer = Buffer.from(pngBase64, 'base64');
            await vscode.workspace.fs.writeFile(saveUri, pngBuffer);
            vscode.window.showInformationMessage(`Diagram exported to ${saveUri.fsPath}`);
        }
    } catch (error) {
        console.error('Error in PNG export:', error);
        vscode.window.showErrorMessage(`Sorry, we were unable to generate a PNG of your diagram. Please make sure your diagram has no syntax errors in it and try again.`);
    }
}