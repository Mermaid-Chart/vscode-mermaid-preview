import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { configSection } from '../util';
import { prepareMermaidPreviewHtml } from './shared-md-mermaid';

const defaultMermaidTheme = 'default';
const validMermaidThemes = [
    'neo',
    'redux',
    'mc',
    'null',
    'default',
    'base',
    'forest',
    'dark',
    'neutral',
    'neo-dark',             
    'redux-dark',
    'redux-color', 
    'redux-dark-color'
];

function sanitizeMermaidTheme(theme: string | undefined) {
    return typeof theme === 'string' && validMermaidThemes.includes(theme) ? theme : defaultMermaidTheme;
}

export function injectMermaidTheme(md: MarkdownIt) {
    const render = md.renderer.render;

    md.renderer.render = function (...args) {
        const config = vscode.workspace.getConfiguration(configSection);
        const darkModeTheme = sanitizeMermaidTheme(config.get<string>('vscode.dark_theme'));
        const lightModeTheme = sanitizeMermaidTheme(config.get<string>('vscode.light_theme'));
        const maxTextSize = config.get<number>('maxTextSize');

        const html = `<span id="markdown-mermaid" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"
                    data-max-text-size="${maxTextSize}"></span>
                ${render.apply(md.renderer, args)}`;
        return prepareMermaidPreviewHtml(html);
    };

    return md;
}