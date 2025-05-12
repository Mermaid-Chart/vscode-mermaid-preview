<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import layouts from '@mermaid-chart/layout-elk';
  import { vscode } from './utility/vscode'
  import ErrorMessage from './ErrorMessage.svelte';
  import Sidebar from './Sidebar.svelte';
  import { diagramContent as diagramData } from './diagramData';
  import LeftSideBar from './LeftSideBar.svelte';

  $: diagramContent = diagramData;
 
  let errorMessage = "";
  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
  let panEnabled = false;
  let hasErrorOccured= false;
  let theme: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | 'neo' | 'neo-dark' | 'redux' | 'redux-dark' | 'redux-color' | 'redux-dark-color' | 'mc' | 'null' = 'redux'; 
  $: zoomLevel = 100;
  let maxZoomLevel = 5;
  let maxTextSize = 90000;
  let maxEdges = 1000;
  $: sidebarBackgroundColor = theme?.includes("dark")? "#4d4d4d" : "white";
  $: iconBackgroundColor = theme?.includes("dark") ? "#4d4d4d" : "white";
  $: svgColor = theme?.includes("dark") ? "white" : "#2329D6";
  $: shadowColor = theme?.includes("dark")? "#6b6b6b" : "#A3BDFF";

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
          {
            name: 'logos',
            loader: () => import('@iconify-json/logos').then((module) => module.icons),
          },
          {
            name: 'mdi',
            loader: () => import('@iconify-json/mdi').then((module) => module.icons),
          },
        ]);
        await mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: theme,
          maxEdges: maxEdges,
          maxTextSize: maxTextSize,
        });
      } catch (error) {
        console.error('Error initializing Mermaid:', error);
      }
    }

  async function validateDiagramOnly(content: string) {
    try {
      await initializeMermaid();
      await mermaid.parse(content || 'info');
      vscode.postMessage({
        type: "validationResult",
        valid: true
      });
    } catch (error) {
      vscode.postMessage({
        type: "validationResult",
        valid: false,
        message: `Syntax error in text: ${error.message || error}`
      });
    }
  }

  async function renderDiagram() {
      await initializeMermaid();

    const element = document.getElementById("mermaid-diagram");
    if (element && diagramContent) {
      try {
        const parsed = await mermaid.parse(diagramContent || 'info')
        if (parsed?.config?.theme && 
            ['default', 'base', 'dark' , 'forest' , 'neutral' , 'neo' , 'neo-dark' , 'redux' , 'redux-dark' , 'redux-color' , 'redux-dark-color' , 'mc' , 'null'].includes(parsed.config.theme)) {
          theme = parsed.config.theme;
        }
        errorMessage = "";
        const currentScale = panzoomInstance?.getScale() || 1;
        const currentPan = panzoomInstance?.getPan() || { x: 0, y: 0 };
        const { svg } = await mermaid.render("diagram-graph", diagramContent);
        element.innerHTML = svg;
        if (theme?.includes("dark")) {
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
            maxScale: maxZoomLevel,
            minScale: 0.5,
            contain: "outside",
          });

          element.addEventListener("wheel", (event) => {
            panzoomInstance?.zoomWithWheel(event);
            updateZoomLevel();
          });
        }
        panzoomInstance.setOptions({ disablePan: !panEnabled });
        panzoomInstance.zoom(currentScale, { animate: false });
        panzoomInstance.pan(currentPan.x, currentPan.y, { animate: false });

          updateCursorStyle();
        }
        if(hasErrorOccured){
          vscode.postMessage({
            type: "clearError", 
          });
          hasErrorOccured = false
        }
      } catch (error) {
        errorMessage = `Syntax error in text: ${error.message || error}`;
        vscode.postMessage({
          type: "error",
          message: errorMessage,
        });
        hasErrorOccured = true
        element.innerHTML = "";
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
    const { type, content, currentTheme, isFileChange, validateOnly, maxZoom, maxCharLength, maxEdge } = event.data;
    if (type === "update") {
      if (validateOnly && content) {
        // Just validate without updating UI
        await validateDiagramOnly(content);
      } else if (content) {
        // Regular rendering flow
        diagramContent = content;
        theme = currentTheme;
        maxZoomLevel = maxZoom        
        maxEdges = maxEdge; 
        maxTextSize= maxCharLength;
        if (isFileChange) {
          panzoomInstance?.reset();
          updateZoomLevel();
        }
        await renderDiagram();
        if (panzoomInstance) {
          panzoomInstance.setOptions({ maxScale: maxZoomLevel });
        } 
      }
    }
  });

  onMount(async () => {
    const appElement = document.getElementById("app");
    const initialContent = appElement?.dataset.initialContent;
    const currentTheme = appElement?.dataset.currentTheme;
    if (initialContent) {
      diagramContent = decodeURIComponent(initialContent);
      theme = decodeURIComponent(currentTheme) as "default" | "base" | "dark" | "forest" | "neutral" | "null";
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
    flex-direction: column;
    width: 100%;
    height: 100vh;
    gap: 10px;
  }
  .sidebar-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>


<div id="app-container" style="background: {theme?.includes('dark') ? '#1e1e1e' : 'white'}">
  <ErrorMessage {errorMessage} />
  <div id="mermaid-diagram"></div>
  <div class="sidebar-container">
    {#if !errorMessage}
    <LeftSideBar {iconBackgroundColor} {sidebarBackgroundColor} {shadowColor} {svgColor} {theme}/>
    <Sidebar {panEnabled} {iconBackgroundColor} {sidebarBackgroundColor} {shadowColor} {svgColor} {zoomLevel} {togglePan} {zoomOut} {resetView} {zoomIn} />
  {/if}
  </div>

</div>
