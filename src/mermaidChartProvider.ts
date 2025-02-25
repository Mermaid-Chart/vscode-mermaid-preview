import * as vscode from "vscode";
import { MermaidChartVSCode } from "./mermaidChartVSCode";
import { MCProject } from "./types";

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
export function getProjectIdForDocument(diagramId: string): string {
  return (
    allTreeViewProjectsCache.find((project) =>
      project?.children?.some((child) => child.uuid === diagramId)
    )?.uuid || ""
  );
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

export class Document implements MCTreeItem {
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
  public static isSyncing: boolean = false;
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

  public static async waitForSync(): Promise<boolean> {
    if (!MermaidChartProvider.isSyncing) {
      return true;
    }

    return new Promise((resolve) => {
      const checkSync = () => {
        if (!MermaidChartProvider.isSyncing) {
          resolve(true);
        } else {
          setTimeout(checkSync, 100);
        }
      };
      checkSync();
    });
  }

  getItemTypeFromUuid(uuid: string): string {
    if (allTreeViewProjectsCache.length === 0) {
        this.refresh();
    }

    const findItemType = (items: MCTreeItem[]): string => {
        for (const item of items) {
            if (item.uuid === uuid) {
                return item instanceof Project ? ITEM_TYPE_PROJECT : ITEM_TYPE_DOCUMENT;
            }
            const type = item.children?.length ? findItemType(item.children) : ITEM_TYPE_UNKNOWN;
            if (type !== ITEM_TYPE_UNKNOWN) return type;
        }
        return ITEM_TYPE_UNKNOWN;
    };

    return findItemType(allTreeViewProjectsCache);
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
      title: "Insert UUID",
      arguments: [element]
    };
     
    treeItem.contextValue = element.children ? "project" : "document";
  
    return treeItem;
  }
  
  async getChildren(element?: MCTreeItem): Promise<MCTreeItem[]> {
    if (!element) {
      if (allTreeViewProjectsCache.length > 0) {
        return Promise.resolve(allTreeViewProjectsCache);
      }

      try {
        MermaidChartProvider.isSyncing = true;
        return vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Mermaid Chart",
          cancellable: false
        }, async (progress) => {
          progress.report({ message: "Syncing diagrams from Mermaid..." });
          
          const mermaidChartProjects: MCProject[] = await this.mcAPI.getProjects();
          const projectMap = new Map<string, Project>();
          const allTreeViewProjects: Project[] = [];

          for (const project of mermaidChartProjects) {
              const projectInstance = new Project(
                project.id,
                new vscode.Range(0, 0, 0, 1),
                project.title,
                "",
              vscode.TreeItemCollapsibleState.Collapsed,
              []
              );
              projectMap.set(project.id, projectInstance);
          }

          for (const project of mermaidChartProjects) {
            const projectInstance = projectMap.get(project.id);
            if (!projectInstance) continue;

            if (project.parentID) {
                const parentProject = projectMap.get(project.parentID);
                if (parentProject) {
                  if (!parentProject.children) {
                    parentProject.children = [];
                  }
                  parentProject.children.push(projectInstance);
                }
            } else {
              allTreeViewProjects.push(projectInstance);
            }
          }

          for (const [projectId, projectInstance] of projectMap) {
            const mermaidChartDocuments = await this.mcAPI.getDocuments(projectId);
            for (const document of mermaidChartDocuments) {
              const documentTitle = document.title || "Untitled Diagram";
              const treeViewDocument = new Document(
                document.documentID,
                  new vscode.Range(0, 0, 0, 1),
                documentTitle,
                document.code || "",
                  vscode.TreeItemCollapsibleState.None
              );
              if (!projectInstance.children) {
                projectInstance.children = [];
          }
              projectInstance.children.push(treeViewDocument);
            }
          }

          allTreeViewProjectsCache = allTreeViewProjects;
          MermaidChartProvider.isSyncing = false;
          return allTreeViewProjects;
        });
      } finally {
        console.log('ending MermaidChartProvider.isSyncing', MermaidChartProvider.isSyncing)
      }
    } else {
      return element.children ?? [];
    }
  }
}
