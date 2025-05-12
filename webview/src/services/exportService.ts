import { toBase64 } from 'js-base64';
import { vscode } from '../utility/vscode';

// Font Awesome URL constant
export const FONT_AWESOME_URL = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0";

/**
 * Converts a Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
    reader.readAsDataURL(blob);
  });
}


/**
 * Creates a PNG image from the SVG diagram
 */
export async function exportPng(theme?: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const canvas = document.createElement('canvas');

    const element = document.getElementById("mermaid-diagram");
      if (!element) return;
      
      // const svg = element.querySelector("svg");
      // if (!svg) return;

    const svg = document.querySelector<HTMLElement>('#mermaid-diagram svg');
    if (!svg) {
      throw new Error('svg not found');
    }

    const box = svg.getBoundingClientRect();
    const multiplier = 2;
    canvas.width = box.width * multiplier;
    canvas.height = box.height * multiplier;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Set background color based on theme
    context.fillStyle = theme?.includes("dark") ? "#171719" : "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create image from SVG
    const image = new Image();
    
    // Handle image load completion
    image.onload = () => {
      // Draw the image with proper scaling
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Get PNG base64 data and send to extension
      const pngBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      vscode.postMessage({
        type: "exportPng",
        pngBase64: pngBase64
      });
      
      // Clean up
      canvas.width = 0;
      canvas.height = 0;
    };
    
    // Handle potential loading errors
    image.onerror = (err) => {
      console.error("Error loading SVG image:", err);
      vscode.postMessage({
        type: "error",
        message: "Error loading diagram for export. Please try again."
      });
    };
    
    // Load the image from SVG
    image.src = `data:image/svg+xml;base64,${await getBase64SVG(svg, canvas.width, canvas.height)}`;
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
export async function exportSvg() {
  try {
    const svg = getSvgElement() as HTMLElement;
    if (!svg) {
      throw new Error('SVG element not found');
    }

    const svgBase64 = await getBase64SVG(svg);
    
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
export const getBase64SVG = async (svg?: HTMLElement, width?: number, height?: number): Promise<string> => {
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

  try {
    // Fetch all necessary Font Awesome resources
    const [
      fontAwesomeCSS, 
      solidFontBlob,
      brandsFontBlob,
      regularFontBlob
    ] = await Promise.all([
      fetch(`${FONT_AWESOME_URL}/css/all.min.css`).then((response) => response.text()),
      fetch(`${FONT_AWESOME_URL}/webfonts/fa-solid-900.woff2`).then((res) => res.blob()).catch(() => new Blob()),
      fetch(`${FONT_AWESOME_URL}/webfonts/fa-brands-400.woff2`).then((res) => res.blob()).catch(() => new Blob()),
      fetch(`${FONT_AWESOME_URL}/webfonts/fa-regular-400.woff2`).then((res) => res.blob()).catch(() => new Blob())
    ]);

    // Convert font blobs to base64
    const [solidFontBase64, brandsFontBase64, regularFontBase64] = await Promise.all([
      blobToBase64(solidFontBlob).then(data => data.split(',')[1]),
      blobToBase64(brandsFontBlob).then(data => data.split(',')[1]),
      blobToBase64(regularFontBlob).then(data => data.split(',')[1])
    ]);

    // Enhanced font-face definitions with improved icon spacing
    const fontFaceCSS = `
      @font-face {
        font-family: 'Font Awesome 6 Free';
        font-style: normal;
        font-weight: 900;
        src: url(data:font/woff2;base64,${solidFontBase64}) format('woff2');
      }
      
      @font-face {
        font-family: 'Font Awesome 6 Free';
        font-style: normal;
        font-weight: 400;
        src: url(data:font/woff2;base64,${regularFontBase64}) format('woff2');
      }
      
      @font-face {
        font-family: 'Font Awesome 6 Brands';
        font-style: normal;
        font-weight: 400;
        src: url(data:font/woff2;base64,${brandsFontBase64}) format('woff2');
      }
      
      .fa, .fas {
        font-family: 'Font Awesome 6 Free' !important;
        font-weight: 900;
      }
      
      .far {
        font-family: 'Font Awesome 6 Free' !important;
        font-weight: 400;
      }
      
      .fab {
        font-family: 'Font Awesome 6 Brands' !important;
        font-weight: 400;
      }
      
      /* Improve icon spacing in nodes */
      .fa, .fas, .far, .fab {
        font-size: 16px;
        width: 16px;
        margin-right: 5px;
        display: inline-block;
        vertical-align: middle;
      }
      
      /* Ensure text nodes have proper spacing for icons */
      .nodeText {
        display: inline-block;
      }
      
      /* Fix for node width calculation */
      .node rect, .node circle, .node ellipse, .node polygon, .node path {
        min-width: fit-content;
      }
      
      /* Ensure text doesn't get cut off */
      .node foreignObject {
        overflow: visible;
        white-space: nowrap;
      }
    `;
    
    // Fix nodes that might have text truncation
    const nodes = svg.querySelectorAll('.node');
    nodes.forEach(node => {
      // For each node with an icon, ensure text has enough space
      const labelGroup = node.querySelector('.label');
      if (labelGroup) {
        const iconElement = labelGroup.querySelector('.fa, .fas, .far, .fab');
        if (iconElement) {
          // Find the text element and ensure it has enough space
          const foreignObject = labelGroup.querySelector('foreignObject');
          if (foreignObject) {
            // Make sure foreignObject is wide enough
            const currentWidth = parseInt(foreignObject.getAttribute('width') || '0', 10);
            if (currentWidth > 0) {
              foreignObject.setAttribute('width', `${currentWidth + 30}px`);
            }
            
            // Ensure text doesn't wrap
            const divs = foreignObject.querySelectorAll('div');
            divs.forEach(div => {
              div.style.whiteSpace = 'nowrap';
              div.style.overflow = 'visible';
            });
          }
        }
      }
    });
    
    // Fix self-closing tags for XML compatibility
    const svgString = svg.outerHTML
      .replaceAll('<br>', '<br/>')
      .replaceAll(/<img([^>]*)>/g, (m, g: string) => `<img ${g} />`)
      .replace('<style>', `<style>${fontFaceCSS} ${fontAwesomeCSS}`);
    
    return toBase64(svgString);
  } catch (error) {
    console.error("Error generating SVG base64:", error);
    
    // Fallback to simple SVG if font loading fails
    const svgString = svg.outerHTML
      .replaceAll('<br>', '<br/>')
      .replaceAll(/<img([^>]*)>/g, (m, g: string) => `<img ${g} />`);
    
    return toBase64(svgString);
  }
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