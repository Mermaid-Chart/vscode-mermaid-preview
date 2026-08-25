import * as path from "path";
import * as vscode from "vscode";

/** Set to false before release so each user sees the notes once for this version. */
const whatsNewAlwaysShowForTesting = true;

const whatsNewVersion = "2.2.0";
const whatsNewStateKey = "mermaidPreview.whatsNewVersion";

export async function showWhatsNew(context: vscode.ExtensionContext): Promise<void> {
  const lastShownVersion = context.globalState.get<string>(whatsNewStateKey);
  if (!whatsNewAlwaysShowForTesting && lastShownVersion === whatsNewVersion) {
    return;
  }

  const docPath = path.join(context.extensionPath, "docs", "MermaidPreviewChanges.md");
  const document = await vscode.workspace.openTextDocument(docPath);
  await vscode.commands.executeCommand("markdown.showPreview", document.uri);

  if (!whatsNewAlwaysShowForTesting) {
    await context.globalState.update(whatsNewStateKey, whatsNewVersion);
  }
}
