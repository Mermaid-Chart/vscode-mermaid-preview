# Mermaid Chart extension for Visual Studio Code

Official Mermaid extension for Visual Studio Code enables developers to seamlessly create, edit, preview and integrate mermaid diagrams from within the VS Code.

Now we offer a feature rich experience to create, visualize and edit Mermaid diagrams locally without needing to create any account. Made with ❤️ from the creators of Mermaid.js and we strive to provide the best Mermaid experience and provide regular updates.

Optionally, by creating a free MermaidChart account you can save and sync diagrams on the cloud, explore Mermaid AI, and experience the intuitive best-in-class drag-drop UI for Mermaid diagrams. 

![Image illustrating accessible diagrams in explorer panel](https://docs.mermaidchart.com/img/plugins/vscode-plugin.gif)

## Features

### Works with Latest Mermaid Version
We are the same team behind Mermaid.js, and our official extension works with the latest Mermaid version to provide support for new diagrams, enhancements and bug fixes. 

### Supported Diagrams
Currently supported diagrams and charts:
- Flowchart
- Sequence
- Block
- Elk
- Class
- Entity Relationship
- Gantt
- Mindmap
- State
- Timeline
- Gitgraph
- C4
- Sankey
- Block
- Pie chart
- Quadrant
- Requirement
- User Journey
- XY chart
- Zenuml

### Real-Time local Edit & Preview 
Now you get a side-by-side real time preview of the mermaid diagram while editing the diagram locally. This helps the user to see the true power of a mermaid's text-based diagram, where each change in text is reflected immediately on the diagram.

![Real-Time local Edit & Preview](https://docs.mermaidchart.com/img/plugins/vscode-plugin-full-view.png)

### Syntax Highlighting 
We now support syntax highlighting for all Mermaid diagrams when writing the Mermaid code. The syntax highlighting works well with the developer selected theme for VS Code. 

![Syntax Highlighting](https://docs.mermaidchart.com/img/plugins/vscode-plugin-highlighting-dark.png)

### Pan & Zoom 
We now support Pan and Zoom for the diagram preview, where the user pan to a specific part of a large diagram, and also set different levels of zoom based on his preference. We implemented the zoom with stickiness, so that zoom levels are not changed when you edit your diagram
Users can of course use the reset option to resize the preview diagram to fit the screen.
![Pan & Zoom](https://docs.mermaidchart.com/img/plugins/vscode-plugin-pan.png)


### Error Highlighting 
While writing the mermaid code, if you encounter syntax errors, the extension highlights the syntax error with an error message, and also indicates which line in the code might be causing the error. This helps the user to locate and fix the error. 
![Error Highlighting](https://docs.mermaidchart.com/img/plugins/vscode-plugin-error-indicator.png)

### Auto-Detect Mermaid diagrams in Markdown files
The extension automatically detects mermaid diagrams in the markdown files using the ```mermaid``` code block. 

This gives a unique opportunity for the users, they can now preview and edit the diagrams by clicking the edit diagram link directly from within the markdown file.
![Auto-Detect Mermaid diagrams in Markdown files](https://docs.mermaidchart.com/img/plugins/vscode-plugin-markdown-view.png)


### Support .mmd file extension as Mermaid Markdown file
Now we provide native support for the .mmd  extension. All the local mermaid diagrams will be loaded as a .mmd file. You can notice that the .mmd also has the Mermaid logo in the file explorer view.
![Support .mmd file extension as Mermaid Markdown file](https://docs.mermaidchart.com/img/plugins/vscode-plugin-file-icons.png)

### Smart Auto-Suggest with code snippets
Now based on the diagram type auto suggestions for code snippets will be triggered on type of “m”, and it will start showing relevant code snippets shorthand, that once selected, will expand to the proper code snippet.
![Smart Auto-Suggest with code snippets](https://docs.mermaidchart.com/img/plugins/vscode-plugin-code-suggestions.png)

### Diagram Help
If you get stuck with a diagram’s syntax or want to learn about other features for a given diagram, now you can directly access the respective diagram's detailed documentation on the official mermaid.js docs. 
![Diagram Help](https://docs.mermaidchart.com/img/plugins/vscode-plugin-diagram-help.png)

### Advanced Features when linking with MermaidChart
When you connect the extension with the MermaidChart account to explore some of the advanced features. With the integration to the Mermaid Chart service, this extension allows users to attach diagrams to their code and to gain quick access to updating diagrams.

You can explore all the these options by signing-up for a free account on www.mermaidchart.com 

#### Fetch & Use existing diagrams in Side Panel
Users can start login flow with their Mermaid Chart account and once logged-in, in the side panel all the projects and diagrams from your account will be loaded in the side panel.
![Fetch & Use existing diagrams in Side Panel](https://docs.mermaidchart.com/img/plugins/vscode-plugin-activitybar.png)

#### Link diagram directly in your code files
For each diagram in the Side Panel, user will see two options:
- Download: This will open the mermaid chart diagram locally for editing and will be connected to the Mermaid chart. Once the edited diagram is saved, or the user does a  ctrl+s, it will sync diagrams back to mermaid chart accounts as well
![Download](https://docs.mermaidchart.com/img/plugins/vscode-plugin-download.png)
- Link Diagram : When you click on a diagram, that diagram (its diagram id) will be inserted into the code editor as a comment at the position of the cursor. And users will get an option to preview or edit the diagram from this diagram id.
![Link Diagrams](https://docs.mermaidchart.com/img/plugins/vscode-plugin-link-diagram.png)

#### Smart Sync to promote collaboration
When a  user modifies an existing diagram, before saving it to MermaidChart service, it smartly checks if any modification is made in the web view, and if found, it indicates to the user to resolve any conflicts, and then save the resolved diagram back. 
![Smart Sync to promote collaboration 1](https://docs.mermaidchart.com/img/plugins/vscode-plugin-smart-indicator-view.png)

![Smart Sync to promote collaboration 2](https://docs.mermaidchart.com/img/plugins/vscode-plugin-smart-indicator.png)

#### Refresh 
To get the latest changes of diagrams from Mermaid Chart, click on the button named Refresh at the top in the side panel.

![Refresh ](https://docs.mermaidchart.com/img/plugins/vscode-plugin-refresh.png)

#### Open in Web View 
Users now have the option to open and edit diagrams in the web view on www.mermaidchart.com in the browser. This will enable them to use the best-in-class Visual Editor with drag and drop interface to modify the diagram, Mermaid AI, use diagrams in Presentations etc
![Open in Web View](https://docs.mermaidchart.com/img/plugins/vscode-plugin-mermaidchart.png)

### Commands

| Command | Description |
|---------|------------|
| **MermaidChart: Create Diagram** | Creates a new Mermaid diagram in the editor. |
| **MermaidChart: Login** | Logs in to the Mermaid Chart service to access and manage diagrams. |
| **MermaidChart: Logout** | Logs out from the Mermaid Chart service.. |
| **MermaidChart: Sync Diagram** | Synchronizes the current diagram with Mermaid Chart.. |
| **MermaidChart: Preview Diagram** | Opens a preview of the selected Mermaid diagram within the editor. |


### Extension Settings

This extension contributes the following settings:
- `mermaidChart.baseUrl`: This points to the instance of the mermaid chart you are running, for the public service this is `https://www.mermaidchart.com/`.
- `mermaid.vscode.dark`: Defines the theme used for Mermaid diagrams when VS Code is in dark mode.
- `mermaid.vscode.light`: Defines the theme used for Mermaid diagrams when VS Code is in light mode.

## Release Notes

### 2.0.2 - 2025-02-28
- Broken images fix

### 2.0.0 - 2025-02-28
New General Features
- Real-Time Local Edit & Preview
- Syntax Highlight for all Mermaid diagrams
- Pan & Zoom for diagram preview
- Error Highlighting
- Auto-detech `.mmd` file extension
- Handle Mermaid diagram in Markdown files
- Support for Code Snippets
- Diagram Help to link directly to official documentation
- New features for LoggedIn Users
- Smart sync & Save
- Refresh diagram
- Dependency Update
- Upgraded to latest Mermaid version `v11.4.1` 

- Added OAuth support for the MermaidChart plugin.
### 1.0.3 - 2023-07-17

- Added OAuth support for the MermaidChart plugin.

### 1.0.2 - 2023-07-14

- Added support for multiple languages including python, markdown, yamletc.

### 1.0.1 - 2023-06-29

- Added default value "https://www.mermaidchart.com" for baseUrl configuration setting.
- Corrected inserted label in editor code.
- Added info in README.md about the MERMAIDCHART field in the explorer view.

### 1.0.0 - 2023-06-26

- Initial release of the Mermaid Chart extension for Visual Studio Code.


#
