import * as vscode from "vscode";
import { getMermaidChartSession } from "./mermaidChartAuthenticationProvider";
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
}

export async function getApiToken(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration("mermaidChart");
  const apiToken = config.get<string>("apiToken");

  if (!apiToken) {
    const session = await getMermaidChartSession();
    // TODO: Should we be updating the config token?
    config.update("apiToken", session.accessToken);
    return session.accessToken;
  }

  return apiToken;
}
