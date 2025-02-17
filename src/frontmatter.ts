import { parseDocument, type Document, YAMLMap, isMap, parse, stringify } from 'yaml';
import { pattern } from './util';


const frontMatterRegex = /^-{3}\s*[\n\r](.*?[\n\r])-{3}\s*[\n\r]+/s;
const YAML_BLOCK_REGEX = /^\s*---[\r\n]+([\s\S]+?)[\r\n]+\s*---/gm;
const EMPTY_BLOCK_REGEX = /^\s*---\s*\n\s*---\s*\n?/;
const COMMENT_REGEX = /^\s*%%(?!{)[^\n]+\n?/gm;
const DIRECTIVE_REGEX = /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;
const FIRST_WORD_REGEX = /^\s*(\w+)/;

export const anyCommentRegex = /\s*%%.*\n/gm;

function parseFrontMatterYAML(frontMatterYaml: string): Document<YAMLMap, false> {
    const document: Document = parseDocument(frontMatterYaml);
    if (!isMap(document.contents)) {
      document.contents = new YAMLMap();
    }
    return document as unknown as Document<YAMLMap, false>;
}

function splitFrontMatter(text: string) {
    const matches = text.match(frontMatterRegex);
    if (!matches || !matches[1]) {
      return {
        diagramText: text,
        frontMatter: '',
      };
    } else {
      return {
        diagramText: text.slice(matches[0].length),
        frontMatter: matches[1],
      };
    }
}


/**
 * Ensures the diagram code has an ID field in the frontmatter.
 * @param code The original diagram code.
 * @param diagramId The ID to include in the frontmatter.
 * @returns The updated diagram code.
 */
export function ensureIdField(code: string, diagramId: string): string {
  const { diagramText, frontMatter } = splitFrontMatter(code);
  const document = parseFrontMatterYAML(frontMatter);

  document.contents.set('id', diagramId);

  return `---\n${document.toString()}---\n${diagramText}`;
}


/**
 * Extracts the 'id' field from the YAML frontmatter of the given code.
 * @param code The input code containing YAML frontmatter.
 * @returns The extracted ID, or null if not found.
 */
export function extractIdFromCode(code: string): string | null {
    const { frontMatter } = splitFrontMatter(code);
    if (!frontMatter) return null; // No frontmatter present

    const document = parseFrontMatterYAML(frontMatter);
    const id = document.contents.get('id');

    return typeof id === 'string' ? id : null; // Ensure 'id' is a string
}

/**
 * Normalizes a YAML block by removing empty frontmatter and reformatting valid YAML.
 * @param block - The YAML block to normalize.
 * @returns The normalized YAML block as a string.
 */
function normalizeYamlBlock(block: string): string {
  block = block.replace(EMPTY_BLOCK_REGEX, "");

  return block.replace(YAML_BLOCK_REGEX, (_, yamlContent) => {
    try {
      const parsedYaml = parse(yamlContent);
      return `---\n${stringify(parsedYaml)}\n---`;
    } catch (error) {
      return block;
    }
  });
}

/**
 * Adjusts indentation for Mermaid diagram blocks.
 * Determines the minimum indentation and normalizes all lines accordingly.
 * @param block - The Mermaid diagram block.
 * @returns The indentation-normalized block.
 */
function normalizeMermaidIndentation(block: string): string {
  const lines = block.split('\n');
  const minIndent = Math.min(
    ...lines.filter(line => line.trim() && !/^---/.test(line))
      .map(line => line.match(/^\s*/)?.[0]?.length || 0)
  );
  return lines.map(line => (line.startsWith('---') ? line : line.slice(minIndent))).join('\n');
}

/**
 * Extracts Mermaid diagram code blocks from the given content based on the file extension.
 * @param content - The full text content to scan for Mermaid code.
 * @param fileExt - The file extension used to determine the regex pattern.
 * @returns An array of extracted Mermaid code blocks.
 */
export function extractMermaidCode(content: string, fileExt: string): string[] {
  try {
    const mermaidRegex = pattern[fileExt];
    if (!mermaidRegex) {
      console.warn(`No regex pattern found for file extension: ${fileExt}`);
      return [];
    }

    const matches = [...content.matchAll(mermaidRegex)].map(match => {
      let block = match[1];
      return normalizeMermaidIndentation(normalizeYamlBlock(block));
    });

    if (matches.length === 0) {
      console.warn("No valid Mermaid code blocks found.");
    }

    return matches;
  } catch (error) {
    console.error("Error extracting Mermaid code:", error);
    return [];
  }
}

const cleanupText = (code: string) => {
  return (
    code
      // parser problems on CRLF ignore all CR and leave LF;;
      .replace(/\r\n?/g, '\n')
      // clean up html tags so that all attributes use single quotes, parser throws error on double quotes
      .replace(
        /<(\w+)([^>]*)>/g,
        (match, tag, attributes) => '<' + tag + attributes.replace(/="([^"]*)"/g, "='$1'") + '>'
      )
  );
};


/**
 * Removes Mermaid-specific directives enclosed in `%%{ ... }%%`.
 * 
 * @param text - The diagram text.
 * @returns The text with directives removed.
 */
export const removeDirectives = function (text: string): string {
  return text.replace(DIRECTIVE_REGEX, '');
};

/**
 * Remove all lines starting with `%%` from the text that don't contain a `%%{`
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string => {
  return text.replace(COMMENT_REGEX, '').trimStart();
};


/**
 * Extracts the first word from a Mermaid diagram after cleaning directives and comments.
 * 
 * @param text - The raw Mermaid diagram text.
 * @returns The first word in lowercase, or an empty string if not found.
 */
export function getFirstWordFromDiagram(text: string): string {
  const cleanedCode = cleanupText(text);
  const { diagramText } = splitFrontMatter(cleanedCode); // Extract diagram text

  const directiveResult = removeDirectives(diagramText);
  const code = cleanupComments(directiveResult);
  
  const match = code.match(FIRST_WORD_REGEX);
  if (match) {
    return match[1].toLowerCase(); // Return the first word in lowercase
  }
  return ''; // Return an empty string if no word is found
}
