import * as vscode from "vscode";

export const MERMAID_CHART_EXTENSION_ID = "MermaidChart.vscode-mermaid-chart";
export const THIS_EXTENSION_ID = "vstirbu.vscode-mermaid-preview";
export const IS_ACTIVE_CONTEXT_KEY = "mermaidPreview:isActive";
/** Auth provider id registered by Mermaid Chart. */
const MERMAID_CHART_AUTH_ID = "mermaidchart";

/**
 * Preview owns UI when Chart is absent, or Chart is present but the user is signed out.
 * Chart owns UI when the user is signed into Mermaid Chart (PLUG-145).
 */
export async function shouldPreviewOwnUi(): Promise<boolean> {
  const chartExt = vscode.extensions.getExtension(MERMAID_CHART_EXTENSION_ID);
  if (!chartExt) {
    return true;
  }

  try {
    const session = await vscode.authentication.getSession(
      MERMAID_CHART_AUTH_ID,
      [],
      { silent: true },
    );
    return !session;
  } catch {
    return true;
  }
}

/** Updates `mermaidPreview:isActive` for sidebar/menus/command visibility. */
export async function syncPreviewActiveContext(): Promise<boolean> {
  const ownUi = await shouldPreviewOwnUi();
  await vscode.commands.executeCommand("setContext", IS_ACTIVE_CONTEXT_KEY, ownUi);
  return ownUi;
}
