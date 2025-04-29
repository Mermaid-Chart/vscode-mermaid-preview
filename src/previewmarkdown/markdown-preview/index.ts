/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */

import mermaid, { MermaidConfig } from "@mermaid-chart/mermaid";
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';

function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;
    const maxTextSize = configSpan?.dataset.maxTextSize;

    const config: MermaidConfig = {
        startOnLoad: false,
        maxTextSize: maxTextSize ? Number(maxTextSize) : 50000,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default' ) as MermaidConfig['theme'],
    };

    mermaid.initialize(config);
    registerMermaidAddons();
    
    renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
    });
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
