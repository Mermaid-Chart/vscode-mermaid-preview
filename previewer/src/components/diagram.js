import React, { useLayoutEffect, useRef } from 'react';
import mermaid from 'mermaid';
import Minimap from './minimap';
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

  useLayoutEffect(() => {
    const el = element.current;

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
      },
      el
    );
  });

  return (
    <React.Fragment>
      <div ref={element} style={{ height: '100vh' }} />
      <Minimap content={content} />
    </React.Fragment>
  );
};

export default Diagram;
