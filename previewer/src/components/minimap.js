import React, { useLayoutEffect, useRef } from 'react';
import mermaid from 'mermaid';

const Minimap = ({ content }) => {
  const element = useRef(null);

  useLayoutEffect(() => {
    const el = element.current;

    console.log(window._config.vscode.minimap);

    if (!window._config.vscode.minimap) {
      el.textContent = '';

      return;
    }

    if (
      [('gantt', 'gitGraph', 'stateDiagram')].some(diagram =>
        content.startsWith(diagram)
      )
    ) {
      el.textContent = '';
    } else {
      try {
        mermaid.render(
          'minimap',
          content,
          (svg, bindFunctions) => {
            console.log(svg);
            el.innerHTML = svg;

            bindFunctions && bindFunctions(el);
          },
          el
        );
      } catch (e) {
        el.textContent = '';
      }
    }
  });

  return (
    <div
      ref={element}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100px',
        height: '75px',
        zIndex: 100,
        display: 'block',
        opacity: 0.9
      }}
    />
  );
};

export default Minimap;
