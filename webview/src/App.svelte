<script lang="ts">
  import mermaid from '@mermaid-chart/mermaid';
  import Panzoom from '@panzoom/panzoom';
  import { onMount } from 'svelte';
  import panIcon from './assets/panicon.svg'
  import zoominIcon from './assets/zoomin.svg'
  import zoomoutIcon from './assets/zoomout.svg'



  let diagramContent: string = `graph TD;
  A-->B
  A-->C
  B-->D
  C-->D`;

  let panzoomInstance: ReturnType<typeof Panzoom> | null = null;

  async function renderDiagram() {
    const element = document.getElementById("mermaid-diagram");
    if (element && diagramContent) {
      try {
        // Initialize Mermaid
        mermaid.initialize({ startOnLoad: true });

        const { svg } = await mermaid.render("diagram-graph", diagramContent);
        element.innerHTML = svg;

        const svgElement = element.querySelector("svg");

        if (svgElement) {
          if (panzoomInstance) panzoomInstance.destroy(); 
          panzoomInstance = Panzoom(element, {
            maxScale: 5,
            minScale: 0.5,
            contain: "outside",
          });

          element.removeEventListener("wheel", panzoomInstance.zoomWithWheel);
        }
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
      }
    }
  }

  function enablePan() {
    if (panzoomInstance) panzoomInstance.setOptions({ disablePan: false });
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

  // Listen for messages from VSCode
  window.addEventListener("message", (event) => {
    const { type, content } = event.data;
    if (type === "update" && content) {
      diagramContent = content;
      renderDiagram(); // Re-render the diagram when content is updated
    }
  });

  onMount(() => {
    renderDiagram(); // Initial render on mount
  });
</script>

<style>
  .mermaid {
    width: 100%;
    height: 100%;
    background: white;
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
    gap: 10px;
    background: white;
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .icon {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }

  .icon:hover {
    background: #f0f0f0;
  }

  .icon img {
    width: 20px;
    height: 20px;
  }
</style>

<div id="mermaid-diagram" class="mermaid">
  {#if diagramContent}
    <!-- This will be replaced by the rendered Mermaid SVG -->
  {:else}
    <p>Enter diagram code to render.</p>
  {/if}
</div>

<div class="sidebar">  <button class="icon" on:click={enablePan} aria-label="Enable Pan">
    <img src={panIcon} alt="Pan Icon" />
  </button>
  <button class="icon" on:click={zoomIn} aria-label="Zoom In">
    <img src={zoominIcon} alt="Zoom In Icon" />
  </button>
  <button class="icon" on:click={zoomOut} aria-label="Zoom Out">
    <img src={zoomoutIcon} alt="Zoom Out Icon" />
  </button>
  <button class="icon" on:click={resetView} aria-label="Reset View">
    <img src="/reset-icon.svg" alt="Reset Icon" />
  </button>
</div>