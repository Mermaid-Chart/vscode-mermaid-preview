import mermaid from 'mermaid';

const initializeMermaid = () => {
  const config = window._config || {
    vscode: {
      minimap: true,
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

export default initializeMermaid;
