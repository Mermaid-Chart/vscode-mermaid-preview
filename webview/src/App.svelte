<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import layouts from '@mermaid-chart/layout-elk';
  import { vscode } from './utility/vscode'
  import ErrorMessage from './ErrorMessage.svelte';
  import Sidebar from './Sidebar.svelte';
  import { diagramContent as diagramData } from './diagramData';

  let diagramContent: string = diagramData;
 
  let errorMessage = "";
  let isToggled = true;
  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
  let panEnabled = false;
  let isErrorOccured= false;
  let theme: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "mc" | "null" = "neo"; 
  $: zoomLevel = 100;
  $: sidebarBackgroundColor = theme === "dark" || theme === "neo-dark" ? "#4d4d4d" : "white";
  $: iconBackgroundColor = theme === "dark" || theme === "neo-dark" ? "#4d4d4d" : "white";
  $: svgColor = theme === "neo-dark" || theme === "dark" ? "white" : "#2329D6";
  $: shadowColor = theme === "dark" || theme === "neo-dark" ? "#6b6b6b" : "#A3BDFF";


    async function initializeMermaid() {
      try {
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
        await mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: theme,
        });
      } catch (error) {
        console.error('Error initializing Mermaid:', error);
      }
    }

  async function renderDiagram() {
      await initializeMermaid();

    const element = document.getElementById("mermaid-diagram");
    if (element && diagramContent) {
      if (diagramContent === " ") { 
            element.innerHTML = ""; 
      }
      try {
        const parsed = await mermaid.parse(diagramContent || 'info')
        if (parsed?.config?.theme) {
          theme = parsed?.config?.theme;
        }
        errorMessage = "";
        const currentScale = panzoomInstance?.getScale() || 1;
        const currentPan = panzoomInstance?.getPan() || { x: 0, y: 0 };
        const { svg } = await mermaid.render("diagram-graph", diagramContent);
        element.innerHTML = svg;
        if (theme && (theme === "dark" || theme === "neo-dark" )) {
          element.style.backgroundColor= "#1e1e1e"
        } else {
          element.style.backgroundColor =  "white"
        }

        const svgElement = element.querySelector("svg");

        if (svgElement) {
          svgElement.style.height = "100%";
          svgElement.style.width = "auto";

          if (!panzoomInstance) {
          panzoomInstance = Panzoom(element, {
            maxScale: 5,
            minScale: 0.5,
            contain: "outside",
          });

          element.addEventListener("wheel", (event) => {
            panzoomInstance?.zoomWithWheel(event);
            updateZoomLevel();
          });        
        }
          if (!isToggled) {
          if (panzoomInstance) {
            panzoomInstance.destroy();
          }
          panzoomInstance = Panzoom(element, {
            maxScale: 5,
            minScale: 0.5,
            contain: "outside",
          });

          element.addEventListener("wheel", (event) => {
            panzoomInstance?.zoomWithWheel(event);
            updateZoomLevel();
          });
        }

        if (isToggled) {
          panzoomInstance.zoom(currentScale, { animate: false });
          panzoomInstance.pan(currentPan.x, currentPan.y, { animate: false });
        }

          updateCursorStyle();
        }
        if(isErrorOccured){
          vscode.postMessage({
            type: "clearError", 
          });
          isErrorOccured = false
        }
      } catch (error) {
        errorMessage = `Syntax error in text: ${error.message || error}`;
        vscode.postMessage({
          type: "error",
          message: errorMessage,
        });
        isErrorOccured = true
      }
    }
  }

  function togglePan() {
    if (panzoomInstance) {
      panEnabled = !panEnabled;
      panzoomInstance.setOptions({ disablePan: !panEnabled });
      updateCursorStyle();
    }
  }

  function updateCursorStyle() {
    const element = document.getElementById("mermaid-diagram");
    if (element) {
      element.style.cursor = panEnabled ? `pointer` : 'default';
    }
  }
  function updateZoomLevel() {
    if (panzoomInstance) {
      zoomLevel = Math.round(panzoomInstance.getScale() * 100);
    }
  }

  function zoomIn() {
    panzoomInstance?.zoomIn();
    updateZoomLevel();
  }

  function zoomOut() {
    panzoomInstance?.zoomOut();
    updateZoomLevel();
  }

  function resetView() {
    panzoomInstance?.reset();
    updateZoomLevel();
  }

  window.addEventListener("message", async (event) => {
    const { type, content, currentTheme,isFileChange} = event.data;
    if (type === "update" && content) {
      diagramContent = content;
      theme = currentTheme;
      if (isFileChange) {
      panzoomInstance?.reset();
      updateZoomLevel()
    }
      await renderDiagram();
    }
  });

  onMount(async () => {
    const appElement = document.getElementById("app");
    const initialContent = appElement?.dataset.initialContent;
    const currentTheme = appElement?.dataset.currentTheme;
    console.log('initialContent', initialContent)
    if (initialContent) {
      diagramContent = decodeURIComponent(initialContent);
      theme = decodeURIComponent(currentTheme) as "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "mc" | "null";
      renderDiagram();
    } else {
      renderDiagram();
      updateZoomLevel();
    }
  });
</script>

<style>
  #mermaid-diagram {
    height: 100vh;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #app-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background: white;
    gap: 10px;
  }
</style>


<div id="app-container">
  <ErrorMessage {errorMessage} />
  <div id="mermaid-diagram"></div>
  {#if !errorMessage}
    <Sidebar {panEnabled} {iconBackgroundColor} {sidebarBackgroundColor} {shadowColor} {svgColor} {zoomLevel} {togglePan} {zoomOut} {resetView} {zoomIn} />
  {/if}
</div>

