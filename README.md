# Mermaid diagram previewer for Visual Studio Code

### 🚀 Now Proudly Maintained by the Creators of Mermaid.js 🚀

Mermaid Preview is focused on free, local diagram previewing. Account login, cloud sync, and AI features now live in the [Mermaid Chart extension](https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart).

## Features

### Works with Latest Mermaid Version
We are the same team behind Mermaid.js, and our official extension works with the latest Mermaid version to provide support for new diagrams, enhancements and bug fixes. 

### Supported Diagrams
Currently supported diagrams and charts:
- Flowchart
- Sequence
- Block
- Class
- Entity Relationship
- Gantt
- Mindmap
- State
- Timeline
- Gitgraph
- C4
- Sankey
- Pie chart
- Quadrant
- Requirement
- User Journey
- Sankey
- XY chart
- Kanban
- Architecture
- Packet
- Radar

### Mermaid Preview Sidebar
There is no login in Mermaid Preview anymore, because everything in this extension is free. Open the Mermaid icon in the activity bar and you can start a new diagram right away with **Open preview** — no account, no sign-up, no trial. If you also want AI diagramming and cloud save, those features live in the [Mermaid Chart extension](https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart), and the sidebar links straight to it.

The icons in the sidebar title bar give you diagram help, a reload of the panel, settings, and the feedback form.

![Mermaid Preview Sidebar](https://docs.mermaidchart.com/img/plugins/vscode-preview-plugin-sidebar.png)

### Settings
The settings section has two toggles, and both are on by default.

- **Share usage analytics** — when you turn this off, the extension stops recording and sending any analytics or logs, including preview failure reports. VS Code's own telemetry setting is still respected on top of this, so turning telemetry off in VS Code also disables ours.
- **"Feature moved" popups** — some commands moved to the Mermaid Chart extension, and Sync Diagram, Connect Diagram, and Link Diagram now show a notice saying so instead of running. Turn this off if you do not want those notices anymore.

Use **Open VS code Mermaid settings** for the full list of extension settings, such as diagram themes and zoom limits. The reload icon in the title bar puts both toggles back to their defaults.

![Settings](https://docs.mermaidchart.com/img/plugins/vscode-preview-plugin-settings.png)

### Send us feedback
If something does not work or gets in your way, you can report it from the sidebar without leaving the editor and without an account. Open the feedback section and click **Open feedback form**.

![Send us feedback](https://docs.mermaidchart.com/img/plugins/vscode-preview-plugin-feedback.png)

Tell us what you were doing, how often it happens, and describe the problem. Your email is required so we can reply to you there once we have looked into it. You can send one feedback submission per day, and the reload icon clears the form if you want to start over.

![Feedback form](https://docs.mermaidchart.com/img/plugins/vscode-preview-plugin-feedback-form.png)

### Real-Time local Edit & Preview 
Now you get a side-by-side real time preview of the mermaid diagram while editing the diagram locally. This helps the user to see the true power of a mermaid's text-based diagram, where each change in text is reflected immediately on the diagram.

![Real-Time local Edit & Preview](https://docs.mermaidchart.com/img/plugins/vscode-plugin-full-view.png)

### Syntax Highlighting 
We now support syntax highlighting for all Mermaid diagrams when writing the Mermaid code. The syntax highlighting works well with the developer selected theme for VS Code. 

![Syntax Highlighting](https://docs.mermaidchart.com/img/plugins/vscode-plugin-highlighting-dark.png)

The extension also provides syntax highlighting for Mermaid diagrams embedded in Markdown files, with specific highlighting based on diagram types.

![Syntax Highlighting in Markdown](https://docs.mermaidchart.com/img/plugins/vscode-plugin-markdown-highlighting.png)

### Pan & Zoom 
We now support Pan and Zoom for the diagram preview, where the user pan to a specific part of a large diagram, and also set different levels of zoom based on his preference. We implemented the zoom with stickiness, so that zoom levels are not changed when you edit your diagram
Users can of course use the reset option to resize the preview diagram to fit the screen.
![Pan & Zoom](https://docs.mermaidchart.com/img/plugins/vscode-plugin-pan.png)

### Export Diagrams
Export your diagrams easily in both SVG and PNG formats. This makes it simple to:
- Include diagrams in documentation
- Share with team members
- Use in presentations
- Version control your diagram assets

The exported files maintain high quality and can be used across different platforms and tools.

![Export Diagrams](https://docs.mermaidchart.com/img/plugins/vscode-preview-plugin-export.png)

### Error Highlighting 
While writing the mermaid code, if you encounter syntax errors, the extension highlights the syntax error with an error message, and also indicates which line in the code might be causing the error. This helps the user to locate and fix the error. 
![Error Highlighting](https://docs.mermaidchart.com/img/plugins/vscode-plugin-error-indicator.png)

### Auto-Detect Mermaid diagrams in Markdown files
The extension automatically detects mermaid diagrams in the markdown files using the ```mermaid``` code block. 

This gives a unique opportunity for the users, they can now preview and edit the diagrams by clicking the edit diagram link directly from within the markdown file.
![Auto-Detect Mermaid diagrams in Markdown files](https://docs.mermaidchart.com/img/plugins/vscode-plugin-markdown-view.png)

### Mermaid Diagram Preview in Markdown File
This extension enables **live preview of Mermaid diagrams** directly within the **Markdown preview** in VS Code. No need to leave your editor!
![Markdown Preview](https://docs.mermaidchart.com/img/plugins/vscode-plugin-markdown-mermaid-preview.png)

### Support .mmd file extension as Mermaid Markdown file
Now we provide native support for the .mmd  extension. All the local mermaid diagrams will be loaded as a .mmd file. You can notice that the .mmd also has the Mermaid logo in the file explorer view.
![Support .mmd file extension as Mermaid Markdown file](https://docs.mermaidchart.com/img/plugins/vscode-plugin-file-icons.png)

### Smart Auto-Suggest with code snippets
Now based on the diagram type auto suggestions for code snippets will be triggered on type of "m", and it will start showing relevant code snippets shorthand, that once selected, will expand to the proper code snippet.
![Smart Auto-Suggest with code snippets](https://docs.mermaidchart.com/img/plugins/vscode-plugin-code-suggestions.png)

### Diagram Help
If you get stuck with a diagram's syntax or want to learn about other features for a given diagram, now you can directly access the respective diagram's detailed documentation on the official mermaid.js docs. 

![Diagram Help](https://docs.mermaidchart.com/img/plugins/vscode-preview-plugin-diagram-help.png)

### Commands

| Command | Description |
|---------|------------|
| **Mermaid Preview: Create Diagram** | Creates a new Mermaid diagram in the editor. |
| **Mermaid Preview: Preview Diagram** | Opens a preview of the selected Mermaid diagram within the editor. |
| **Mermaid Preview: Diagram help** | Opens the official Mermaid documentation for the current diagram type. |
| **Mermaid Preview: Settings** | Opens the settings section in the Mermaid Preview sidebar. |
| **Mermaid Preview: Reload** | Reloads the Mermaid Preview sidebar. |


### Extension Settings

This extension contributes the following settings:
- `mermaid.vscode.dark_theme`: Defines the theme used for Mermaid diagrams when VS Code is in dark mode.
- `mermaid.vscode.light_theme`: Defines the theme used for Mermaid diagrams when VS Code is in light mode.
- `mermaid.vscode.max_Zoom`: Maximum zoom level for diagrams, as a multiple of 100%. A value of `5` means 500%.
- `mermaid.vscode.max_CharLength`: Maximum number of characters allowed in a diagram's source.
- `mermaid.vscode.max_Edges`: Maximum number of edges allowed in a diagram's source.
- `preview.mermaid.enableTelemetry`: Allow Mermaid Preview to send anonymous preview failure analytics. Turn this off to stop all analytics. VS Code's own telemetry setting must also be enabled.
- `preview.mermaid.showFeaturePopups`: Show notifications when a feature has moved to the Mermaid Chart extension.
- `preview.mermaid.baseUrl`: Base URL used for extension usage analytics.

## Release Notes
### 2.2.0
Mermaid Preview is now focused on free, local diagram previewing.

#### What remains in Preview

- Live Mermaid preview with pan, zoom, and reset
- PNG and SVG export
- Mermaid rendering in Markdown preview
- Syntax highlighting, snippets, diagram templates, and Diagram help
- Local sidebar home and settings

#### What moved to Mermaid Chart

- Login and logout
- Cloud Sync, Connect, and Link Diagram workflows
- Mermaid Chart project and diagram browsing
- AI chat and diagram regeneration

The removed commands now show a notice instead of running their old cloud flows. Users who need account, cloud, or AI features can install the [Mermaid Chart extension](https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart).

### 2.1.1 -2025-05-26
- Enhanced Sidebar Layout to Improve User Guidance

### 2.1.0 -2025-05-13
- Added export functionality for SVG and PNG formats
- Added support for additional icon packs:
  - Logos (from iconify-json/logos)
  - Material Design Icons (MDI)
- Added syntax highlighting for markdown mermaid blocks based on diagram types
- Performance improvements and bug fixes
- Added configurable maximum zoom level setting
- Added settings for maximum text size and edges in diagrams

### 2.0.1 -2025-04-30
- Refined authentication behavior to remove unnecessary login prompts and Account badge indicators, ensuring a less intrusive experience.

### 2.0.0 -2025-04-29
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
- Added OAuth support for the MermaidChart.
- Added AI-powered diagramming capabilities
- Introduced AI chat participant with `@mermaid-chart` command
- Added smart diagram regeneration based on source file changes
- Added three specialized AI tools for improved Mermaid diagramming:
  - **Syntax Documentation Tool**: Provides instant access to detailed diagram syntax guides
  - **Diagram Validation Tool**: Ensures correct syntax before rendering diagrams
  - **Diagram Preview Tool**: Streamlined visualization of Mermaid diagrams
- Enhanced **VS Code Agent Mode** with dedicated **Mermaid tools** for improved accuracy
- Improved AI chat participant capabilities with documentation-powered responses
- Better integration with GitHub Copilot Chat for more reliable diagram generation
- Added support to render Mermaid diagrams directly in the VS Code Markdown preview, replacing the raw Mermaid code blocks
- Added support for redux-color & redux-dark-color theme


## 1.6.3 / 2022-06-24

- upgraded mermaid to version `9.1.2`

## 1.6.2 / 2020-06-11

- upgraded mermaid to version `8.10.2`

## 1.6.1 / 2020-03-11

- pinned parcel-bundler
- updated publish workflow

## 1.6.0 / 2020-03-11

- support for mermaid metadata in [structured field values](https://www.rfc-editor.org/rfc/rfc8941.html) format
- upgraded mermaid version `8.9.1`

## 1.5.7 / 2020-11-16

- upgraded mermaid version `8.8.3`

## 1.5.6 / 2020-09-29

- added `minimap` setting documentation
- upgraded mermaid version `8.8.0`

## 1.5.5 / 2020-08-13

- removed `lodash` dependency

## 1.5.4 / 2020-08-13

- switched from using hardcoded `vscode-resource` scheme to `Webview.asWebviewUri`

## 1.5.3 / 2020-04-16

- updated mermaid

## 1.5.2 / 2020-04-16

- fixed the fixed azure devops regex

## 1.5.1 / 2020-03-12

- fixed azure devops regex

## 1.5.0 / 2019-12-30

- added configuration for controlling minimap visibility

## 1.4.0 / 2019-12-09

- added support for azure devops

## 1.3.1 / 2019-12-04

- fixed parse crash #91

## 1.3.0 / 2019-12-04

- added support form state diagrams and pie charts via mermaid@8.4
- publish workflow with actions

## 1.2.0 / 2019-08-07

- bring font-awesome icon handling on par with mermaid online editor

## 1.1.0 / 2019-08-05

- improved rendering customization/theme handling
- added configuration options

## 1.0.0 / 2019-08-01

- new preview app running in webview
- added preview app to publishing pipeline
- removed travis
- remove mermaid processing in builtin markdown previewer

## 0.12.2 / 2019-07-22

- updated mermaid (8.2.2)

## 0.12.1 / 2019-06-27

- updated mermaid
- added pipeline for publish on tag

## 0.12.0 / 2019-04-19

- added zoom and pan

## 0.11.2 / 2019-03-29

- center vertically graph diagrams
- added extension pack containing: [syntax highlighting](https://marketplace.visualstudio.com/items?itemName=bpruitt-goddard.mermaid-markdown-syntax-highlighting)

## 0.11.1 / 2019-03-11

- fixed peer dependencies

## 0.11.0 / 2019-03-11

- transitioned from htmlPreview to webview
- rerender on configuration change
- apply user provided custom theme

## 0.10.2 / 2018-12-10

- added link to mermaid website.

## 0.10.1 / 2018-05-31

- fixed loop text style in sequence diagrams
- updated mermaid 8.0.0-rc8

## 0.10.0 / 2018-05-26

- added sphinx directive support

## 0.9.0 / 2018-05-23

- added hugo shortcodes support

## 0.8.3 / 2018-02-09

- added Mermaid language contribution

## 0.8.2 / 2017-11-25

- added a minimap of the diagram

## 0.8.1 / 2017-11-25

- flowcharts can be scrolled horisontally if diagram wider than pane
- reverted pan and zoom as is not working well on retina displays

## 0.8.0 / 2017-11-25

- added pan and zoom support for the rendered diagram

## 0.7.0 / 2017-11-08

- Support for standalone Mermaid files .mmd [iiska](https://github.com/iiska)

## 0.6.0 / 2017-09-18

- added preliminary support for previewing mermaid diagrams into default markdown previewer

## 0.5.4 / 2017-09-18

- fixed theme selection using new mermaid api

## 0.5.3 / 2017-09-14

- updated mermaid dependency v7.1.0

## 0.5.2 / 2017-09-12

- updated mermaid dependency v7.0.17

## 0.5.1 / 2017-08-21

- updated mermaid dependency v7.0.4

## 0.5.0 / 2017-06-30

- Added FontAwesome (4.7) support

## 0.4.4 / 2017-06-29

- Convert mermaid resource path to a file URL for OS compatibility [FrodgE](https://github.com/FrodgE)

## 0.4.3 / 2017-02-01

- update dependencies to mermaid 7.0.0

## 0.4.2 / 2016-11-24

- made arrowhead fix a configuration extension.
- fixed #13

## 0.4.1 / 2016-09-09

- render arrowheads (#2)

## 0.4.0 / 2016-07-08

- added support for dark theme

## 0.3.1 / 2016-06-14

- throttle preview update

## 0.3.0 / 2016-05-26

- added support for diagrams inside markdown fenced block

## 0.2.0 / 2106-05-19

- added diagram customization

## 0.1.0 / 2016-05-14

- preview diagram (light theme)
