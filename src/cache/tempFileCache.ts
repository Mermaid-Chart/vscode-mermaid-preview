import * as vscode from "vscode";

export class TempFileCache {
    private static cacheKey = "mermaidTempFileURIs"; // Unique key for storing temporary file URIs

    // Retrieve stored URIs or initialize as an empty list
    static getAllTempUris(context: vscode.ExtensionContext): string[] {
        return context.globalState.get<string[]>(this.cacheKey, []);
    }

    // Add a URI to the temporary files list
    static addTempUri(context: vscode.ExtensionContext, uri: string) {
        const uris = this.getAllTempUris(context);
        if (!uris.includes(uri)) {
            uris.push(uri);
            context.globalState.update(this.cacheKey, uris);
        }
    }

    // Remove a URI from the temporary files list
    static removeTempUri(context: vscode.ExtensionContext, uri: string) {
        let uris = this.getAllTempUris(context);
        uris = uris.filter((existingUri) => existingUri !== uri);
        context.globalState.update(this.cacheKey, uris);
    }

    // Check if a URI is in the temporary files list
    static hasTempUri(context: vscode.ExtensionContext, uri: string): boolean {
        return this.getAllTempUris(context).includes(uri);
    }

    // Clear the entire temporary file URI list
    static clearTempUris(context: vscode.ExtensionContext) {
        context.globalState.update(this.cacheKey, []);
    }
}
