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

const test = () => {
  setTimeout(() => {
    window.postMessage({
      diagram: `
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!

    Bob-->Alice: Checking with John.....
    Alice->John: Yes... John, how are you?
      `
    });
  }, 1000);

  return;
  setTimeout(() => {
    window.postMessage({
      diagram: content11
    });
  }, 1000);

  setTimeout(() => {
    window.postMessage({
      diagram: content12
    });
  }, 1250);

  setTimeout(() => {
    window.postMessage({
      diagram: content13
    });
  }, 1500);

  setTimeout(() => {
    window.postMessage({
      diagram: content
    });
  }, 3000);
};

export default test;
