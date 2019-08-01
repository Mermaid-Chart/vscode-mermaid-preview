import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app';

import mermaid from 'mermaid';

import test from './test';

if (process.env.NODE_ENV === 'development') {
  test();
}

const initializeMermaid = () => {
  const config = window._config || {};

  config.startOnLoad = false;

  if (config.theme !== null) {
    const theme = document.body.classList.contains('vscode-dark')
      ? 'dark'
      : 'forest';

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
