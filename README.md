# Mermaid Preview

Mermaid diagram previewer for Visual Studio Code.

[![](https://vsmarketplacebadge.apphb.com/version/vstirbu.vscode-mermaid-preview.svg)](https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview)
[![](https://vsmarketplacebadge.apphb.com/installs/vstirbu.vscode-mermaid-preview.svg)](https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview)
[![](https://vsmarketplacebadge.apphb.com/rating/vstirbu.vscode-mermaid-preview.svg)](https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview)

## Usage

0. Open a file containing Mermaid diagram
0. Choose `Preview Mermaid Diagram`
0. Move cursor inside the diagram

![activate](https://raw.github.com/vstirbu/vscode-mermaid-preview/master/images/activate.png)

![usage](https://raw.github.com/vstirbu/vscode-mermaid-preview/master/images/usage.png)

## Supported formats

The plugin detects mermaid diagrams in the following formats:

### HTML tag

```html
<div class="mermaid">
sequenceDiagram
  A-->B: Works!
</div>
```

### Markdown fenced code

<pre>
```mermaid
sequenceDiagram
  A-->B: Works!
```
</pre>

## Customize diagrams

You can customize the appearence of the previewed diagrams by setting the mermaid configuration in the workspace settings:

```json
{
  "mermaid": {
    "sequenceDiagram": {
      "mirrorActors": false
    }
  }
}
```

All mermaid configuration [options](http://knsv.github.io/mermaid/#mermaidapi) are supported. 