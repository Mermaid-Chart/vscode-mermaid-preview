/* eslint-disable @typescript-eslint/naming-convention */
import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
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
import { getEncodedSHA256Hash, PromiseAdapter, promiseFromEvent } from "./util";
import defaultAxios from "axios";

const test = true;
export const AUTH_TYPE = `mermaidchart`;
const AUTH_NAME = `MermaidChart`;
const CLIENT_ID = `469e30a6-2602-4022-aff8-2ab36842dc57`;
const SESSIONS_SECRET_KEY = `${AUTH_TYPE}.sessions`;
const MERMAIDCHART_BASEURL = test
  ? "http://127.0.0.1:5174"
  : "https://www.mermaidchart.com";

const axios = defaultAxios.create({
  baseURL: MERMAIDCHART_BASEURL,
});

interface OAuthAuthorizationParams {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  code_challenge_method: "S256";
  code_challenge: string;
  state: string;
  scope: string;
}

const URLS = {
  oauth: {
    authorize: (params: OAuthAuthorizationParams) =>
      `/oauth/authorize?${new URLSearchParams(
        Object.entries(params)
      ).toString()}`,
    token: `/oauth/token`,
  },
  rest: {
    users: {
      self: `/rest-api/users/me`,
    },
  },
} as const;

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
  public handleUri(uri: Uri) {
    this.fire(uri);
  }
}

interface AuthState {
  codeVerifier: string;
}

export class MermaidChartAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  private _sessionChangeEmitter =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;
  private _pendingStates: Record<string, AuthState> = {};
  private _codeExchangePromises = new Map<
    string,
    { promise: Promise<string>; cancel: EventEmitter<void> }
  >();
  private _uriHandler = new UriEventHandler();

  constructor(private readonly context: ExtensionContext) {
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(
        AUTH_TYPE,
        AUTH_NAME,
        this,
        { supportsMultipleAccounts: false }
      ),
      window.registerUriHandler(this._uriHandler)
    );
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
    scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    // return [];
    const allSessions = await this.context.secrets.get(SESSIONS_SECRET_KEY);

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
      const token = await this.login(scopes);
      if (!token) {
        throw new Error(`MermaidChart login failure`);
      }

      const userinfo: { fullName: string; emailAddress: string } =
        await this.getUserInfo(token);

      const session: AuthenticationSession = {
        id: uuid(),
        accessToken: token,
        account: {
          label: userinfo.fullName,
          id: userinfo.emailAddress,
        },
        scopes: [],
      };

      await this.context.secrets.store(
        SESSIONS_SECRET_KEY,
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
    const allSessions = await this.context.secrets.get(SESSIONS_SECRET_KEY);
    if (allSessions) {
      let sessions = JSON.parse(allSessions) as AuthenticationSession[];
      const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
      const session = sessions[sessionIdx];
      sessions.splice(sessionIdx, 1);

      await this.context.secrets.store(
        SESSIONS_SECRET_KEY,
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
   * Log in to Auth0
   */
  private async login(scopes: string[] = []) {
    return await window.withProgress<string>(
      {
        location: ProgressLocation.Notification,
        title: "Signing in to MermaidChart...",
        cancellable: true,
      },
      async (_, token) => {
        const stateId = uuid();

        this._pendingStates[stateId] = {
          codeVerifier: uuid(),
        };

        const scopeString = scopes.join(" ");

        const params: OAuthAuthorizationParams = {
          client_id: CLIENT_ID,
          redirect_uri: this.redirectUri,
          response_type: "code",
          code_challenge_method: "S256",
          code_challenge: getEncodedSHA256Hash(
            this._pendingStates[stateId].codeVerifier
          ),
          state: stateId,
          scope: scopes.join(" "),
        };
        const uri = Uri.parse(
          `${MERMAIDCHART_BASEURL}${URLS.oauth.authorize(params)}`
        );
        await env.openExternal(uri);

        let codeExchangePromise = this._codeExchangePromises.get(scopeString);
        if (!codeExchangePromise) {
          codeExchangePromise = promiseFromEvent(
            this._uriHandler.event,
            this.handleUri(scopes)
          );
          this._codeExchangePromises.set(scopeString, codeExchangePromise);
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
          delete this._pendingStates[stateId];
          codeExchangePromise?.cancel.fire();
          this._codeExchangePromises.delete(scopeString);
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
      const query = new URLSearchParams(uri.query);

      const authorizationToken = query.get("code");
      const state = query.get("state");

      if (!authorizationToken) {
        reject(new Error("No token"));
        return;
      }
      if (!state) {
        reject(new Error("No state"));
        return;
      }

      const pendingState = this._pendingStates[state];
      // Check if it is a valid auth request started by the extension
      if (!pendingState) {
        reject(new Error("State not found"));
        return;
      }

      const tokenResponse = await defaultAxios.post(
        MERMAIDCHART_BASEURL + URLS.oauth.token,
        {
          client_id: CLIENT_ID,
          redirect_uri: this.redirectUri,
          code_verifier: pendingState.codeVerifier,
          code: authorizationToken,
        }
      );

      resolve(tokenResponse.data.access_token);
    };

  /**
   * Get the user info from Auth0
   * @param token
   * @returns
   */
  private async getUserInfo(token: string) {
    const response = await axios.get(URLS.rest.users.self, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}

export const getMermaidChartSession = async () => {
  const session = await authentication.getSession(AUTH_TYPE, [], {
    createIfNone: true,
  });
  return session;
};
