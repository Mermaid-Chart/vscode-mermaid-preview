const path = require('path');
const assert = require('assert');
const vscode =  require('vscode');

const findDiagram = require('../find-diagram');
const usesFontawesome = require('../lib/uses-fontawesome');

suite('Utilities Tests', () => {
  const startFenced = '```mermaid';
  const startDived = '<div class="mermaid">';

  const getAbsoluteFilePath = filename => path.join(__dirname, 'fixtures', filename);

  const openTextDocument = filename => vscode.workspace.openTextDocument(vscode.Uri.file(getAbsoluteFilePath(filename)));

  suite('findDiagram', () => {
    test('Detects fenced diagram if cursor inside fence', () =>
      openTextDocument('sequence.md').then(document => {
        assert.ok(findDiagram(document.getText(), startFenced.length));
      })
    );

    test('Does not detect fenced diagram if cursor outside fence', () =>
      openTextDocument('sequence.md').then(document => {
        assert.equal(findDiagram(document.getText(), 0), undefined);
      })
    );

    test('Detects <div> diagram if cursor inside tag', () =>
      openTextDocument('sequence.html').then(document => {
        assert.ok(findDiagram(document.getText(), startDived.length));
      })
    );

    test('Does not detect <div> diagram if cursor outside tag', () => 
      openTextDocument('sequence.html').then(document => {
        assert.equal(findDiagram(document.getText(), 0), undefined);
      })
    );
  });

  suite('usesFontawesome', () => {
    test('Detects if diagram uses Fontawesome', () =>
      openTextDocument('font-awesome.md').then(document => {
        const diagram = findDiagram(document.getText(), startFenced.length);
        assert.equal(usesFontawesome(diagram), true);
      })
    );

    test('Does not detect if diagram does not uses Fontawesome', () =>
      openTextDocument('sequence.md').then(document => {
        const diagram = findDiagram(document.getText(), startFenced.length);
        assert.equal(usesFontawesome(diagram), false);
      })
    );
  });
});