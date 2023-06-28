import * as vscode from 'vscode';
import { fetchMermaidChartDocuments, fetchMermaidChartProjects } from './fetchMermaidChartData';

let allTreeViewProjectsCache: Project[] = [];

export const ITEM_TYPE_PROJECT = 'project';
export const ITEM_TYPE_DOCUMENT = 'document';
export const ITEM_TYPE_UNKNOWN = 'unknown';

export class MyTreeItem extends vscode.TreeItem {
  uuid: string;
  range: vscode.Range;
  title: string;
  children?: MyTreeItem[];

  constructor(uuid: string, range: vscode.Range, title: string, children?: MyTreeItem[]) {
    super(
      title,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.uuid = uuid;
    this.range = range;
    this.title = title;
  }
}

class Document implements MyTreeItem {
  uuid: string;
  range: vscode.Range;
  title: string;
  collapsibleState: vscode.TreeItemCollapsibleState.None;
  children?: MyTreeItem[];

  constructor(
    uuid: string,
    range: vscode.Range,
    title: string,
    collapsibleState: vscode.TreeItemCollapsibleState.None
  ) {
    this.uuid = uuid;
    this.range = range;
    this.title = title;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }

  getTreeItem(): vscode.TreeItem {
    return {
      collapsibleState: vscode.TreeItemCollapsibleState.None
    };
  }
}

class Project implements MyTreeItem {
  uuid: string;
  range: vscode.Range;
  title: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  children?: MyTreeItem[];
  constructor(
    uuid: string,
    range: vscode.Range,
    title: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    children?: MyTreeItem[]
  ) {
    this.uuid = uuid;
    this.range = range;
    this.title = title;
    this.collapsibleState = collapsibleState;
    this.children = children;
  }

  getTreeItem(): vscode.TreeItem {
    return {
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    };
  }
}

export class MermaidChartProvider implements vscode.TreeDataProvider<MyTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | void> =
    new vscode.EventEmitter<MyTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    allTreeViewProjectsCache = [];
    this._onDidChangeTreeData.fire();
  }

  getItemTypeFromUuid(uuid: string): string {
    let allProjects: Project[] = [];
    if (allTreeViewProjectsCache.length > 0) {
      allProjects = allTreeViewProjectsCache;
    } else {
      this.refresh();
      allProjects = allTreeViewProjectsCache;
    }
    for (let i = 0; i < allProjects.length; i++) {
      const project = allProjects[i];
      if (project.uuid === uuid) {
        return ITEM_TYPE_PROJECT;
      }
      for (let j = 0; j < project.children!.length; j++) {
        const document = project.children![j];
        if (document.uuid === uuid) {
          return ITEM_TYPE_DOCUMENT;
        }
      }
    }
    return ITEM_TYPE_UNKNOWN;
  }

  getProjectOfDocument(uuid: string): Project | undefined {
    let allProjects: Project[] = [];
    if (allTreeViewProjectsCache.length > 0) {
      allProjects = allTreeViewProjectsCache;
    } else {
      this.refresh();
      allProjects = allTreeViewProjectsCache;
    }
    for (let i = 0; i < allProjects.length; i++) {
      const project = allProjects[i];
      for (let j = 0; j < project.children!.length; j++) {
        const document = project.children![j];
        if (document.uuid === uuid) {
          return project;
        }
      }
    }
    return undefined;
  }

  getTreeItem(element: MyTreeItem): vscode.TreeItem {
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
      command: 'mermaidChart.insertUuidIntoEditor',
      title: 'Insert UUID into Editor',
      arguments: [element.uuid]
    };
    return treeItem;
  }

  async getChildren(element?: MyTreeItem): Promise<MyTreeItem[]> {
    const allTreeViewProjects: Project[] = [];

    if (!element) {
      if (allTreeViewProjectsCache.length > 0) {
        return Promise.resolve(allTreeViewProjectsCache);
      }
      // Fetch all projects and associated documents
      // and build a tree view
      const mermaidChartProjects = await fetchMermaidChartProjects();
      for (let i = 0; i < mermaidChartProjects.length; i++) {
        const project = mermaidChartProjects[i];
        const projectDocuments = [];
        const mermaidChartDocuments = await fetchMermaidChartDocuments(project.id);

        // Get all documents for a project and insert as children of project
        for (let i = 0; i < mermaidChartDocuments.length; i++) {
          if (mermaidChartDocuments[i].title === null) {
            mermaidChartDocuments[i].title = 'Untitled Diagram';
          }

          const treeViewDocument = new Document(
            mermaidChartDocuments[i].documentID,
            new vscode.Range(0, 0, 0, 1),
            mermaidChartDocuments[i].title,
            vscode.TreeItemCollapsibleState.None
          );
          projectDocuments.push(treeViewDocument);
        }
        const treeViewProject = new Project(
          project.id,
          new vscode.Range(0, 0, 0, 1),
          project.title,
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
