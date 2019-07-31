import React, { useState, useEffect } from 'react';

import Diagram from './diagram';
import Help from './help';

const App = () => {
  const [diagram, setDiagram] = useState(null);

  const handler = event => {
    setDiagram(event.data.diagram ? event.data.diagram.trim() : null);
  };

  useEffect(() => {
    window.addEventListener('message', handler);

    return () => {
      return window.removeEventListener('message', handler);
    };
  });

  if (diagram) {
    return <Diagram content={diagram} />;
  } else {
    return <Help />;
  }
};

export default App;
