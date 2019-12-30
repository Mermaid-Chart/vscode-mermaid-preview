import React, { useState, useEffect } from 'react';

import Diagram from './diagram';
import Help from './help';

import initializeMermaid from './mermaid';

import test from './test';

const App = () => {
  const [diagram, setDiagram] = useState(null);

  useEffect(() => {
    const handler = event => {
      if (event.data.source && event.data.source.startsWith('react-devtools'))
        return;

      console.log('received message diagram:', event.data.diagram);

      switch (event.data.command) {
        case 'render':
          setDiagram(event.data.diagram ? event.data.diagram.trim() : null);
          break;
        default:
      }
    };

    initializeMermaid();

    window.addEventListener('message', handler);

    if (process.env.NODE_ENV === 'development') {
      test();
    }

    return () => {
      return window.removeEventListener('message', handler);
    };
  }, []);

  if (diagram) {
    return <Diagram content={diagram} />;
  } else {
    return (
      <Help
        content={`
\`\`\`mermaid
diagram is rendered when the
cursor is inside the fence
\`\`\`
`}
      />
    );
  }
};

export default App;
