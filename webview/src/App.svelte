<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import panIcon from './assets/pan.svg';
  import zoominIcon from './assets/zoom-in.svg';
  import zoomoutIcon from './assets/zoom-out.svg';

  let diagramContent: string = `flowchart TD
  A-->B
  A-->C
  B-->D
  C-->D`;
  let errorMessage = "";
  let isMermaidInitialized = false;

  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
  let panEnabled = false;

  async function initializeMermaid() {
    try {
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
        const { svg } = await mermaid.render("diagram-graph", diagramContent);
        element.innerHTML = svg;

        const svgElement = element.querySelector("svg");

        if (svgElement) {
          svgElement.style.height = "100%";
          svgElement.style.width = "auto";

          if (panzoomInstance) panzoomInstance.destroy();
          panzoomInstance = Panzoom(element, {
            maxScale: 5,
            minScale: 0.5,
            contain: "outside",
          });

          element.addEventListener("wheel", panzoomInstance.zoomWithWheel);

          updateCursorStyle();
        }
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
        errorMessage = `Syntax error in text: ${error.message || error}`;
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
  </div>
  {/if}
</div>

