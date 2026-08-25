import * as vscode from "vscode";

const configSection = "preview.mermaid";

export const enableTelemetrySetting = `${configSection}.enableTelemetry`;
export const showFeaturePopupsSetting = `${configSection}.showFeaturePopups`;

export function isPreviewTelemetryEnabled(): boolean {
  return vscode.env.isTelemetryEnabled &&
    vscode.workspace.getConfiguration(configSection).get<boolean>("enableTelemetry", true);
}

export function shouldShowFeaturePopups(): boolean {
  return vscode.workspace.getConfiguration(configSection).get<boolean>("showFeaturePopups", true);
}

export async function updatePreviewSetting(
  setting: "enableTelemetry" | "showFeaturePopups",
  value: boolean
): Promise<void> {
  await vscode.workspace
    .getConfiguration(configSection)
    .update(setting, value, vscode.ConfigurationTarget.Global);
}
