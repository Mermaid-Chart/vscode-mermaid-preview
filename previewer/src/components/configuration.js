import React, { createContext, useContext, useEffect, useState } from 'react';

import initializeMermaid from './mermaid';
import { useVscode } from './hooks/vscode';
import test from './test';

export const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const handler = event => {
      if (event.data.source && event.data.source.startsWith('react-devtools'))
        return;

      switch (event.data.command) {
        case 'configure':
          console.log('handle command', event.data.command);
          initializeMermaid(event.data.configuration);
          setConfig(event.data.configuration.vscode);
          break;
        default:
          return;
      }
    };

    window.addEventListener('message', handler);

    const vscode = useVscode();

    vscode.postMessage({
      command: 'ready'
    });

    if (process.env.NODE_ENV === 'development') {
      test();
    }

    return () => {
      return window.removeEventListener('message', handler);
    };
  }, []);

  return (
    <ConfigContext.Provider value={[config, setConfig]}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
