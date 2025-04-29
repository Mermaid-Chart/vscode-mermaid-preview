import * as vscode from 'vscode';
import { MermaidChartVSCode } from './mermaidChartVSCode';
import { getDiagramFromCache } from './mermaidChartProvider';


export class RemoteSyncHandler {
    constructor(private mcAPI: MermaidChartVSCode) {}

    private hasUnresolvedConflicts(content: string): boolean {
        const conflictMarkers = [
            '<<<<<<< Current',
            '=======',
            '>>>>>>> Remote Changes'
        ];
        
        return conflictMarkers.some(marker => content.includes(marker));
    }

    async handleRemoteChanges(
        document: vscode.TextDocument,
        diagramId: string,
    ): Promise<'continue' | 'abort'> {
        try {
            const currentContent = document.getText();
            
            // Check if there are unresolved conflicts
            if (this.hasUnresolvedConflicts(currentContent)) {
                vscode.window.showErrorMessage('Please resolve merge conflicts before saving.');
                return 'abort';
            }
            const remoteVersion = await this.mcAPI.getDocument({ documentID: diagramId });
            const originalDiagram = getDiagramFromCache(diagramId);

            if (!remoteVersion?.code || !originalDiagram?.code) {
                return 'continue';
            }

            // If no remote changes, return continue
            if (!remoteVersion || remoteVersion.code === originalDiagram.code || currentContent === remoteVersion.code) {
                return 'continue';
            }

            // Show non-modal notification at bottom right
            const result = await vscode.window.showInformationMessage(
                'Remote diagram has been modified',
                'Pull Remote Changes',
                'Force Push Local Changes'
            );

            if (result === 'Pull Remote Changes') {
                const canSaveFile = await this.insertMergeConflictMarkers(document, remoteVersion.code);
                return canSaveFile ? 'continue' : 'abort'; // Abort to prevent immediate save
            } else if (result === 'Force Push Local Changes') {
                return 'continue';
            }

            return 'abort';
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to check remote changes: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return 'abort';
        }
    }

    private findDifferences(local: string, remote: string): { localLines: string[], remoteLines: string[] } {
        const localLines = local.split('\n');
        const remoteLines = remote.split('\n');
        const differentLines = {
            localLines: [] as string[],
            remoteLines: [] as string[]
        };

        // Find the first different line
        let startDiff = 0;
        while (startDiff < localLines.length && 
               startDiff < remoteLines.length && 
               localLines[startDiff] === remoteLines[startDiff]) {
            startDiff++;
        }

        // Find the last different line
        let endDiffLocal = localLines.length - 1;
        let endDiffRemote = remoteLines.length - 1;
        while (endDiffLocal > startDiff && 
               endDiffRemote > startDiff && 
               localLines[endDiffLocal] === remoteLines[endDiffRemote]) {
            endDiffLocal--;
            endDiffRemote--;
        }

        // Extract the different sections
        differentLines.localLines = localLines.slice(startDiff, endDiffLocal + 1);
        differentLines.remoteLines = remoteLines.slice(startDiff, endDiffRemote + 1);

        return differentLines;
    }

    private async insertMergeConflictMarkers(
        document: vscode.TextDocument,
        remoteContent: string
    ): Promise<boolean> {
        const localContent = document.getText();
        
        // If contents are identical, can save
        if (localContent === remoteContent) {
            // vscode.window.showInformationMessage('No differences found between local and remote versions.');
            return true;
        }

        // Find the different sections
        const { localLines: diffLocalLines, remoteLines: diffRemoteLines } = this.findDifferences(localContent, remoteContent);

        // If both diff arrays are empty or contain only whitespace, can save
        if (diffLocalLines.every(line => !line.trim()) && diffRemoteLines.every(line => !line.trim())) {
            // vscode.window.showInformationMessage('No differences found between local and remote versions.');
            return true;
        }

        // Split both contents into lines for processing
        const allLocalLines = document.getText().split('\n');
        const allRemoteLines = remoteContent.split('\n');
        let mergedContent = '';

        // Add the common prefix
        const commonPrefixEndIndex = this.findFirstDifferentLine(allLocalLines, allRemoteLines);
        if (commonPrefixEndIndex > 0) {
            mergedContent += allLocalLines.slice(0, commonPrefixEndIndex).join('\n') + '\n';
        }

        // Only add conflict markers if there are actual non-empty differences
        if (diffLocalLines.some(line => line.trim()) || diffRemoteLines.some(line => line.trim())) {
            mergedContent += [
                '<<<<<<< Current',
                diffLocalLines.join('\n'),
                '=======',
                diffRemoteLines.join('\n'),
                '>>>>>>> Remote Changes'
            ].join('\n');
        }

        // Add the common suffix
        const commonSuffixStartIndex = this.findLastDifferentLine(allLocalLines, allRemoteLines);
        if (commonSuffixStartIndex < allLocalLines.length - 1) {
            mergedContent += '\n' + allLocalLines.slice(commonSuffixStartIndex + 1).join('\n');
        }

        // Only apply changes if there are actual differences and content has changed
        if (mergedContent !== localContent && mergedContent.trim()) {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            edit.replace(document.uri, fullRange, mergedContent);
            await vscode.workspace.applyEdit(edit);

            // vscode.window.showInformationMessage(
            //     'Resolve the conflicts and save the file when ready.'
            // );
            return false; // Don't save immediately after adding conflict markers
        } else {
            // vscode.window.showInformationMessage('No differences found between local and remote versions.');
            return true; // Can save if no real differences found
        }
    }

    private findFirstDifferentLine(localLines: string[], remoteLines: string[]): number {
        const minLength = Math.min(localLines.length, remoteLines.length);
        for (let i = 0; i < minLength; i++) {
            if (localLines[i] !== remoteLines[i]) {
                return i;
            }
        }
        return minLength;
    }

    private findLastDifferentLine(localLines: string[], remoteLines: string[]): number {
        let localIndex = localLines.length - 1;
        let remoteIndex = remoteLines.length - 1;
        
        while (localIndex >= 0 && remoteIndex >= 0) {
            if (localLines[localIndex] !== remoteLines[remoteIndex]) {
                return Math.max(localIndex, remoteIndex);
            }
            localIndex--;
            remoteIndex--;
        }
        return -1;
    }
} 