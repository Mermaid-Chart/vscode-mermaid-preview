import { parseDocument, type Document, YAMLMap, isMap, parse, stringify } from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

// const frontMatterRegex = /^-{3}\s*[\n\r](.*?[\n\r])-{3}\s*[\n\r]+/s;
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

export function splitFrontMatter(text: string) {
    // Normalize line endings and trim the text
    const normalizedText = text.replace(/\r\n?/g, '\n').trim();
    
    // More flexible regex that handles indentation before front matter
    const frontMatterRegex = /^\s*-{3}[\s\S]*?[\n\r]\s*-{3}/;
    
    const matches = normalizedText.match(frontMatterRegex);
    
    if (!matches) {
        return {
            diagramText: normalizedText,
            frontMatter: '',
        };
    }

    const frontMatter = matches[0]
        .replace(/^\s*---/, '') // Remove opening dashes with any preceding whitespace
        .replace(/\s*---$/, '') // Remove closing dashes with any trailing whitespace
        .trim();

    return {
        diagramText: normalizedText.slice(matches[0].length).trim(),
        frontMatter: frontMatter,
    };
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
export function extractIdFromCode(code: string): string | undefined {
    const { frontMatter } = splitFrontMatter(code);
    if (!frontMatter) return undefined; // No frontmatter present

    const document = parseFrontMatterYAML(frontMatter);
    const id = document.contents.get('id');

    return typeof id === 'string' ? id : undefined; // Ensure 'id' is a string
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

/**
 * Normalizes Mermaid diagram text by properly formatting the front matter and content.
 * @param code The original diagram code.
 * @returns The normalized diagram code.
 */
export function normalizeMermaidText(code: string): string {
  const { diagramText, frontMatter } = splitFrontMatter(code);
  
  if (!frontMatter) {
    return diagramText;
  }

  // Reconstruct the text with proper formatting
  return `---\n${frontMatter.trim()}\n---\n${diagramText}`;
}

/**
 * Adds metadata to the frontmatter of a Mermaid diagram
 * @param code The original diagram code
 * @param metadata The metadata to add (query, references, generationTime)
 * @returns The diagram code with updated frontmatter
 */
export function addMetadataToFrontmatter(
  code: string, 
  metadata: {
    query?: string;
    references?: string[];
    generationTime?: Date;
    model?: string;
  }
): string {
  const { diagramText, frontMatter } = splitFrontMatter(code);
  const document = parseFrontMatterYAML(frontMatter);
  
  // Add metadata fields if they exist
  if (metadata.query) {
    document.contents.set('query', metadata.query);
  }
  
  if (metadata.references && metadata.references.length > 0) {
    document.contents.set('references', metadata.references);
  }

  if (metadata.generationTime) {
    document.contents.set('generationTime', metadata.generationTime.toISOString());
  }

  if (metadata.model) {
    document.contents.set('model', metadata.model);
  }
  
  return `---\n${document.toString()}---\n${diagramText}`;
}

/**
 * Extracts metadata from the YAML frontmatter of a Mermaid diagram
 * @param code The diagram code with frontmatter
 * @returns Object containing metadata (references, query, model)
 */
export function extractMetadataFromCode(code: string): {
  references: string[];
  generationTime?: Date;
  query?: string;
  model?: string;
} {
  const { frontMatter } = splitFrontMatter(code);
  if (!frontMatter) {
    return { references: [] };
  }
  
  const document = parseFrontMatterYAML(frontMatter);
  const result: {
    references: string[];
    generationTime?: Date;
    query?: string;
    model?: string;
  } = {
    references: []
  };
  
  // Extract references
  if (document.contents && document.contents.items) {
    document.contents.items.forEach((item: any) => {
      if (item.key && item.key.value === 'references' && item.value && item.value.items) {
        result.references = item.value.items.map((ref: any) => 
          ref.value ? String(ref.value) : String(ref)
        );
      }  else if (item.key && item.key.value === 'generationTime' && item.value) {
        try {
          result.generationTime = new Date(String(item.value));
        } catch (error) {
          console.error('Error parsing generation time:', error);
        }
      } else if (item.key && item.key.value === 'query' && item.value) {
        result.query = String(item.value);
      } else if (item.key && item.key.value === 'model' && item.value) {
        result.model = String(item.value);
      }
    });
  }
  
  return result;
}

export function checkReferencedFiles(metadata: any, workspacePath: string = ''): string[] {
  const changedReferences: string[] = [];
  
  // If no references, return empty array
  if (!metadata.references || !Array.isArray(metadata.references) || metadata.references.length === 0) {
    return changedReferences;
  }
  
  // Get generation time from metadata
  let generationTime = 0;
  if (metadata.generationTime) {
    generationTime = new Date(metadata.generationTime).getTime();
    console.log('Generation time from metadata:', new Date(generationTime).toISOString());
  } else {
    console.log('No generation time available in metadata');
  }
  
  for (const reference of metadata.references) {
    // Extract file path from reference (assuming format "File: /path/to/file")
    const match = reference.match(/File: (.*?)(\s|$|\()/);
    if (!match) continue;
    
    let filePath = match[1].trim();
    console.log('Original filePath:', filePath);
    console.log('Is absolute path:', path.isAbsolute(filePath));
    console.log('Workspace path:', workspacePath);
    
    // If path is not absolute and we have a workspace path, resolve it
    if (!path.isAbsolute(filePath) && workspacePath) {
      console.log('Resolving relative path...');
      
      // Check if the relative path starts with the workspace folder name
      const workspaceFolderName = path.basename(workspacePath);
      if (filePath.startsWith(workspaceFolderName + '/')) {
        // Remove the duplicate workspace folder name from the path
        const relativePath = filePath.substring(workspaceFolderName.length + 1);
        filePath = path.join(workspacePath, relativePath);
      } else {
        filePath = path.join(workspacePath, filePath);
      }
      
      console.log('Resolved path:', filePath);
    }
    
    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    console.log('File exists:', fileExists);
    
    if (!fileExists) {
      changedReferences.push(`${path.basename(filePath)} (deleted)`);
      continue;
    }
    
    // Get last modification time of the reference file
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtimeMs;
    console.log(`File ${path.basename(filePath)} modified:`, new Date(lastModified).toISOString());
    
    // If reference file was modified after generation time
    if (generationTime > 0 && lastModified > generationTime) {
      console.log(`File ${path.basename(filePath)} is newer than generation time`);
      changedReferences.push(path.basename(filePath));
    }
  }
  
  return changedReferences;
}