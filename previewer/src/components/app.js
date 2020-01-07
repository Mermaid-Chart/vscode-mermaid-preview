import React, { useState, useEffect } from 'react';

import { ConfigProvider } from './configuration';

import Diagram from './diagram';
import Help from './help';

const App = () => {
  const [diagram, setDiagram] = useState(null);

  useEffect(() => {
    const handler = event => {
      if (event.data.source && event.data.source.startsWith('react-devtools'))
        return;

      switch (event.data.command) {
        case 'render':
          console.log('handle command', event.data.command);
          setDiagram(event.data.diagram ? event.data.diagram.trim() : null);
          break;
        default:
          return;
      }
    };

    window.addEventListener('message', handler);

    return () => {
      return window.removeEventListener('message', handler);
    };
  }, []);

  return (
    <ConfigProvider>
      {diagram ? (
        <Diagram content={diagram} />
      ) : (
        <Help
          content={`
\`\`\`mermaid
diagram is rendered when the
cursor is inside the fence
\`\`\`
`}
        />
      )}
    </ConfigProvider>
  );
};

export default App;
