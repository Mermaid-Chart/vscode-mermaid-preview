const configuration = {
  vscode: {
    export: {
      theme: 'default'
    },
    dark: 'dark',
    light: 'default',
    minimap: true
  }
};

const content11 = `
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?
`;
const content12 = `
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!

    Bob-->Alice: Checking with John....
    Alice->John: Yes... John, how are you?
`;
const content13 = `
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!

    Bob-->Alice: Checking with John.....
    Alice->John: Yes... John, how are you?
`;

const content = `
graph TD
    B["fa:fa-twitter for peace"]
    B-->C[fa:fa-ban forbidden]
    B-->D(fa:fa-spinner);
    B-->E(A fa:fa-hand-paper perhaps?);
`;

const stateDiagram = `stateDiagram
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`;

const test = () => {
  setTimeout(() => {
    window.postMessage({
      command: 'configure',
      configuration
    });
  }, 500);

  setTimeout(() => {
    window.postMessage({
      command: 'export',
      diagram: content11
    });
  }, 1000);

  return;
  setTimeout(() => {
    window.postMessage({
      command: 'render',
      diagram: content12
    });
  }, 2000);

  return;
};

export default test;
