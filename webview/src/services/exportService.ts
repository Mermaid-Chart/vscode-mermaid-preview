import { toBase64 } from 'js-base64';
import { vscode } from '../utility/vscode';

// Font Awesome URL constant
export const FONT_AWESOME_URL = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css";

/**
 * Creates a PNG image from the SVG diagram
 */
export async function exportPng(diagramContent: string, theme?: string) {
  try {
    const element = document.getElementById("mermaid-diagram");
    const svgElement = element?.querySelector("svg");
    
    if (!svgElement) {
      throw new Error('SVG element not found');
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Get the computed style and actual dimensions
    const computedStyle = window.getComputedStyle(svgElement);
    const bbox = svgElement.getBBox();
    
    // Add necessary attributes for proper rendering
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Set explicit width and height based on the viewBox
    const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, bbox.width, bbox.height];
    clonedSvg.setAttribute('width', `${viewBox[2]}`);
    clonedSvg.setAttribute('height', `${viewBox[3]}`);
    
    // Ensure styles are inlined
    const styles = document.querySelector('style');
    if (styles) {
      clonedSvg.insertAdjacentHTML('afterbegin', styles.outerHTML);
    }

    // Add Font Awesome stylesheet reference
    const faStylesheet = document.createElement('style');
    faStylesheet.textContent = `
      @font-face {
        font-family: 'Font Awesome 6 Free';
        font-style: normal;
        font-weight: 400;
        src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/webfonts/fa-regular-400.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Font Awesome 6 Free';
        font-style: normal;
        font-weight: 900;
        src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/webfonts/fa-solid-900.woff2') format('woff2');
      }
    `;
    clonedSvg.insertAdjacentHTML('afterbegin', faStylesheet.outerHTML);

    // Send both diagram content and SVG string to the extension
    vscode.postMessage({
      type: "exportPng",
      content: diagramContent,
      svg: clonedSvg.outerHTML,
      theme: theme
    });

  } catch (error) {
    console.error("Error preparing PNG export:", error);
    vscode.postMessage({
      type: "error",
      message: `Error exporting PNG: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

/**
 * Creates an SVG image from the diagram
 */
export function exportSvg() {
  try {
    const svg = getSvgElement() as HTMLElement;
    if (!svg) {
      throw new Error('SVG element not found');
    }
    
    const svgString = svg.outerHTML
      .replaceAll('<br>', '<br/>')
      .replaceAll(/<img([^>]*)>/g, (m, g: string) => `<img ${g} />`);
    
    const svgData = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="${FONT_AWESOME_URL}" type="text/css"?>
${svgString}`;
    
    const svgBase64 = toBase64(svgData);
    
    vscode.postMessage({
      type: "exportSvg",
      svgBase64: svgBase64
    });
  } catch (error) {
    console.error("Error exporting SVG:", error);
    vscode.postMessage({
      type: "error",
      message: `Error exporting SVG: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

/**
 * Converts SVG element to base64 string
 */
export const getBase64SVG = (svg?: HTMLElement, width?: number, height?: number): string => {
  if (svg) {
    // Create a clone to prevent modifying the original SVG
    svg = svg.cloneNode(true) as HTMLElement;
  }
  
  // Set dimensions if provided
  height && svg?.setAttribute('height', `${height}px`);
  width && svg?.setAttribute('width', `${width}px`);
  
  if (!svg) {
    svg = getSvgElement() as HTMLElement;
  }
  
  if (!svg) {
    throw new Error('SVG element not found');
  }
  
  // Fix self-closing tags for XML compatibility
  const svgString = svg.outerHTML
    .replaceAll('<br>', '<br/>')
    .replaceAll(/<img([^>]*)>/g, (m, g: string) => `<img ${g} />`);
  
  // Add Font Awesome stylesheet reference
  return toBase64(`<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="${FONT_AWESOME_URL}" type="text/css"?>
${svgString}`);
};

/**
 * Gets the SVG element from the document
 */
export const getSvgElement = (): HTMLElement | null => {
  const svgElement = document.querySelector('#mermaid-diagram svg')?.cloneNode(true) as HTMLElement;
  if (svgElement) {
    svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }
  return svgElement;
};