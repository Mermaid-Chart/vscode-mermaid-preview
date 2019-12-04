import React, { useLayoutEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import Minimap from './minimap';
import Help from './help';
import * as d3 from 'd3';

const id = 'diagram';

const recenter = element => {
  const _element = d3.select(element);

  const { height, width } = _element.node().getClientRects()[0];

  element.firstChild.setAttribute('height', height);
  element.firstChild.setAttribute('width', width);
  element.firstChild.setAttribute('style', `max-width:${width}px;`);
};

const zoom = element => {
  const _element = d3.select(element);

  const { height, width } = _element.node().getClientRects()[0];

  const _svg = d3.select(element.firstChild);

  const zoomHandler = d3
    .zoom()
    .translateExtent([
      [-200, -200],
      [width + 200, height + 200]
    ])
    .on('zoom', () => {
      d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation();

      _svg.attr('transform', d3.event.transform);
    });

  _svg.call(zoomHandler).on('touchmove.zoom', null);
};

const Diagram = ({ content }) => {
  const element = useRef(null);
  const [success, setSuccess] = useState(false);

  useLayoutEffect(() => {
    const el = element.current;

    try {
      mermaid.render(
        'diagram',
        content,
        (svg, bindFunctions) => {
          el.innerHTML = svg;

          bindFunctions && bindFunctions(el);

          if (!content.startsWith('gitGraph:')) {
            recenter(el);
            zoom(el);
          }

          setSuccess(true);
        },
        el
      );
    } catch (e) {
      console.log(e);
      el.textContent = '';
      setSuccess(false);
    }
  }, [content]);

  return (
    <React.Fragment>
      <div ref={element} style={{ height: '100vh' }} />
      {success ? (
        <Minimap content={content} />
      ) : (
        <Help
          content={`
\`\`\`mermaid
diagram is not syntactically correct
\`\`\`
`}
        />
      )}
    </React.Fragment>
  );
};

export default Diagram;
