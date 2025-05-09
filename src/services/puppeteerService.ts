import * as puppeteer from 'puppeteer';
import * as vscode from 'vscode';
import analytics from '../analytics';

let browser: puppeteer.Browser | null = null;

export async function initializePuppeteer() {
    try {
        if (!browser) {            
            const chromePaths = [
                process.env.CHROME_PATH,                    // Environment variable
                '/usr/bin/google-chrome',                  // Linux
                '/usr/bin/chromium-browser',              // Linux Chromium
                '/usr/bin/chromium',                      // Linux Chromium alternative
                '/usr/bin/microsoft-edge',                // Linux Edge
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',  // macOS
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', // macOS Edge
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',    // Windows
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows x86
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', // Windows Edge
            ].filter(Boolean);

            // Try to launch with different configurations
            for (const executablePath of chromePaths) {
                try {
                    browser = await puppeteer.launch({
                        headless: true,
                        executablePath: executablePath,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ],
                        timeout: 30000
                    });
                    break;
                } catch (e) {
                    console.log(`Failed to launch with ${executablePath}:`, e);
                    continue;
                }
            }

            // If all paths failed, try launching without executablePath
            if (!browser) {
                try {
                    browser = await puppeteer.launch({
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ],
                        timeout: 30000
                    });
                } catch (error) {
                    console.error('Failed to launch browser without path:', error);
                }
            }

            // If browser is still null, show detailed error to user
            if (!browser) {
                const message = 'PNG export requires a Chromium-based browser (Chrome, Edge, or Chromium).';
                const detail = 'Please install one of the following:\n' +
                             '• Google Chrome (Recommended)\n' +
                             '• Microsoft Edge\n' +
                             '• Chromium';
                
                const selection = await vscode.window.showErrorMessage(
                    message,
                    { modal: true, detail },
                    'Install Chrome',
                    'Install Edge'
                );

                if (selection === 'Install Chrome') {
                    await vscode.env.openExternal(vscode.Uri.parse('https://www.google.com/chrome/'));
                } else if (selection === 'Install Edge') {
                    await vscode.env.openExternal(vscode.Uri.parse('https://www.microsoft.com/edge'));
                }

                throw new Error('No compatible browser found. Please install Chrome, Edge, or Chromium.');
            }
        }
        return browser;
    } catch (error) {
        console.error('Failed to initialize Puppeteer:', error);
        analytics.trackException(error);
        throw error;
    }
}

export async function closePuppeteer() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

export async function renderSvgToPNG(
    svgString: string,
    theme: string,
    maxZoom: number = 2
): Promise<Buffer> {
    try {
        const browser = await initializePuppeteer();
        const page = await browser.newPage();

        // Set a larger viewport
        await page.setViewport({ 
            width: 6000,  // Increased width
            height: 4000, // Increased height
            deviceScaleFactor: maxZoom
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
                />
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: ${theme?.includes("dark") ? "#171719" : "white"};
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .container {
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transform-origin: center center;
                        background: ${theme?.includes("dark") ? "#171719" : "white"};
                    }
                    #diagram svg {
                        display: block;
                        max-width: none !important;
                        width: auto !important;
                        height: auto !important;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div id="diagram">${svgString}</div>
                </div>
            </body>
            </html>
        `;

        await page.setContent(html);

        // Wait for fonts and content to load
        await Promise.all([
            page.waitForFunction(() => document.fonts.ready),
            page.waitForSelector('#diagram svg', { timeout: 10000 }), // Increased timeout
            page.waitForFunction(() => {
                const icons = document.querySelectorAll('.fa, .fas, .far');
                if (!icons.length) return true;
                return Array.from(icons).every(icon => {
                    const style = window.getComputedStyle(icon);
                    return style.fontFamily.includes('Font Awesome');
                });
            }, { timeout: 10000 }) // Increased timeout
        ]);

        // Get the SVG element
        const svgElement = await page.$('#diagram svg');
        if (!svgElement) {
            throw new Error('Could not find SVG element');
        }

        // Get the exact bounding box
        const boundingBox = await svgElement.boundingBox();
        if (!boundingBox) {
            throw new Error('Could not determine SVG dimensions');
        }

        // Calculate optimal padding based on diagram size
        const padding = Math.min(
            Math.max(20, Math.floor(boundingBox.width * 0.02)), // 2% of width, minimum 20px
            100 // maximum padding
        );

        // Ensure the diagram fits within the viewport
        const viewport = page.viewport();
        if (!viewport) {
            throw new Error('Could not get viewport dimensions');
        }
        const scale = Math.min(
            (viewport.width - padding * 2) / boundingBox.width,
            (viewport.height - padding * 2) / boundingBox.height,
            1 // Don't scale up, only down if needed
        );

        // Apply scaling if needed
        if (scale < 1) {
            await page.evaluate((s) => {
                const container = document.querySelector('.container') as HTMLElement;
                if (container) {
                    container.style.transform = `scale(${s})`;
                }
            }, scale);
        }

        // Recalculate boundingBox after scaling
        const newBoundingBox = await svgElement.boundingBox();
        if (!newBoundingBox) {
            throw new Error('Could not determine SVG dimensions after scaling');
        }

        const clip = {
            x: newBoundingBox.x - padding,
            y: newBoundingBox.y - padding,
            width: newBoundingBox.width + (padding * 2),
            height: newBoundingBox.height + (padding * 2)
        };

        // Take the screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            clip,
            omitBackground: false
        });

        await page.close();
        return Buffer.from(screenshot);
    } catch (error) {
        console.error('Error rendering SVG to PNG:', error);
        analytics.trackException(error);
        throw error;
    }
} 