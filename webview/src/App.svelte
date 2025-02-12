<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import panIcon from './assets/pan.svg';
  import zoominIcon from './assets/zoom-in.svg';
  import zoomoutIcon from './assets/zoom-out.svg';
  import layouts from '@mermaid-chart/layout-elk';
  import { vscode } from './utility/vscode'

  let diagramContent: string = `flowchart TD
      %% Nodes
          A("fab:fa-youtube Starter Guide")
          B("fab:fa-youtube Make Flowchart")
          n1@{ icon: "fa:gem", pos: "b", h: 24}
          C("fa:fa-book-open Learn More")
          D{"Use the editor"}
          n2(Many shapes)@{ shape: delay}
          E(fa:fa-shapes Visual Editor)
          F("fa:fa-chevron-up Add node in toolbar")
          G("fa:fa-comment-dots AI chat")
          H("fa:fa-arrow-left Open AI in side menu")
          I("fa:fa-code Text")
          J(fa:fa-arrow-left Type Mermaid syntax)

      %% Edge connections between nodes
          A --> B --> C --> n1 & D & n2
          D -- Build and Design --> E --> F
          D -- Use AI --> G --> H
          D -- Mermaid js --> I --> J

      %% Individual node styling. Try the visual editor toolbar for easier styling!
          style E color:#FFFFFF, fill:#AA00FF, stroke:#AA00FF
          style G color:#FFFFFF, stroke:#00C853, fill:#00C853
          style I color:#FFFFFF, stroke:#2962FF, fill:#2962FF

      %% You can add notes with two "%" signs in a row!`;
 
  let errorMessage = "";
  let isToggled = true;
  $: zoomLevel = 100;
  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
  let panEnabled = false;
  let isErrorOccured= false;
  let theme: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "mc" | "null" = "neo"; 
  $: sidebarBackgroundColor = theme === "dark" || theme === "neo-dark" ? "#4d4d4d" : "white";
  $: iconBackgroundColor = theme === "dark" || theme === "neo-dark" ? "#4d4d4d" : "white";
  $: svgColor = theme === "neo-dark" || theme === "dark" ? "white" : "#2329D6";
  $: shadowColor =
    theme === "dark" || theme === "neo-dark" ? "#6b6b6b" : "#A3BDFF";


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

  function handleToggleClick() {
      if (isToggled) {
        panzoomInstance?.reset();
      }
  isToggled = !isToggled; 
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
  

  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #a3bdff;
  }

  input:checked + .slider:before {
    transform: translateX(26px);
  }
  .sidebar {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background-color: var(--sidebar-bg);
    border: 1px solid #ddd;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease-in-out;
  }

  .icon {
    cursor: pointer;
    border: none;
    background-color: var(--icon-bg);
    padding: 3px;
    border-radius: 6px;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .icon:hover {
    box-shadow: 0px 0px 4px var(--shadow-color);
    background-color: var(--shadow-color);
  }
svg {
    width: 25px;
    height: 25px;
    transition: stroke 0.3s, fill 0.3s; 
  }
  .icon.active {
  background-color: var(--shadow-color);
  box-shadow: 0px 0px 4px var(--shadow-color);
}

  .icon span {
    width: 20px;
    height: 20px;
    color: var(--icon-bg);
    font-size: 15px;
    font-weight: 700;
  }

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

#error-message {
  background-color: #ffdddd;
  color: #d8000c;
  padding: 10px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #d8000c;
  display: none;
}

#error-message.errorVisible {
  display: block;
}
.zoom-level {
  font-size: 14px;
  font-weight: bold;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
  background-color: var(--icon-bg);
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.zoom-level span{
  color: var(--icon-bg);
}
.zoom-level:hover {
    box-shadow: 0px 0px 4px var(--shadow-color);
    background-color: var(--shadow-color); 
  }

</style>


<div id="app-container">
  <div id="error-message" class:errorVisible={!!errorMessage}>
    {#if errorMessage}
      <p>{errorMessage}</p>
    {/if}
  </div>

  <div id="mermaid-diagram"></div>

  {#if !errorMessage}
  <div 
      class="sidebar"
      style="--sidebar-bg: {sidebarBackgroundColor};--shadow-color: {shadowColor} "
    >
      <button 
        class="icon {panEnabled ? 'active' : ''}" 
        style="--icon-bg: {iconBackgroundColor};"
        on:click={togglePan} 
        aria-label="Enable Pan"
        title="Enable Pan"
      >
      <svg
      aria-labelledby="panIconTitle"
      fill="none"
      height="48px"
      stroke="{svgColor}"
      stroke-linecap="square"
      stroke-linejoin="miter"
      stroke-width="1"
      viewBox="0 0 24 24"
      width="48px"
      xmlns="http://www.w3.org/2000/svg"
    >
     
      <path
        d="M20,14 L20,17 C20,19.209139 18.209139,21 16,21 L10.0216594,21 C8.75045497,21 7.55493392,20.3957659 6.80103128,19.3722467 L3.34541668,14.6808081 C2.81508416,13.9608139 2.94777982,12.950548 3.64605479,12.391928 C4.35756041,11.8227235 5.38335813,11.8798792 6.02722571,12.5246028 L8,14.5 L8,13 L8.00393081,13 L8,11 L8.0174523,6.5 C8.0174523,5.67157288 8.68902517,5 9.5174523,5 C10.3458794,5 11.0174523,5.67157288 11.0174523,6.5 L11.0174523,11 L11.0174523,4.5 C11.0174523,3.67157288 11.6890252,3 12.5174523,3 C13.3458794,3 14.0174523,3.67157288 14.0174523,4.5 L14.0174523,11 L14.0174523,5.5 C14.0174523,4.67157288 14.6890252,4 15.5174523,4 C16.3458794,4 17.0174523,4.67157288 17.0174523,5.5 L17.0174523,11 L17.0174523,7.5 C17.0174523,6.67157288 17.6890252,6 18.5174523,6 C19.3458794,6 20.0174523,6.67157288 20.0174523,7.5 L20.0058962,14 L20,14 Z"
      />
    </svg>
      </button>
      <button 
        class="icon" 
        style="--icon-bg: {iconBackgroundColor};"
        on:click={zoomOut} 
        aria-label="Zoom Out"
        title="Zoom Out"
      >
      <svg
    enable-background="new 0 0 50 50"
    height="50px"
    version="1.1"
    viewBox="0 0 50 50"
    width="50px"
    xml:space="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    stroke="{svgColor}"
  >
    <circle
      cx="21"
      cy="20"
      fill="none"
      r="16"
      stroke-linecap="round"
      stroke-miterlimit="10"
      stroke-width="2"
    />
    <line
      fill="none"
      stroke-linecap="round"
      stroke-width="4"
      x1="32.229"
      x2="45.5"
      y1="32.229"
      y2="45.5"
    />
    <line
      fill="none"
      stroke-linecap="round"
      stroke-width="2"
      x1="13"
      x2="29"
      y1="20"
      y2="20"
    />
  </svg>    
  </button>
      <button 
        class="icon" 
        style="--icon-bg: {iconBackgroundColor}; "
        on:click={resetView} 
        aria-label="Reset View"
        title="Reset View"
      >
        <span style="--icon-bg: {svgColor};">Reset</span>
      </button>
      <button 
        class="icon" 
        style="--icon-bg: {iconBackgroundColor}; "
        on:click={zoomIn}
        aria-label="Zoom In"
        title="Zoom In"
      >
      <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="{svgColor}"
    >
      <g data-name="Layer 11" id="Layer_11">
        <path d="M13,27A12,12,0,1,1,25,15,12,12,0,0,1,13,27ZM13,5A10,10,0,1,0,23,15,10,10,0,0,0,13,5Z" />
        <path d="M30,29a1,1,0,0,1-.6-.2l-8-6a1,1,0,0,1,1.2-1.6l8,6a1,1,0,0,1,.2,1.4A1,1,0,0,1,30,29Z" />
        <rect height="2" width="8" x="9" y="14" />
        <rect height="8" width="2" x="12" y="11" />
      </g>
    </svg>
    </button>
    <div class="zoom-level" style="--icon-bg: {iconBackgroundColor} " >
      <span style="--icon-bg: {svgColor};" title="Zoom Level">Zoom: {zoomLevel}%</span>
    </div>
    <!-- <label class="switch">
      <input type="checkbox" bind:checked={isToggled} on:click={handleToggleClick}  />
      <span class="slider"></span>
    </label> -->
</div>
  {/if}
</div>

