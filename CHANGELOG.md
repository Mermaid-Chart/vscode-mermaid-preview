# Change Log
### 2.2.3 -2025-04-22
### New Features
- Added support to render Mermaid diagrams directly in the VS Code Markdown preview, replacing the raw Mermaid code blocks
- Added support for redux-color & redux-dark-color theme
### 2.2.0 -2025-04-07
### New Features
- Added three specialized AI tools for improved Mermaid diagramming:
  - **Syntax Documentation Tool**: Provides instant access to detailed diagram syntax guides
  - **Diagram Validation Tool**: Ensures correct syntax before rendering diagrams
  - **Diagram Preview Tool**: Streamlined visualization of Mermaid diagrams
- Enhanced VS Code Agent Mode with dedicated Mermaid tools for improved accuracy
- Improved AI chat participant capabilities with documentation-powered responses
- Better integration with GitHub Copilot Chat for more reliable diagram generation

### 2.1.3 -2025-04-03
### Fixed
- Resolved bugs.

### 2.1.2 -2025-03-26

### Changed 
- Upgraded to Mermaid `v11.6.0`
- Renamed `Update Diagram with Latest Changes` to `Regenerate Diagram`
- Added Redux as Default Theme


### 2.1.1 - 2025-03-21
### Fixed
- Resolved bug in AI chat requests.

### 2.1.0 - 2025-03-21
### New Features
- AI-powered diagramming capabilities.
- AI chat participant with `@mermaid-chart` command.
- Smart diagram regeneration based on source file changes.

### 2.0.4 - 2025-03-13
### Changed
- Upgraded to Mermaid `v11.5.0`.

### 2.0.3 - 2025-03-05
### Fixed
- Performance issues with auto-save.
- Improved Improved handling of save operations for Mermaid files

### 2.0.2 - 2025-02-28
### Fixed
- Broken image rendering issue.

### 2.0.0 - 2025-02-28
### New Features 
- **General Features:**
  - Real-time local edit & preview.
  - Syntax highlighting for all Mermaid diagrams.
  - Pan & zoom support in diagram preview.
  - Error highlighting.
  - Auto-detection of `.mmd` file extensions.
  - Handling of Mermaid diagrams in Markdown files.
  - Support for code snippets.
  - Direct links to official documentation via "Diagram Help".
- **For Mermaid Chart Users:**
  - Smart sync & save functionality.
  - Refresh diagram option.
- **Upgrades:**
  - Updated to Mermaid `v11.4.1`.


### 1.0.3 - 2023-07-17

- Added OAuth support for the MermaidChart plugin.

### 1.0.2 - 2023-07-14

- Added support for multiple languages.

### 1.0.1 - 2023-06-29

- Added default value "https://www.mermaidchart.com" for baseUrl configuration setting.
- Corrected inserted label in editor code.
- Added info in README.md about the MERMAIDCHART field in the explorer view.

### 1.0.0 - 2023-06-26

- Initial release with a first version of the plugin
