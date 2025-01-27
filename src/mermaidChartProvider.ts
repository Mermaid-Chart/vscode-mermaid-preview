import * as vscode from "vscode";
import { MermaidChartVSCode } from "./mermaidChartVSCode";

export const ITEM_TYPE_PROJECT = "project";
export const ITEM_TYPE_DOCUMENT = "document";
export const ITEM_TYPE_UNKNOWN = "unknown";

let allTreeViewProjectsCache: Project[] = [];

export function setAllTreeViewProjectsCache(projects: Project[]): void {
  allTreeViewProjectsCache = projects;
}

export function getAllTreeViewProjectsCache(): Project[] {
  return allTreeViewProjectsCache;
}

export class MCTreeItem extends vscode.TreeItem {
  uuid: string;
  range: vscode.Range;
  title: string;
  code: string;
  children?: MCTreeItem[];

  constructor(
    uuid: string,
    range: vscode.Range,
    title: string,
    code: string,
    children?: MCTreeItem[]
  ) {
    super(
      title,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.uuid = uuid;
    this.code = code || "";
    this.range = range;
    this.title = title;
  }
}

class Document implements MCTreeItem {
  uuid: string;
  range: vscode.Range;
  title: string;
  code: string;
  collapsibleState: vscode.TreeItemCollapsibleState.None;
  children?: MCTreeItem[];

  constructor(
    uuid: string,
    range: vscode.Range,
    title: string,
    code: string,
    collapsibleState: vscode.TreeItemCollapsibleState.None
  ) {
    this.uuid = uuid;
    this.range = range;
    this.title = title;
    this.code = code || "";
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }

  getTreeItem(): vscode.TreeItem {
    return {
      collapsibleState: vscode.TreeItemCollapsibleState.None,
    };
  }
}

class Project implements MCTreeItem {
  uuid: string;
  range: vscode.Range;
  title: string;
  code: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  children?: MCTreeItem[];
  constructor(
    uuid: string,
    range: vscode.Range,
    title: string,
    code: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    children?: MCTreeItem[]
  ) {
    this.uuid = uuid;
    this.range = range;
    this.title = title;
    this.code = code || "";
    this.collapsibleState = collapsibleState;
    this.children = children;
  }

  getTreeItem(): vscode.TreeItem {
    return {
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
    };
  }
}

export class MermaidChartProvider
  implements vscode.TreeDataProvider<MCTreeItem>
{
  constructor(private mcAPI: MermaidChartVSCode) {}

  private _onDidChangeTreeData: vscode.EventEmitter<
    MCTreeItem | undefined | void
  > = new vscode.EventEmitter<MCTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<MCTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    allTreeViewProjectsCache = [];
    this._onDidChangeTreeData.fire();
  }

  getItemTypeFromUuid(uuid: string): string {
    let allProjects: Project[] = [];
    if (allTreeViewProjectsCache.length === 0) {
      this.refresh();
    }
    allProjects = allTreeViewProjectsCache;
    for (const project of allProjects) {
      if (project.uuid === uuid) {
        return ITEM_TYPE_PROJECT;
      }
      for (const document of project.children ?? []) {
        if (document.uuid === uuid) {
          return ITEM_TYPE_DOCUMENT;
        }
      }
    }
    return ITEM_TYPE_UNKNOWN;
  }

  getProjectOfDocument(uuid: string): Project | undefined {
    let allProjects: Project[] = [];
    if (allTreeViewProjectsCache.length === 0) {
      this.refresh();
    }
    allProjects = allTreeViewProjectsCache;
    for (const project of allProjects) {
      for (const document of project.children ?? []) {
        if (document.uuid === uuid) {
          return project;
        }
      }
    }
    return undefined;
  }

  getTreeItem(element: MCTreeItem): vscode.TreeItem {
    let collapsibleState: vscode.TreeItemCollapsibleState;
    if (element instanceof Document) {
      collapsibleState = vscode.TreeItemCollapsibleState.None;
    } else if (element instanceof Project) {
      collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    } else {
      collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    const treeItem = new vscode.TreeItem(`${element.title}`, collapsibleState);

    treeItem.command = {
      command: "mermaidChart.insertUuidIntoEditor",
      title: "Insert UUID into Editor",
      arguments: [element.uuid],
    };
    return treeItem;
  }

  async getChildren(element?: MCTreeItem): Promise<MCTreeItem[]> {
    const allTreeViewProjects: Project[] = [];

    if (!element) {
      if (allTreeViewProjectsCache.length > 0) {
        return Promise.resolve(allTreeViewProjectsCache);
      }
      // Fetch all projects and associated documents
      // and build a tree view
      const mermaidChartProjects = await this.mcAPI.getProjects();
      for (const project of mermaidChartProjects) {
        const projectDocuments = [];
        const mermaidChartDocuments = await this.mcAPI.getDocuments(project.id);

        // Get all documents for a project and insert as children of project
        for (const document of mermaidChartDocuments) {
          if (document.title === null) {
            document.title = "Untitled Diagram";
          }

          const treeViewDocument = new Document(
            document.documentID,
            new vscode.Range(0, 0, 0, 1),
            document.title,
            document.code,
            vscode.TreeItemCollapsibleState.None
          );
          projectDocuments.push(treeViewDocument);
        }
        const treeViewProject = new Project(
          project.id,
          new vscode.Range(0, 0, 0, 1),
          project.title,
          "",
          vscode.TreeItemCollapsibleState.None,
          projectDocuments
        );

        allTreeViewProjects.push(treeViewProject);
      }

      if (allTreeViewProjectsCache.length === 0) {
        allTreeViewProjectsCache.push(...allTreeViewProjects);
      }
      return Promise.resolve(allTreeViewProjects);
    } else {
      // Get the children of the element
      return element.children!;
    }
  }
}
