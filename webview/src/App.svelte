<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import panIcon from './assets/pan.svg';
  import zoominIcon from './assets/zoom-in.svg';
  import zoomoutIcon from './assets/zoom-out.svg';

  let diagramContent: string = '';
  let errorMessage = "";

  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
  let panEnabled = false;

  async function renderDiagram() {
    const element = document.getElementById("mermaid-diagram");
    if (element && diagramContent) {
      try {
        errorMessage = "";
        await mermaid.initialize({ startOnLoad: true });

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
      element.style.cursor = panEnabled
        ? `pointer`
        : 'default';
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

  window.addEventListener("message", (event) => {
    const { type, content } = event.data;
    if (type === "update" && content) {
      diagramContent = content;
      renderDiagram();
    }
  });

  onMount(() => {
    renderDiagram();
  });
</script>

<style>
  .mermaid {
    width: 100%;
    height: 100%;
    background: white;
    cursor: pointer;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

  html,
  body {
    height: 100%;
    margin: 0;
  }

  #mermaid-diagram {
    width: 100%;
    height: 100vh;
    background: white;
    cursor: pointer;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: auto;
  }

  #error-message {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: #ffdddd;
      color: #d8000c;
      padding: 10px;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      display: none;
      z-index: 1000;
    }

  #error-message.errorVisible {
    display: block;
  }

  #mermaid-diagram svg {
    height: 100%;
    width: auto;
    display: block;
  }

</style>

<div id="error-message" class:errorVisible={!!errorMessage}>
  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
</div>

<div id="mermaid-diagram" class="mermaid">
  {#if diagramContent}
    <!-- Rendered Mermaid diagram will appear here -->
  {:else}
    <p>Enter diagram code to render.</p>
  {/if}
</div>

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