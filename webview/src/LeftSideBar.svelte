<script>
  import ExportIcon from "./ExportIcon.svelte";
  import { onMount } from 'svelte';
  import { exportPng, exportSvg } from './services/exportService';

  export let iconBackgroundColor, shadowColor, sidebarBackgroundColor, svgColor, theme;

  let showExportOptions = false;
  let leftSidebarRef;

  function toggleExportOptions() {
    showExportOptions = !showExportOptions;
  }

  function handleExportPng() {
    exportPng(theme);
    showExportOptions = false;
  }

  function handleExportSvg() {
    exportSvg();
    showExportOptions = false;
  }

  // Close dropdown when clicking outside
  onMount(() => {
    const handleClickOutside = (event) => {
      if (leftSidebarRef && !leftSidebarRef.contains(event.target) && showExportOptions) {
        showExportOptions = false;
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<style>
  .left-sidebar {
    position: absolute;
    top: 5px;
    left: 22px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 100;
    border-radius: 4px;
    border:1px solid #ddd
  }
  
  .export-container {
    position: relative;
  }
  
  .icon {
    cursor: pointer;
    border: none;
    background-color: var(--icon-bg);
    padding: 14px;
    border-radius: 6px;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon:hover {
    box-shadow: 0px 0px 4px var(--shadow-color);
    background-color: var(--shadow-color);
  }
  
  .export-options {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    background-color: var(--sidebar-bg);
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 5px;
    min-width: 134px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .export-option {
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s;
    color: var(--svg-color);
    text-align: left;
    font-family: "Recursive", serif;
    border: none;
    background: none;
  }
  
  .export-option:hover {
    background-color: var(--shadow-color);
  }
  
  .export-label {
    position: absolute;
    top: -25px;
    left: 0;
    font-size: 12px;
    color: var(--svg-color);
    white-space: nowrap;
  }

  .divider {
    height: 1px;
    background-color: rgba(128, 128, 128, 0.3);
    margin: 2px 0;
  }
</style>

<div 
  class="left-sidebar"
  bind:this={leftSidebarRef}
  style="--sidebar-bg: {sidebarBackgroundColor}; --shadow-color: {shadowColor}; --svg-color: {svgColor}"
>
  <div class="export-container">
    <span class="export-label">export</span>
    <button 
      class="icon" 
      style="--icon-bg: {iconBackgroundColor};" 
      on:click={toggleExportOptions} 
      aria-label="Export" 
      title="Export"
    >
      <ExportIcon fill={svgColor} />
    </button>
    
    {#if showExportOptions}
      <div class="export-options">
        <button class="export-option" on:click={handleExportPng}>
          Image as PNG
        </button>
        <div class="divider"></div>
        <button class="export-option" on:click={handleExportSvg}>
          Image as SVG
        </button>
      </div>
    {/if}
  </div>
</div> 