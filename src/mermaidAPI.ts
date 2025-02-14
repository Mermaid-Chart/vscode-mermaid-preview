/* eslint-disable @typescript-eslint/naming-convention */
import { v4 as uuid } from "uuid";
import defaultAxios, { AxiosInstance } from "axios";
import { createHash } from "crypto";

const defaultBaseURL = "https://www.mermaidchart.com"; // "http://127.0.0.1:5174"
const authorizationURLTimeout = 60_000;

export interface InitParams {
  clientID: string;
  redirectURI?: string;
  baseURL?: string;
}

export interface OAuthAuthorizationParams {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  code_challenge_method: "S256";
  code_challenge: string;
  state: string;
  scope: string;
}

interface AuthState {
  codeVerifier: string;
}

export interface MCUser {
  fullName: string;
  emailAddress: string;
}

export interface MCProject {
  id: string;
  title: string;
}

export interface MCDocument {
  documentID: string;
  projectID: string;
  code: string;
  major: string;
  minor: string;
  title: string;
}

export interface AuthorizationData {
  url: string;
  state: string;
  scope: string;
}
export class MermaidChart {
  private clientID: string;
  private baseURL!: string;
  private axios!: AxiosInstance;
  private pendingStates: Record<string, AuthState> = {};
  private redirectURI?: string;
  private accessToken?: string;

  constructor({ clientID, baseURL, redirectURI }: InitParams) {
    this.clientID = clientID;
    this.setBaseURL(baseURL || defaultBaseURL);
    if (redirectURI) {
      this.setRedirectURI(redirectURI);
    }
  }

  public setRedirectURI(redirectURI: string) {
    this.redirectURI = redirectURI;
  }

  public setBaseURL(baseURL: string = defaultBaseURL) {
    if (this.baseURL && this.baseURL === baseURL) {
      return;
    }
    this.baseURL = baseURL;
    this.accessToken = undefined;
    this.axios = defaultAxios.create({
      baseURL: this.baseURL,
    });

    this.axios.interceptors.response.use((res) => {
      // Reset token if a 401 is thrown
      if (res.status === 401) {
        this.resetAccessToken();
      }
      return res;
    });
  }

  public async getAuthorizationData({
    state,
    scope,
  }: {
    state?: string;
    scope?: string;
  } = {}): Promise<AuthorizationData> {
    if (!this.redirectURI) {
      throw new Error("redirectURI is not set");
    }

    const stateID = state ?? uuid();

    this.pendingStates[stateID] = {
      codeVerifier: uuid(),
    };

    const params: OAuthAuthorizationParams = {
      client_id: this.clientID,
      redirect_uri: this.redirectURI,
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: getEncodedSHA256Hash(
        this.pendingStates[stateID].codeVerifier
      ),
      state: stateID,
      scope: scope ?? "email",
    };

    // Deletes the state after 60 seconds
    setTimeout(() => {
      delete this.pendingStates[stateID];
    }, authorizationURLTimeout);

    const url = `${this.baseURL}${this.URLS.oauth.authorize(params)}`;
    return {
      url,
      state: stateID,
      scope: params.scope,
    };
  }

  public async handleAuthorizationResponse(query: URLSearchParams) {
    const authorizationToken = query.get("code");
    const state = query.get("state");

    if (!authorizationToken) {
      throw new RequiredParameterMissingError("token");
    }
    if (!state) {
      throw new RequiredParameterMissingError("state");
    }

    const pendingState = this.pendingStates[state];
    // Check if it is a valid auth request started by the extension
    if (!pendingState) {
      throw new OAuthError("invalid_state");
    }

    const tokenResponse = await defaultAxios.post(
      this.baseURL + this.URLS.oauth.token,
      {
        client_id: this.clientID,
        redirect_uri: this.redirectURI,
        code_verifier: pendingState.codeVerifier,
        code: authorizationToken,
      }
    );

    if (tokenResponse.status !== 200) {
      throw new OAuthError("invalid_token");
    }

    const accessToken = tokenResponse.data.access_token;
    await this.setAccessToken(accessToken);
  }

  /**
   * This method is used after authentication to save the access token.
   * It should be called by the plugins if any update to access token is made outside this lib.
   * @param accessToken access token to use for requests
   */
  public async setAccessToken(accessToken: string): Promise<void> {
    this.axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${accessToken}`;
    // This is to verify that the token is valid
    await this.getUser();
    this.accessToken = accessToken;
  }

  public async resetAccessToken(): Promise<void> {
    this.accessToken = undefined;
    this.axios.defaults.headers.common["Authorization"] = `Bearer none`;
  }

  /**
   * This function will be called before every request to get the access token to use for the request.
   * It should be overridden by the plugins to return the access token.
   * @returns the access token to use for requests
   */
  public async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error("No access token set. Please authenticate first.");
    }
    return this.accessToken;
  }

  public async getUser(): Promise<MCUser> {
    const user = await this.axios.get<MCUser>(this.URLS.rest.users.self);
    return user.data;
  }

  public async getProjects(): Promise<MCProject[]> {
    const projects = await this.axios.get<MCProject[]>(
      this.URLS.rest.projects.list
    );
    return projects.data;
  }

  public async getDocuments(projectID: string): Promise<MCDocument[]> {
    const projects = await this.axios.get<MCDocument[]>(
      this.URLS.rest.projects.get(projectID).documents
    );
    return projects.data;
  }

  public async getEditURL(document: Pick<MCDocument, "documentID">) {
    const url = `${this.baseURL}${this.URLS.diagram(document).edit}`;
    return url;
  }

  public async getRawDocument(
    document: Pick<MCDocument, "documentID" | "major" | "minor">,
    theme: "light" | "dark"
  ) {
    const raw = await this.axios.get<string>(
      this.URLS.raw(document, theme).svg
    );
    return raw.data;
  }

  public async saveDocumentCode(code: string, documentID: string): Promise<MCDocument> {
      const response = await this.axios.patch(this.URLS.rest.documents.patch(documentID), {
        code: code,
      });
      return response.data;
  }
  public async createDocumentWithDiagram(code: string, projectID: string): Promise<MCDocument> {
    const response = await this.axios.post(this.URLS.rest.projects.get(projectID).documents, {
      code : code
    });
    return response.data;
}

  private URLS = {
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
      documents: {
        get: (documentID: string) => {
          return `/rest-api/documents/${documentID}`;
        },
        patch: (documentID : string) => {
          return `/rest-api/documents/${documentID}`;
        }
      },
      projects: {
        list: `/rest-api/projects`,
        get: (projectID: string) => {
          return {
            documents: `/rest-api/projects/${projectID}/documents`,
          };
        },
      },
    },
    raw: (
      document: Pick<MCDocument, "documentID" | "major" | "minor">,
      theme: "light" | "dark"
    ) => {
      const base = `/raw/${document.documentID}?version=v${document.major}.${document.minor}&theme=${theme}&format=`;
      return {
        html: base + "html",
        svg: base + "svg",
        png: base + "png",
      };
    },
    diagram: (d: Pick<MCDocument, "documentID">) => {
      // const base = `/app/projects/${d.projectID}/diagrams/${d.documentID}/version/v${d.major}.${d.minor}`;
      return {
        // self: base,
        edit: `/app/diagrams/${d.documentID}`,
        // view: base + "/view",
      } as const;
    },
  } as const;
}

export class RequiredParameterMissingError extends Error {
  constructor(parameterName: string) {
    super(`Required parameter ${parameterName} is missing`);
  }
}
export class OAuthError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const getEncodedSHA256Hash = (str: string) => {
  const hash = createHash("sha256").update(str).digest();

  return Buffer.from(hash)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};
