import * as vscode from "vscode";
import { MermaidChart } from "./mermaidAPI";
import { MermaidChartAuthenticationProvider } from "./mermaidChartAuthenticationProvider";

export class MermaidChartVSCode extends MermaidChart {
  constructor() {
    const baseURL = getBaseUrl();
    const clientID = `469e30a6-2602-4022-aff8-2ab36842dc57`;
    super({
      baseURL,
      clientID,
    });
  }

  public async initialize(context: vscode.ExtensionContext) {
    await this.registerListeners(context);
    await this.setupAPI();
  }

  private async registerListeners(context: vscode.ExtensionContext) {
    /**
     * Register the authentication provider with VS Code.
     * This will allow us to generate sessions when required
     */
    context.subscriptions.push(
      vscode.authentication.registerAuthenticationProvider(
        MermaidChartAuthenticationProvider.id,
        MermaidChartAuthenticationProvider.providerName,
        new MermaidChartAuthenticationProvider(this, context)
      )
    );

    /**
     * Sessions are changed when a user logs in or logs out.
     */
    context.subscriptions.push(
      vscode.authentication.onDidChangeSessions(async (e) => {
        if (e.provider.id === MermaidChartAuthenticationProvider.id) {
          await this.setupAPI();
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

const defaultBaseURL = "https://www.mermaidchart.com";

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
