/**
 * splitSql — split raw PostgreSQL SQL text into individual statements.
 *
 * Splits on semicolons that appear OUTSIDE of:
 *   - dollar-quoted strings  ($$ … $$  or  $tag$ … $tag$)
 *   - single-quoted literals (with '' escape handling)
 *   - line comments          (-- … \n)
 *   - block comments         (slash-star … star-slash)
 *
 * Returns an array of trimmed non-empty statements.
 */
export function splitSql(content) {
  const len = content.length;
  const statements = [];
  let current = "";
  let i = 0;

  // Stack of active dollar-quote tags (strings like "$$" or "$my_tag$").
  // In practice SQL only nests one level, but a stack is correct.
  const dollarStack = [];

  while (i < len) {
    // ── Inside a dollar-quoted string ──────────────────────────────
    if (dollarStack.length > 0) {
      const tag = dollarStack[dollarStack.length - 1];
      if (content.startsWith(tag, i)) {
        current += tag;
        i += tag.length;
        dollarStack.pop();
      } else {
        current += content[i];
        i++;
      }
      continue;
    }

    // ── Line comment: -- ──────────────────────────────────────────
    if (content[i] === "-" && i + 1 < len && content[i + 1] === "-") {
      // consume until end-of-line (inclusive)
      while (i < len && content[i] !== "\n") {
        current += content[i];
        i++;
      }
      if (i < len) {
        current += content[i]; // the newline
        i++;
      }
      continue;
    }

    // ── Block comment: /* ... */ ──────────────────────────────────
    if (content[i] === "/" && i + 1 < len && content[i + 1] === "*") {
      current += "/*";
      i += 2;
      let depth = 1;
      while (i < len && depth > 0) {
        if (content[i] === "/" && i + 1 < len && content[i + 1] === "*") {
          current += "/*";
          i += 2;
          depth++;
        } else if (content[i] === "*" && i + 1 < len && content[i + 1] === "/") {
          current += "*/";
          i += 2;
          depth--;
        } else {
          current += content[i];
          i++;
        }
      }
      continue;
    }

    // ── Single-quoted string literal ─────────────────────────────
    if (content[i] === "'") {
      current += "'";
      i++;
      while (i < len) {
        if (content[i] === "'" && i + 1 < len && content[i + 1] === "'") {
          // escaped quote ''
          current += "''";
          i += 2;
        } else if (content[i] === "'") {
          current += "'";
          i++;
          break;
        } else {
          current += content[i];
          i++;
        }
      }
      continue;
    }

    // ── Dollar-quote opening ─────────────────────────────────────
    if (content[i] === "$") {
      // Try to match a dollar-quote tag: $ (optional identifier chars) $
      const match = content.slice(i).match(/^(\$[A-Za-z0-9_]*\$)/);
      if (match) {
        const tag = match[1];
        dollarStack.push(tag);
        current += tag;
        i += tag.length;
        continue;
      }
      // Not a dollar-quote tag – treat $ as normal character
      current += content[i];
      i++;
      continue;
    }

    // ── Statement separator ──────────────────────────────────────
    if (content[i] === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0 && !isCommentOnly(trimmed)) {
        statements.push(trimmed);
      }
      current = "";
      i++;
      continue;
    }

    // ── Normal character ─────────────────────────────────────────
    current += content[i];
    i++;
  }

  // Any remaining text after the last semicolon (or if there was none)
  const trimmed = current.trim();
  if (trimmed.length > 0 && !isCommentOnly(trimmed)) {
    statements.push(trimmed);
  }

  return statements;
}

/**
 * True when a trimmed statement contains only SQL comments (line and/or
 * block), i.e. no executable SQL. Such statements are skipped by splitSql.
 */
function isCommentOnly(text) {
  if (text.length === 0) return true;
  let rest = text;
  let protectedOnly = true;
  // Repeatedly strip leading comments
  while (rest.length > 0) {
    if (rest.startsWith("--")) {
      const nl = rest.indexOf("\n");
      rest = nl === -1 ? "" : rest.slice(nl + 1);
    } else if (rest.startsWith("/*")) {
      const end = rest.indexOf("*/");
      rest = end === -1 ? "" : rest.slice(end + 2);
    } else {
      protectedOnly = false;
      break;
    }
  }
  return protectedOnly;
}
