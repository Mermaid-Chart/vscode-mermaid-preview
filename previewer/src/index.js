import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app';

import mermaid from 'mermaid';

import test from './test';

if (process.env.NODE_ENV === 'development') {
  test();
}

const initializeMermaid = () => {
  const config = window._config || {
    vscode: {
      dark: 'dark',
      light: 'forest'
    }
  };

  config.startOnLoad = false;

  if (!['default', 'forest', 'dark', 'neutral', null].includes(config.theme)) {
    const theme = document.body.classList.contains('vscode-dark')
      ? config.vscode.dark
      : config.vscode.light;

    config.theme = theme;

    if (theme === 'dark') {
      config.themeCSS = '.loopText tspan { fill: inherit; }';
    } else {
      config.themeCSS = '';
    }
  }

  console.log('Mermaid config', config);

  mermaid.initialize(config);
};

initializeMermaid();

ReactDOM.render(<App />, document.getElementById('root'));
