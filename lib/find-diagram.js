'use strict';

module.exports = findDiagram;

// http://stackoverflow.com/a/6969486/1977815
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function findDivedDiagram(text, cursor) {
  const divStart = '<div class="mermaid">';
  const divEnd = '</div>';
  
  try {
    let divedDiagrams = text.match(/<div class="mermaid">[\s\S]*?<\/div>/g).filter(diagram => {
      const start = text.indexOf(diagram);
      const end = start + diagram.length;
      
      return start < cursor && cursor < end;
    });
    
    if (divedDiagrams.length === 1) {
      return divedDiagrams[0].slice(divStart.length, divedDiagrams[0].length - divEnd.length);
    }
  } catch (e) {
    return void 0;
  }
}

function findFencedDiagram(text, cursor) {
  const fenceStart = '```mermaid';
  const fenceEnd = '```';
  
  try {
    const divedDiagrams = text.match(/\`\`\`mermaid[\s\S]*?\`\`\`/g).filter(diagram => {
      const start = text.indexOf(diagram);
      const end = start + diagram.length;
      
      return start < cursor && cursor < end;
    });
    
    if (divedDiagrams.length === 1) {
      return divedDiagrams[0].slice(fenceStart.length, divedDiagrams[0].length - fenceEnd.length);
    }
  } catch (e) {
    return void 0;
  }
}

function findDiagram(text, cursor) {
  return findDivedDiagram(text, cursor) || findFencedDiagram(text, cursor);
}
