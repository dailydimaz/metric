/**
 * CSS Sanitizer - Prevents CSS injection attacks
 * 
 * Removes potentially dangerous CSS constructs:
 * - @import rules (can load external resources)
 * - url() with external domains (data exfiltration)
 * - expression() (IE-specific, can execute JS)
 * - behavior/binding properties (can execute code)
 * - JavaScript URLs
 */

const DANGEROUS_PATTERNS = [
  // @import rules
  /@import\s+(?:url\s*\()?[^;]+;?/gi,
  // url() with external http/https (allow data: and relative URLs)
  /url\s*\(\s*['"]?\s*https?:\/\/[^)]*\)/gi,
  // expression() - IE specific, can execute JS
  /expression\s*\([^)]*\)/gi,
  // behavior property (IE specific)
  /behavior\s*:\s*url\s*\([^)]*\)/gi,
  // -moz-binding (Firefox specific)
  /-moz-binding\s*:\s*url\s*\([^)]*\)/gi,
  // javascript: URLs
  /url\s*\(\s*['"]?\s*javascript:[^)]*\)/gi,
  // vbscript: URLs
  /url\s*\(\s*['"]?\s*vbscript:[^)]*\)/gi,
  // data: with script content (allow data: images)
  /url\s*\(\s*['"]?\s*data:\s*(?!image\/)[^)]*\)/gi,
];

const DANGEROUS_PROPERTIES = [
  'behavior',
  '-moz-binding',
  '-webkit-binding',
  'binding',
];

/**
 * Sanitizes CSS by removing dangerous patterns and properties
 * @param css - Raw CSS string from user input
 * @returns Sanitized CSS string safe for injection
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  let sanitized = css;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* removed */');
  }

  // Remove dangerous properties
  for (const prop of DANGEROUS_PROPERTIES) {
    const propPattern = new RegExp(`${prop}\\s*:[^;]*;?`, 'gi');
    sanitized = sanitized.replace(propPattern, '/* removed */');
  }

  // Remove any remaining @charset, @namespace that could cause issues
  sanitized = sanitized.replace(/@charset\s+[^;]+;?/gi, '/* removed */');

  return sanitized.trim();
}

/**
 * Validates if a CSS string appears to be valid CSS
 * Basic syntax check - not a full parser
 */
export function isValidCSS(css: string): boolean {
  if (!css || typeof css !== 'string') {
    return false;
  }

  // Check for balanced braces
  let braceCount = 0;
  for (const char of css) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) return false;
  }

  return braceCount === 0;
}
