document.body.onload = () => {
  const mermaidStyle = document.body.classList.contains("vscode-dark")
    ? "dark"
    : "forest";
  
  const config = {
    startOnLoad: true,
    theme: mermaidStyle
  };

  mermaid.initialize(config);
};
