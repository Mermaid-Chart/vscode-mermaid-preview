type IconifyIcon = { body: string };
type IconifyJSON = { icons: Record<string, IconifyIcon> };

const googleCloudFunctionsIcon = 'google-cloud-functions';
const nextjsIcon = 'nextjs-icon';

/**
 * Some Iconify logos SVGs use <mask>/<use href="#id"> and fill="url(#id)".
 * Mermaid sanitizes icons with DOMPurify (strips href on <use>), and VS Code
 * webviews often fail url(#id) refs, so the icon paints blank.
 */
function flattenMaskedSvgBody(body: string): string {
  return body
    .replace(/<defs\b[^>]*>[\s\S]*?<\/defs>/g, '')
    .replace(/<mask\b[^>]*>[\s\S]*?<\/mask>/g, '')
    .replace(/\s*mask="url\([^"]+\)"/g, '')
    .replace(/<use\b[^>]*\/?>/g, '');
}

function flattenLogoBody(name: string, body: string): string | undefined {
  if (name === googleCloudFunctionsIcon && body.includes('<mask')) {
    // Geometry is already in the filled paths — drop the mask wrapper.
    return flattenMaskedSvgBody(body);
  }
  if (name === nextjsIcon && body.includes('<mask')) {
    // The N is only a white→transparent gradient. url(#id) cannot resolve in
    // the webview, so keep the circle (default black fill) and solid white paths.
    return flattenMaskedSvgBody(body).replace(/fill="url\([^"]+\)"/g, 'fill="#FFF"');
  }
  return undefined;
}

export function prepareLogosIcons<T extends IconifyJSON>(pack: T): T {
  const names = [googleCloudFunctionsIcon, nextjsIcon];
  let icons = pack.icons;
  let changed = false;
  for (const name of names) {
    const icon = icons[name];
    if (!icon) {
      continue;
    }
    const body = flattenLogoBody(name, icon.body);
    if (!body || body === icon.body) {
      continue;
    }
    if (!changed) {
      icons = { ...icons };
      changed = true;
    }
    icons[name] = { ...icon, body };
  }
  return changed ? { ...pack, icons } : pack;
}
