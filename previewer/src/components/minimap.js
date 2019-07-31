import React, { useLayoutEffect, useRef } from 'react';
import mermaid from 'mermaid';

const Minimap = ({ content }) => {
  const element = useRef(null);

  useLayoutEffect(() => {
    const el = element.current;

    if (content.startsWith('gantt') || content.startsWith('gitGraph:')) {
      el.textContent = '';
    } else {
      mermaid.render(
        'minimap',
        content,
        (svg, bindFunctions) => {
          el.innerHTML = svg;

          bindFunctions(el);
        },
        el
      );
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