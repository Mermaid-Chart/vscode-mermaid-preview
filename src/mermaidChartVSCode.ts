import * as vscode from "vscode";
import { MermaidChart } from "@mermaidchart/sdk";
import { MermaidChartAuthenticationProvider } from "./mermaidChartAuthenticationProvider";
import { defaultBaseURL, updateViewVisibility } from "./util";
import { MermaidWebviewProvider } from "./panels/loginPanel";

export class MermaidChartVSCode extends MermaidChart {
  constructor() {
    const baseURL = getBaseUrl();
    const clientID = `469e30a6-2602-4022-aff8-2ab36842dc57`;
    super({
      baseURL,
      clientID,
    });
  }

  public async initialize(context: vscode.ExtensionContext, mermaidWebviewProvider?: MermaidWebviewProvider) {
    await this.registerListeners(context, mermaidWebviewProvider);
    await this.setupAPI();
  }

  public async login() {
    await this.loginToMermaidChart();
  }

  public async logout(context: vscode.ExtensionContext): Promise<void> {
    const session = await vscode.authentication.getSession(
      MermaidChartAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );
  
    if (session) {
      const authProvider = MermaidChartAuthenticationProvider.getInstance(this, context);
      await authProvider.removeSession(session.id);
      vscode.window.showInformationMessage(`You have successfully signed out from ${session.account.id}.`);
    } else {
      vscode.window.showInformationMessage('No active session found. You are already signed out.');
    }
  }
  

  private async registerListeners(context: vscode.ExtensionContext, mermaidWebviewProvider?: MermaidWebviewProvider) {
    /**
     * Register the authentication provider with VS Code.
     * This will allow us to generate sessions when required
     */
    context.subscriptions.push(
      vscode.authentication.registerAuthenticationProvider(
        MermaidChartAuthenticationProvider.id,
        MermaidChartAuthenticationProvider.providerName,
        MermaidChartAuthenticationProvider.getInstance(this, context)
      )
    );

    
    /**
     * Sessions are changed when a user logs in or logs out.
     */
    context.subscriptions.push(
      vscode.authentication.onDidChangeSessions(async (e) => {
        if (e.provider.id === MermaidChartAuthenticationProvider.id) {
          const session = await vscode.authentication.getSession(
            MermaidChartAuthenticationProvider.id,
            [],
            { createIfNone: false }
          );
          if (session) {
            this.setAccessToken(session.accessToken);
          } else {
            this.resetAccessToken();
          }
  
          if (!session) {
            await context.globalState.update("isUserLoggedIn", false);
            updateViewVisibility(false, mermaidWebviewProvider);
          } else {
            await context.globalState.update("isUserLoggedIn", true);
            updateViewVisibility(true, mermaidWebviewProvider);
          }
        }
      })
    );
    /**
     * When the configuration is changed, we need to refresh the base URL.
     */
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("mermaidChart.baseUrl")) {
        this.refreshBaseURL();
      }
    });
  }

  private async setupAPI() {
    const session = await vscode.authentication.getSession(
      MermaidChartAuthenticationProvider.id,
      [],
      {
        createIfNone: false,
      }
    );
    if (session) {
      this.setAccessToken(session.accessToken);
    }
  }

  private async loginToMermaidChart() {
    const session = await vscode.authentication.getSession(
      MermaidChartAuthenticationProvider.id,
      [],
      {
        createIfNone: true,
      }
    );
    this.setAccessToken(session.accessToken);
  }

  private async refreshBaseURL() {
    const baseURL = getBaseUrl();
    this.setBaseURL(baseURL);
  }
}


export function getBaseUrl(): string | undefined {
  const config = vscode.workspace.getConfiguration("mermaidChart");
  const baseURL = config.get<string>("baseUrl");

  if (baseURL) {
    return baseURL;
  }

  // If baseURL was not set, set it to default
  config.update("baseUrl", defaultBaseURL, true);
  return defaultBaseURL;
}