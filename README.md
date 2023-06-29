# Mermaid Chart extension for Visual Studio Code

This extension is a Tool for visualizing and editing Mermaid diagrams in Visual Studio Code.The extension enables developers to view and edit diagrams stored in Mermaid Chart from Visual Studio Code. With the integration to the Mermaid Chart service, this extension allows users to attach diagrams to their code and to gain quick access to updating diagrams.

Simplify your development workflow with the Mermaid Chart extension.

## Features

In the explorer view under the MERMAIDCHART section you will find all the diagrams you have access to. When you click on a diagram, that diagram will be inserted into the code editor at the position of the cursor. To get the latest changes of diagrams from Mermaid Chart, click on the button named Refresh in the explorer view.

![Image illustrating accessible diagrams in explorer panel](./images/explorer-view.png 'Code view')

You can attach diagrams into your code. The attachments are highlighted with an icon in the footer.

![Image illustrating how a diagram is attached to the code](./images/code-view.png 'Code view')

You have two links associated with he diagram, one for viewing the diagram in a new tab in Visual Studio Code and one that opens the diagram for editing at Mermaid Chart. This way it is easy to consume the diagram as well as updating it if some detail needs to be corrected.

The following image show how a new tab is opened with the diagram after clicking on the view diagram link:

![Image illustrating the diagram view](./images/view-diagram.png 'View Diagram')

The other link opens the diagram for editing in a browser window.

![Image illustrating the editor](./images/edit-diagram.png 'Edit Diagram')

## Requirements

The Mermaid Chart extension for Visual Studio Code seamlessly integrates with the Mermaid Chart service, requiring an account to use. Choose between the free tier (limited to 5 diagrams) or the pro tier (unlimited diagrams). Collaborate by setting up teams and sharing diagrams within your development organisation. Simplify diagram management and enhance your workflow with Mermaid Chart for Visual Studio Code.

## Extension Settings

This extension contributes the following settings:

- `mermaidChart.baseUrl`: This points to the instance of mermaid chart you are running, for the public service this is `https://www.mermaidchart.com/`.
- `mermaidChart.apiToken`: This is the token used to access the Mermaid Chart API.

You can find/create a API token at the [user settings](https://www.mermaidchart.com/app/user/settings) page at Mermaid Chart.

1. Goto to the token section of the setting page

   ![Image showing the Create Token button](./images/create-token.png 'Create token')

2. Name the token, (optional), and click on the copy button at the bottom right.

   ![Image of a token](./images/name-and-copy.png 'Copy token')

3. Open settings in Visual Studio Code, filter on Mermaid Chart and paste API token in the "API token for Mermaid Chart" field.

   ![Image of a token](./images/settings.png 'Copy token')

## Release Notes


### 1.0.1
Added default value "https://www.mermaidchart.com" for baseUrl configuration setting.
Corrected inserted label in editor code.
Added info in README.md about the MERMAIDCHART field in the explorer view.

### 1.0.0

Initial release of the Mermaid CHart extension for Visual Studio Code.
