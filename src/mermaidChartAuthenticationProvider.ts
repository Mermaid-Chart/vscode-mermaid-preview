/* eslint-disable @typescript-eslint/naming-convention */
import {
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationProviderSessionOptions,
  AuthenticationSession,
  Disposable,
  env,
  EventEmitter,
  ExtensionContext,
  ProgressLocation,
  Uri,
  UriHandler,
  window,
} from "vscode";
import { v4 as uuid } from "uuid";
import { PromiseAdapter, promiseFromEvent } from "./util";
import { MermaidChartVSCode } from "./mermaidChartVSCode";

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
  public handleUri(uri: Uri) {
    this.fire(uri);
  }
}

export class MermaidChartAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  static id = "mermaidchart";
  static providerName = "MermaidChart";
  private sessionsKey = `${MermaidChartAuthenticationProvider.id}.sessions`;
  private _sessionChangeEmitter =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;
  private _codeExchangePromises = new Map<
    string,
    { promise: Promise<string>; cancel: EventEmitter<void> }
  >();
  private _uriHandler = new UriEventHandler();

  private static instance: MermaidChartAuthenticationProvider | null = null;

  static getInstance(
    mcAPI: MermaidChartVSCode,
    context: ExtensionContext
  ): MermaidChartAuthenticationProvider {
    if (!MermaidChartAuthenticationProvider.instance) {
      MermaidChartAuthenticationProvider.instance = new MermaidChartAuthenticationProvider(
        mcAPI,
        context
      );
    }
    return MermaidChartAuthenticationProvider.instance;
  }

  constructor(
    private readonly mcAPI: MermaidChartVSCode,
    private readonly context: ExtensionContext
  ) {
    this._disposable = Disposable.from(
      window.registerUriHandler(this._uriHandler)
    );
    this.mcAPI.setRedirectURI(this.redirectUri);
  }

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  get redirectUri() {
    const publisher = this.context.extension.packageJSON.publisher;
    const name = this.context.extension.packageJSON.name;
    return `${env.uriScheme}://${publisher}.${name}`;
  }

  /**
   * Get the existing sessions
   * @param scopes
   * @returns
   */
  public async getSessions(
    scopes: readonly string[] | undefined,
    options: AuthenticationProviderSessionOptions
  ): Promise<AuthenticationSession[]> {
    const allSessions = await this.context.secrets.get(this.sessionsKey);

    if (allSessions) {
      return JSON.parse(allSessions) as AuthenticationSession[];
    }

    return [];
  }

  /**
   * Create a new auth session
   * @param scopes
   * @returns
   */
  public async createSession(scopes: string[]): Promise<AuthenticationSession> {
    try {
      await this.login(scopes);
      const token = await this.mcAPI.getAccessToken();
      if (!token) {
        throw new Error(`MermaidChart login failure`);
      }
      const user = await this.getUserInfo();
      const session: AuthenticationSession = {
        id: uuid(),
        accessToken: token,
        account: {
          label: user.fullName,
          id: user.emailAddress,
        },
        scopes: [],
      };

      await this.context.secrets.store(
        this.sessionsKey,
        JSON.stringify([session])
      );

      this._sessionChangeEmitter.fire({
        added: [session],
        removed: [],
        changed: [],
      });

      window.showInformationMessage(`Signed in with ${session.account.id}`);
      return session;
    } catch (e) {
      window.showErrorMessage(`Sign in failed: ${e}`);
      throw e;
    }
  }

  /**
   * Remove an existing session
   * @param sessionId
   */
  public async removeSession(sessionId: string): Promise<void> {
    const allSessions = await this.context.secrets.get(this.sessionsKey);
    if (allSessions) {
      let sessions = JSON.parse(allSessions) as AuthenticationSession[];
      const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
      const session = sessions[sessionIdx];
      sessions.splice(sessionIdx, 1);
      this.mcAPI.resetAccessToken();
      await this.context.secrets.store(
        this.sessionsKey,
        JSON.stringify(sessions)
      );

      if (session) {
        this._sessionChangeEmitter.fire({
          added: [],
          removed: [session],
          changed: [],
        });
      }
    }
  }

  /**
   * Dispose the registered services
   */
  public async dispose() {
    this._disposable.dispose();
  }

  /**
   * Log in to MermaidChart
   */
  private async login(scopes: string[] = []) {
    return await window.withProgress<string>(
      {
        location: ProgressLocation.Notification,
        title: "Signing in to MermaidChart...",
        cancellable: true,
      },
      async (_, token) => {
        const authData = await this.mcAPI.getAuthorizationData();
        const uri = Uri.parse(authData.url);
        await env.openExternal(uri);

        let codeExchangePromise = this._codeExchangePromises.get(
          authData.scope
        );
        if (!codeExchangePromise) {
          codeExchangePromise = promiseFromEvent(
            this._uriHandler.event,
            this.handleUri(scopes)
          );
          this._codeExchangePromises.set(authData.scope, codeExchangePromise);
        }

        try {
          return await Promise.race([
            codeExchangePromise.promise,
            new Promise<string>((_, reject) =>
              setTimeout(() => reject("Cancelled"), 60000)
            ),
            promiseFromEvent<any, any>(
              token.onCancellationRequested,
              (_, __, reject) => {
                reject("User Cancelled");
              }
            ).promise,
          ]);
        } finally {
          codeExchangePromise?.cancel.fire();
          this._codeExchangePromises.delete(authData.scope);
        }
      }
    );
  }

  /**
   * Handle the redirect to VS Code (after sign in from Auth0)
   * @param scopes
   * @returns
   */
  private handleUri: (
    scopes: readonly string[]
  ) => PromiseAdapter<Uri, string> =
    (scopes) => async (uri, resolve, reject) => {
      await this.mcAPI.handleAuthorizationResponse(
        new URLSearchParams(uri.query)
      );
      resolve("done");
    };

  private async getUserInfo() {
    return await this.mcAPI.getUser();
  }
}
