import * as vscode from "vscode";
const baseUrlDefault = "https://www.mermaidchart.com";

export function getBaseUrl(): string | undefined {
  const config = vscode.workspace.getConfiguration("mermaidChart");
  const baseUrl = config.get<string>("baseUrl");

  // If baseUrl is not set, set it to the default value and return it.
  if (!baseUrl) {
    setBaseUrlDefault();
    return baseUrlDefault;
  } else {
    return baseUrl;
  }
}

export function setBaseUrlDefault() {
  const config = vscode.workspace.getConfiguration("mermaidChart");
  config.update("baseUrl", baseUrlDefault, true);

  return;
}

export function getApiToken(): string | undefined {
  const config = vscode.workspace.getConfiguration("mermaidChart");
  const apiToken = config.get<string>("apiToken");

  return apiToken;
}
