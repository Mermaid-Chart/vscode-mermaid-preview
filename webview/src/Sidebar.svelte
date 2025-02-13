<script>
  import PanIcon from "./PanIcon.svelte";
  import ZoomInIcon from "./ZoomInIcon.svelte";
  import ZoomOutIcon from "./ZoomOutIcon.svelte";

    export let panEnabled, iconBackgroundColor, shadowColor, sidebarBackgroundColor, svgColor, zoomLevel;
    export let togglePan, zoomOut, resetView, zoomIn;
  </script>

  <style>
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
  </style>
  
  <div 
      class="sidebar"
      style="--sidebar-bg: {sidebarBackgroundColor};--shadow-color: {shadowColor}"
    >
    <button class="icon {panEnabled ? 'active' : ''}" 
      style="--icon-bg: {iconBackgroundColor};"
      on:click={togglePan} 
      aria-label="Enable Pan"
      title="Enable Pan">
      <PanIcon stroke={svgColor} />
    </button>
    
    <button class="icon" style="--icon-bg: {iconBackgroundColor};" on:click={zoomOut} aria-label="Zoom Out" title="Zoom Out">
      <ZoomOutIcon stroke={svgColor} />
    </button>
    
    <button class="icon" style="--icon-bg: {iconBackgroundColor};" on:click={resetView} aria-label="Reset View" title="Reset View">
      <span style="--icon-bg: {svgColor};">Reset</span>
    </button>
    
    <button class="icon" style="--icon-bg: {iconBackgroundColor};" on:click={zoomIn} aria-label="Zoom In" title="Zoom In">
      <ZoomInIcon fill={svgColor} />
    </button>
    
    <div class="zoom-level" style="--icon-bg: {iconBackgroundColor};">
      <span style="--icon-bg: {svgColor};" title="Zoom Level">Zoom: {zoomLevel}%</span>
    </div>
  </div>