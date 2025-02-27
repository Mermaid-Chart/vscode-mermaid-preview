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
  function findProjectId(projects: any[]): string | null {
    for (const project of projects) {
      if (project?.children) {
        if (project.children.some((child: any) => child.uuid === diagramId)) {
          return project.uuid;
        }
        const foundId = findProjectId(project.children);
        if (foundId) return foundId;
      }
    }
    return null;
  }
  return findProjectId(allTreeViewProjectsCache) || "";
}


export function getDiagramFromCache(diagramId: string): Document | null {
  function findDiagram(projects: MCTreeItem[]): Document | null {
      for (const project of projects) {
          if (project?.children) {
              const foundDiagram = project.children.find(
                  (child) => child.uuid === diagramId && child instanceof Document
              );
              if (foundDiagram && foundDiagram instanceof Document) {
                  return foundDiagram;
              }
              const nestedDiagram = findDiagram(project.children);
              if (nestedDiagram) return nestedDiagram;
          }
      }
      return null;
  }
  return findDiagram(allTreeViewProjectsCache);
}

export function updateDiagramInCache(diagramId: string, newCode: string): void {
    function updateDiagram(projects: MCTreeItem[]): boolean {
        for (const project of projects) {
            if (project?.children) {
                const foundDiagram = project.children.find(
                    (child) => child.uuid === diagramId && child instanceof Document
                );
                if (foundDiagram && foundDiagram instanceof Document) {
                    foundDiagram.code = newCode;
                    return true;
                }
                const updated = updateDiagram(project.children);
                if (updated) return true;
            }
        }
        return false;
    }
    updateDiagram(allTreeViewProjectsCache);
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
      return this.syncMermaidChart();
    }
    return element.children ?? [];
  }

  public async syncMermaidChart(): Promise<MCTreeItem[]> {
    try {
      MermaidChartProvider.isSyncing = true;
      return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Mermaid Chart",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Syncing diagrams from Mermaid..." });
        const projects = await this.fetchAndProcessProjects();
        this._onDidChangeTreeData.fire();
        MermaidChartProvider.isSyncing = false;
        return projects;
      });
    } finally {
      MermaidChartProvider.isSyncing = false;
      console.log('ending MermaidChartProvider.isSyncing', MermaidChartProvider.isSyncing);
    }
  }

  private async fetchAndProcessProjects(): Promise<MCTreeItem[]> {
    const mermaidChartProjects = await this.mcAPI.getProjects();
    const projectMap = this.createProjectMap(mermaidChartProjects);
    const allTreeViewProjects = this.buildProjectHierarchy(mermaidChartProjects, projectMap);
    await this.fetchAndAttachDocuments(projectMap);    
    allTreeViewProjectsCache = allTreeViewProjects;
    return allTreeViewProjects;
  }

  private createProjectMap(projects: MCProject[]): Map<string, Project> {
    const projectMap = new Map<string, Project>();
    for (const project of projects) {
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
    return projectMap;
  }

  private buildProjectHierarchy(projects: MCProject[], projectMap: Map<string, Project>): Project[] {
    const allTreeViewProjects: Project[] = [];
    
    for (const project of projects) {
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
    
    return allTreeViewProjects;
  }

  private async fetchAndAttachDocuments(projectMap: Map<string, Project>): Promise<void> {
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
  }
}
