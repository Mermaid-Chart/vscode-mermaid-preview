const fs = require('fs');
const assert = require('assert');
const _ = require('lodash');

const findDiagram = require('../find-diagram');
const usesFontawesome = require('../lib/uses-fontawesome');

suite('Utilities Tests', () => {
  const startFenced = '```mermaid';
  const startDived = '<div class="mermaid">';
  const getContent = filename => {
    return fs.readFileSync(__dirname + '/fixtures/' + filename).toString()
  }

  suite('findDiagram', () => {
    test('Detects fenced diagram if cursor inside fence', () => {
      const input = getContent('sequence.md');
      const diagram = findDiagram(input, startFenced.length);

      assert.equal(_.isNil(diagram), false);
    });

    test('Does not detect fenced diagram if cursor outside fence', () => {
      const input = getContent('sequence.md');
      const diagram = findDiagram(input, 0);

      assert.equal(_.isNil(diagram), true);
    });

    test('Detects <div> diagram if cursor inside tag', () => {
      const input = getContent('sequence.html');
      const diagram = findDiagram(input, startDived.length);

      assert.equal(_.isNil(diagram), false);
    });

    test('Does not detect <div> diagram if cursor outside tag', () => {
      const input = getContent('sequence.html');
      const diagram = findDiagram(input, 0);

      assert.equal(_.isNil(diagram), true);
    });
  });

  suite('usesFontawesome', () => {
    test('Detects if diagram uses Fontawesome', () => {
      const input = getContent('font-awesome.md');
      const diagram = findDiagram(input, startFenced.length);
      const usesFa = usesFontawesome(diagram);

      assert.equal(usesFa, true);
    });

    test('Does not detect if diagram does not uses Fontawesome', () => {
      const input = getContent('sequence.md');
      const diagram = findDiagram(input, startFenced.length);
      const usesFa = usesFontawesome(diagram);

      assert.equal(usesFa, false);
    });
  });
});