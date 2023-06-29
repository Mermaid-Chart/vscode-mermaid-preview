import axios from "axios";
import * as vscode from "vscode";
import { getBaseUrl, getApiToken } from "./conf";
const AxiosError = axios.AxiosError;

// [MermaidChart: 37efa77b-66b9-4285-8a69-bab7e73cf607]
const showErrorMessage = (errorMsg: string) => {
  vscode.window
    .showErrorMessage(
      errorMsg,
      {
        modal: false,
      },
      {
        title: "Configure Extension",
        isCloseAffordance: false,
      }
    )
    .then((selectedItem) => {
      if (selectedItem && selectedItem.title === "Configure Extension") {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "@ext:mermaidChart.vscode-mermaid-chart"
        );
      }
    });
};

export async function fetchMermaidChartProjects(): Promise<
  { id: string; title: string }[]
> {
  const token = getApiToken();
  const baseUrl = getBaseUrl();

  if (!token) {
    vscode.window.showErrorMessage(
      "Mermaid Charts API token is not configured."
    );
    return [];
  }

  if (!baseUrl) {
    vscode.window.showErrorMessage(
      "Mermaid Charts base URL is not configured."
    );
    return [];
  }
  try {
    const response = await axios.get(`${baseUrl}/rest-api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error fetching Mermaid Chart data:",
        error.message,
        error.request
      );

      if (error.response && error.response.status === 401) {
        showErrorMessage("Unauthorized access. Please check your API token.");
        // vscode.window.showErrorMessage(
        //   "Unauthorized access. Please check your API token."
        // );
      } else {
        vscode.window.showErrorMessage(
          "Error fetching Mermaid Chart data: " + error.message
        );
      }
    } else if (error instanceof Error) {
      console.error("Error fetching Mermaid Chart data:", error.message);
      vscode.window.showErrorMessage(
        "Error fetching Mermaid Chart data: " + error.message
      );
    } else {
      console.error("Error fetching Mermaid Chart data: unknown error");
      vscode.window.showErrorMessage("Error fetching Mermaid Chart data");
    }
    return [];
  }
}

export async function fetchMermaidChartDocuments(
  projectID: string
): Promise<{ documentID: string; title: string }[]> {
  const config = vscode.workspace.getConfiguration("mermaidChart");
  const token = config.get<string>("apiToken");
  const baseUrl = config.get<string>("baseUrl");

  if (!token) {
    vscode.window.showErrorMessage(
      "Mermaid Charts API token is not configured."
    );
    return [];
  }

  if (!baseUrl) {
    vscode.window.showErrorMessage(
      "Mermaid Charts base URL is not configured."
    );
    return [];
  }

  try {
    const response = await axios.get(
      `${baseUrl}/rest-api/projects/${projectID}/documents`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error fetching Mermaid Chart data:",
        error.message,
        error.request
      );

      if (error.response && error.response.status === 401) {
        showErrorMessage("Unauthorized access. Please check your API token.");
        // vscode.window.showErrorMessage(
        //   "Unauthorized access. Please check your API token."
        // );
      } else {
        vscode.window.showErrorMessage(
          "Error fetching Mermaid Chart data: " + error.message
        );
      }
    } else if (error instanceof Error) {
      console.error("Error fetching Mermaid Chart data:", error.message);
      vscode.window.showErrorMessage(
        "Error fetching Mermaid Chart data: " + error.message
      );
    } else {
      console.error("Error fetching Mermaid Chart data: unknown error");
      vscode.window.showErrorMessage("Error fetching Mermaid Chart data");
    }
    return [];
  }
}
