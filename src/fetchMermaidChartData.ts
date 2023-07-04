import axios from "axios";
import { window, commands, authentication } from "vscode";
import { getBaseUrl, getApiToken } from "./conf";
import { getMermaidChartSession } from "./mermaidChartAuthenticationProvider";

// [MermaidChart: 37efa77b-66b9-4285-8a69-bab7e73cf607]
const showErrorMessage = (errorMsg: string) => {
  window
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
        commands.executeCommand(
          "workbench.action.openSettings",
          "@ext:mermaidChart.vscode-mermaid-chart"
        );
      }
    });
};

async function getDataFromMermaidChart<T>(url: string): Promise<T[]> {
  const token = await getApiToken();
  console.log({ token });
  const baseUrl = getBaseUrl();

  if (!token) {
    window.showErrorMessage("Mermaid Charts API token is not configured.");
    return [];
  }

  if (!baseUrl) {
    window.showErrorMessage("Mermaid Charts base URL is not configured.");
    return [];
  }

  try {
    const response = await axios.get(baseUrl + url, {
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
      } else {
        window.showErrorMessage(
          "Error fetching Mermaid Chart data: " + error.message
        );
      }
    } else if (error instanceof Error) {
      console.error("Error fetching Mermaid Chart data:", error.message);
      window.showErrorMessage(
        "Error fetching Mermaid Chart data: " + error.message
      );
    } else {
      console.error("Error fetching Mermaid Chart data: unknown error");
      window.showErrorMessage("Error fetching Mermaid Chart data");
    }
    return [];
  }
}

export async function fetchMermaidChartProjects(): Promise<
  { id: string; title: string }[]
> {
  return getDataFromMermaidChart(`/rest-api/projects`);
}

export async function fetchMermaidChartDocuments(
  projectID: string
): Promise<{ documentID: string; title: string }[]> {
  return getDataFromMermaidChart(`/rest-api/projects/${projectID}/documents`);
}
