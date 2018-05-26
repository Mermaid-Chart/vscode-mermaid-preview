'use strict';

module.exports = findDiagram;

const vscode = require('vscode');

// http://stackoverflow.com/a/6969486/1977815
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const findDiagramWithRegExp = (re, text, cursor) => {
  let regexp = new RegExp(re.source, re.flags);
  let index = regexp.last;
  let diagram;
  let array;

  while (!diagram && (array = regexp.exec(text)) !== null) {
    const start = text.indexOf(array[1], index);
    const end = start + array[1].length;

    if (start > 0 && start <= cursor && cursor <= end) {
      diagram = array[1];
    } else {
      index = regexp.lastIndex;
    }
  }

  return diagram;
}

function findDiagram(text, cursor) {
  const re = {
    html: /<div class="mermaid">([\s\S]*?)<\/div>/g,
    hugo: /\{\{<mermaid.*>\}\}([\s\S]*?)\{\{<\/mermaid>\}\}/g,
    markdown: /```mermaid([\s\S]*?)```/g,
    sphinx: /\.\. mermaid::(?:[ \t]*)?$(?:(?:\n[ \t]+:(?:(?:\\:\s)|[^:])+:[^\n]*$)+\n)?((?:\n(?:[ \t][^\n]*)?$)+)?/gm
  };

  return findDiagramWithRegExp(re.html, text, cursor)
  || findDiagramWithRegExp(re.markdown, text, cursor)
  || findDiagramWithRegExp(re.hugo, text, cursor)
  || findDiagramWithRegExp(re.sphinx, text, cursor);
}
