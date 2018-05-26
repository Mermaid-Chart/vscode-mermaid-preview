const path = require('path');
const assert = require('assert');
const vscode =  require('vscode');
const mermaid = require('mermaid');

const findDiagram = require('../lib/find-diagram');
const usesFontawesome = require('../lib/uses-fontawesome');

suite('Utilities Tests', () => {
  const startFenced = '```mermaid';
  const startDived = '<div class="mermaid">';
  const startHugo = '{{<mermaid align="left">}}';

  const getAbsoluteFilePath = filename => path.join(__dirname, 'fixtures', filename);

  const openTextDocument = filename => vscode.workspace.openTextDocument(vscode.Uri.file(getAbsoluteFilePath(filename)));

  suite('findDiagram', () => {
    suite('markdown fenced code', () => {
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
    });

    suite('html', () => {
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

    suite('hugo shortcodes', () => {
      test('Detects hugo diagram if cursor inside tag', () =>
        openTextDocument('hugo.html').then(document => {
          assert.ok(findDiagram(document.getText(), startHugo.length));
        })
      );
  
      test('Does not detect hugo diagram if cursor outside tag', () => 
        openTextDocument('hugo.html').then(document => {
          assert.equal(findDiagram(document.getText(), 0), undefined);
        })
      );
    });

    suite('sphinx directive', () => {
      test('Detects diagram', () =>
        openTextDocument('example.sphinx').then(document => {
          assert.doesNotThrow(() =>
            mermaid.parse(findDiagram(document.getText(), 25))
        )})
      );

      test('Detects diagram with parameters', () =>
        openTextDocument('example.sphinx').then(document => {
          assert.doesNotThrow(() =>
            mermaid.parse(findDiagram(document.getText(), 625))
        )})
      );

      test('Does not detect diagram defined in externl file', () =>
        openTextDocument('example.sphinx').then(document => {
          assert.equal(findDiagram(document.getText(), 1113), undefined);
        })
      );
    });
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