import * as vscode from "vscode";

export const MERMAID_CHART_EXTENSION_ID = "MermaidChart.vscode-mermaid-chart";
export const THIS_EXTENSION_ID = "vstirbu.vscode-mermaid-preview";
export const IS_ACTIVE_CONTEXT_KEY = "mermaidPreview:isActive";

/**
 * Preview owns UI when Chart is absent, or Chart is present but the user is signed out.
 * Chart owns UI when the user is signed into Mermaid Chart (PLUG-145).
 * Activity-bar icons stay visible either way; this only gates commands/menus.
 */
export async function shouldPreviewOwnUi(): Promise<boolean> {
  const chartExt = vscode.extensions.getExtension(MERMAID_CHART_EXTENSION_ID);
  if (!chartExt) {
    return true;
  }

  try {
    if (!chartExt.isActive) {
      await chartExt.activate();
    }
  } catch {
    return true;
  }

  return !isChartSignedInSync();
}

/** Updates `mermaidPreview:isActive` for sidebar/menus/command visibility. */
export async function syncPreviewActiveContext(): Promise<boolean> {
  const ownUi = await shouldPreviewOwnUi();
  await vscode.commands.executeCommand("setContext", IS_ACTIVE_CONTEXT_KEY, ownUi);
  return ownUi;
}

/** Chart's activate export; silent getSession cannot see another extension's session. */
export function isChartSignedInSync(): boolean {
  const chartExt = vscode.extensions.getExtension(MERMAID_CHART_EXTENSION_ID);
  if (!chartExt?.isActive) {
    return false;
  }
  const exported = (chartExt.exports as { isSignedIn?: () => boolean } | undefined)?.isSignedIn;
  return typeof exported === "function" && !!exported();
}

export function shouldPreviewHandleMarkdownPreview(): boolean {
  return !isChartSignedInSync();
}

type ChartExports = {
  isSignedIn?: () => boolean;
  onDidChangeSignIn?: vscode.Event<boolean>;
};

let chartSignInSub: vscode.Disposable | undefined;

/** Listen for Chart's post-update sign-in event so menus track login live, not only on reload. */
export async function bindChartSignInListener(
  context: vscode.ExtensionContext,
  onChange: () => void | Promise<void>,
): Promise<void> {
  chartSignInSub?.dispose();
  chartSignInSub = undefined;

  const chartExt = vscode.extensions.getExtension(MERMAID_CHART_EXTENSION_ID);
  if (!chartExt) {
    return;
  }

  try {
    if (!chartExt.isActive) {
      await chartExt.activate();
    }
  } catch {
    return;
  }

  const onDidChangeSignIn = (chartExt.exports as ChartExports | undefined)?.onDidChangeSignIn;
  if (typeof onDidChangeSignIn !== "function") {
    return;
  }

  chartSignInSub = onDidChangeSignIn(() => {
    void Promise.resolve(onChange());
  });
  context.subscriptions.push(chartSignInSub);
}
