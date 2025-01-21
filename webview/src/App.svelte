<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import panIcon from './assets/pan.svg';
  import zoominIcon from './assets/zoom-in.svg';
  import zoomoutIcon from './assets/zoom-out.svg';
  import layouts from '@mermaid-chart/layout-elk';

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
  let isMermaidInitialized = false;
  let isToggled = true;

  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
  let panEnabled = false;

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
        suppressErrorRendering: true
      });
      isMermaidInitialized = true;
    } catch (error) {
      console.error('Error initializing Mermaid:', error);
    }
  }
  async function renderDiagram() {
    if (!isMermaidInitialized) {
      console.log('Mermaid is not initialized yet. Waiting...');
      await initializeMermaid();
    }

    const element = document.getElementById("mermaid-diagram");
    if (element && diagramContent) {
      try {
        errorMessage = "";
        const currentScale = panzoomInstance?.getScale() || 1;
        const currentPan = panzoomInstance?.getPan() || { x: 0, y: 0 };
        const { svg } = await mermaid.render("diagram-graph", diagramContent);
        element.innerHTML = svg;

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

          element.addEventListener("wheel", panzoomInstance.zoomWithWheel);
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

          element.addEventListener("wheel", panzoomInstance.zoomWithWheel);
        }

        if (isToggled) {
          panzoomInstance.zoom(currentScale, { animate: false });
          panzoomInstance.pan(currentPan.x, currentPan.y, { animate: false });
        }

          updateCursorStyle();
        }
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
        errorMessage = `Syntax error in text: ${error.message || error}`;
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

  function zoomIn() {
    panzoomInstance?.zoomIn();
  }

  function zoomOut() {
    panzoomInstance?.zoomOut();
  }

  function resetView() {
    panzoomInstance?.reset();
  }

  window.addEventListener("message", async (event) => {
    const { type, content } = event.data;
    if (type === "update" && content) {
      diagramContent = content;

      if (!isMermaidInitialized) {
        await initializeMermaid();
        renderDiagram();
      } else {
        renderDiagram();
      }
    }
  });

  onMount(async () => {
    await initializeMermaid();
    renderDiagram();
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
    right: 25px;
    display: flex;
    gap: 5px;
    background: white;
    border: 1px solid #ddd;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .icon {
    cursor: pointer;
    border: none;
    background-color: white;
    padding: 3px;
    border-radius: 6px;
    transition: background 0.2s;
  }

  .icon:hover {
    background-color: #A3BDFF;
  }

  .icon img {
    width: 20px;
    height: 20px;
  }

  .icon.active {
    background-color: #A3BDFF;
  }

  .icon span {
    width: 20px;
    height: 20px;
    color: #2329D6;
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

</style>


<div id="app-container">
  <div id="error-message" class:errorVisible={!!errorMessage}>
    {#if errorMessage}
      <p>{errorMessage}</p>
    {/if}
  </div>

  <div id="mermaid-diagram"></div>

  {#if !errorMessage}
  <div class="sidebar">
    <button 
      class="icon {panEnabled ? 'active' : ''}" 
      on:click={togglePan} 
      aria-label="Enable Pan"
    >
      <img src={panIcon} alt="Pan Icon" />
    </button>
    <button class="icon" on:click={zoomOut} aria-label="Zoom Out">
      <img src={zoomoutIcon} alt="Zoom Out Icon" />
    </button>
    <button class="icon" on:click={resetView} aria-label="Reset View">
      <span>Reset</span>
    </button>
    <button class="icon" on:click={zoomIn} aria-label="Zoom In">
      <img src={zoominIcon} alt="Zoom In Icon" />
    </button>
    <label class="switch">
      <input type="checkbox" bind:checked={isToggled} on:click={handleToggleClick}  />
      <span class="slider"></span>
    </label>
  </div>
  {/if}
</div>

