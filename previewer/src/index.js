import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app';

import mermaid from 'mermaid';

import test from './test';

if (process.env.NODE_ENV === 'development') {
  test();
}

mermaid.initialize({
  theme: document.body.classList.contains('vscode-dark') ? 'dark' : 'forest',
  startOnLoad: false
});

ReactDOM.render(<App />, document.getElementById('root'));
