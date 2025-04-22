import layouts from '@mermaid-chart/layout-elk';
import mermaid, { MermaidConfig } from '@mermaid-chart/mermaid';



function renderMermaidElement(
    mermaidContainer: HTMLElement,
    writeOut: (mermaidContainer: HTMLElement, content: string) => void,
): {
    containerId: string;
    p: Promise<void>;
} {
    const containerId = `mermaid-container-${crypto.randomUUID()}`;
    const diagramId = `mermaid-${crypto.randomUUID()}`;

    const source = mermaidContainer.textContent ?? '';
    mermaidContainer.id = containerId;
    mermaidContainer.innerHTML = '';

    return {
        containerId,
        p: (async () => {
            try {
                // Catch any parsing errors
                await mermaid.parse(source);

                //  Render the diagram
                const renderResult = await mermaid.render(diagramId, source);
                writeOut(mermaidContainer, renderResult.svg);
                renderResult.bindFunctions?.(mermaidContainer);
            } catch (error) {
                if (error instanceof Error) {
                    const errorMessageNode = document.createElement('pre');
                    errorMessageNode.className = 'mermaid-error';
                    errorMessageNode.innerText = error.message;
                    writeOut(mermaidContainer, errorMessageNode.outerHTML);
                }

                throw error;
            }
        })()
    };
}

export async function renderMermaidBlocksInElement(root: HTMLElement, writeOut: (mermaidContainer: HTMLElement, content: string) => void): Promise<void> {
    // Delete existing mermaid outputs
    for (const el of Array.from(root.querySelectorAll('.mermaid > svg'))) {
        el.remove();
    }
    for (const svg of Array.from(root.querySelectorAll('svg'))) {
        if (svg.parentElement?.id.startsWith('dmermaid')) {
            svg.parentElement.remove();
        }
    }

    // We need to generate all the container ids sync, but then do the actual rendering async
    const renderPromises: Array<Promise<void>> = [];
    for (const mermaidContainer of Array.from(root.querySelectorAll<HTMLElement>('.mermaid'))) {
        renderPromises.push(renderMermaidElement(mermaidContainer, writeOut).p);
    }

    for (const p of renderPromises) {
        await p;
    }
}



export async function registerMermaidAddons() {
 
    mermaid.registerLayoutLoaders(layouts);
    mermaid.registerIconPacks([
        {
          name: 'fa',
          loader: () => import('@iconify-json/fa6-regular').then((m) => m.icons),
        },
        {
          name: 'aws',
          loader: () => import('@mermaid-chart/icons-aws').then((m) => m.icons),
        },
        {
          name: 'azure',
          loader: () => import('@mermaid-chart/icons-azure').then((m) => m.icons),
        },
        {
          name: 'gcp',
          loader: () => import('@mermaid-chart/icons-gcp').then((m) => m.icons),
        },
      ]);
   
}

export function loadMermaidConfig(): MermaidConfig {
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;

    return {
        startOnLoad: false,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default') as MermaidConfig['theme'],
    };
}