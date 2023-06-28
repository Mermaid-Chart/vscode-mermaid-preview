import * as vscode from 'vscode';

export function getBaseUrl(): string | undefined {
  const config = vscode.workspace.getConfiguration('mermaidChart');
  const baseUrl = config.get<string>('baseUrl');

  return baseUrl;
}

export function getApiToken(): string | undefined {
  const config = vscode.workspace.getConfiguration('mermaidChart');
  const apiToken = config.get<string>('apiToken');

  return apiToken;
}
