import * as vscode from 'vscode';
import path from 'path';

function getDefaultSaveLocation(document: vscode.TextDocument, extension: string): vscode.Uri | undefined {
    const baseName = path.basename(document.fileName || 'diagram', path.extname(document.fileName || ''));
    
    // If document has a URI, use its parent directory
    if (document.uri && document.uri.scheme === 'file') {
        return vscode.Uri.joinPath(document.uri, `../${baseName}.${extension}`);
    }
    
    // For untitled documents, try to use:
    // 1. Current workspace folder
    // 2. First workspace folder
    // 3. Last used directory from state
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        // Use the first workspace folder
        return vscode.Uri.joinPath(workspaceFolders[0].uri, `${baseName}.${extension}`);
    }
    
    return undefined;
}

export async function exportDiagramAsSvg(document: vscode.TextDocument, svgcode: string): Promise<void> {
    try {
        const defaultUri = getDefaultSaveLocation(document, 'svg');

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

export async function exportDiagramAsPng(document: vscode.TextDocument, pngBase64: string): Promise<void> {
    try {
        const defaultUri = getDefaultSaveLocation(document, 'png');

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