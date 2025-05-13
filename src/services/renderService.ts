import * as vscode from 'vscode';
import path from 'path';
import os from 'os';
import { getDefaultSaveUri } from './filenameService';

export async function saveDiagramAsSvg(document: vscode.TextDocument, svgcode: string, diagramCode: string = ''): Promise<void> {
    try {
        const defaultUri = await getDefaultSaveUri(document, 'svg', diagramCode);
        
        // Final safety check - if defaultUri is undefined, create an emergency one
        const safeUri = defaultUri || vscode.Uri.file(path.join(os.homedir(), 'untitled_diagram.svg'));

        // Ask user where to save the file
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: safeUri,
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

export async function saveDiagramAsPng(document: vscode.TextDocument, pngBase64: string, diagramCode: string = ''): Promise<void> {
    try {
        const defaultUri = await getDefaultSaveUri(document, 'png', diagramCode);
        
        // Final safety check - if defaultUri is undefined, create an emergency one
        const safeUri = defaultUri || vscode.Uri.file(path.join(os.homedir(), 'untitled_diagram.png'));

        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: safeUri,
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