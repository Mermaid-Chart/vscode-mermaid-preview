import * as vscode from 'vscode';
import path from 'path';
import os from 'os';

/**
 * Attempts to generate a filename for a Mermaid diagram using AI
 */
export async function generateDiagramFilenameWithAI(diagramCode: string): Promise<string | undefined> {
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

/**
 * Determines the default URI location to save a diagram file
 */
export function getDefaultSaveUri(document: vscode.TextDocument, extension: string, diagramCode: string = ''): Promise<vscode.Uri | undefined> {
    return new Promise(async (resolve) => {
        try {
            // Get either AI-suggested name or default name
            let baseName = '';
            
            if (diagramCode) {
                try {
                    const aiSuggestedName = await generateDiagramFilenameWithAI(diagramCode);
                    console.log('AI suggested name:', aiSuggestedName); // Debug log
                    
                    if (aiSuggestedName && aiSuggestedName.trim() !== '') {
                        baseName = aiSuggestedName;
                        console.log('Using AI suggested name:', baseName); // Debug log
                    } else {
                        console.log('AI returned empty name, fallback to document name'); // Debug log
                        baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
                    }
                } catch (aiError) {
                    console.error('Error in AI name suggestion:', aiError);
                    baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
                }
            } else {
                baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
            }
            
            // Triple safety check - ensure baseName is never empty
            if (!baseName || baseName.trim() === '') {
                console.log('Fallback to untitled_diagram due to empty baseName'); // Debug log
                baseName = 'untitled_diagram';
            }
            
            console.log('Final baseName before URI construction:', baseName); // Debug log
            
            let fileUri;
            // If document has a URI, use its parent directory
            if (document.uri && document.uri.scheme === 'file') {
                fileUri = vscode.Uri.joinPath(document.uri, `../${baseName}.${extension}`);
                console.log('Using document URI path:', fileUri.fsPath); // Debug log
                resolve(fileUri);
                return;
            }
            
            // For untitled documents, try to use workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, `${baseName}.${extension}`);
                console.log('Using workspace folder path:', fileUri.fsPath); // Debug log
                resolve(fileUri);
                return;
            }
            
            // Ultimate fallback - if all else fails
            console.log('No valid URI could be constructed, returning undefined'); // Debug log
            resolve(undefined);
        } catch (error) {
            console.error('Error getting save location:', error);
            
            // Super-safe fallback with guaranteed non-empty name
            try {
                const safeBaseName = 'untitled_diagram';
                console.log('Using emergency fallback name:', safeBaseName); // Debug log
                
                if (document.uri && document.uri.scheme === 'file') {
                    const fileUri = vscode.Uri.joinPath(document.uri, `../${safeBaseName}.${extension}`);
                    console.log('Emergency fallback URI:', fileUri.fsPath); // Debug log
                    resolve(fileUri);
                } else {
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders && workspaceFolders.length > 0) {
                        const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, `${safeBaseName}.${extension}`);
                        console.log('Emergency fallback workspace URI:', fileUri.fsPath); // Debug log
                        resolve(fileUri);
                    } else {
                        console.log('No valid fallback URI could be constructed'); // Debug log
                        resolve(undefined);
                    }
                }
            } catch (emergencyError) {
                console.error('Critical error in fallback logic:', emergencyError);
                resolve(undefined);
            }
        }
    });
} 