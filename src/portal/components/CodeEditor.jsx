import { useEffect, useMemo, useRef } from 'react';

const INDENT_BY_LANGUAGE = {
  javascript: 2,
  typescript: 2,
  python: 4,
  java: 4,
  cpp: 4,
  c: 4,
  csharp: 4,
  go: 4,
  rust: 4,
  kotlin: 4,
  ruby: 2,
  swift: 4,
  php: 4,
};

const OPENING_PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
};

const CLOSING_PAIRS = new Set(Object.values(OPENING_PAIRS));
const HISTORY_LIMIT = 100;

const KEYWORDS = {
  javascript: [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default',
    'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import',
    'in', 'instanceof', 'let', 'new', 'return', 'switch', 'throw', 'try', 'typeof',
    'var', 'void', 'while', 'yield',
  ],
  typescript: [
    'abstract', 'any', 'as', 'async', 'await', 'boolean', 'break', 'case', 'catch',
    'class', 'const', 'continue', 'declare', 'default', 'do', 'else', 'enum', 'export',
    'extends', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import',
    'in', 'interface', 'let', 'new', 'number', 'private', 'protected', 'public',
    'readonly', 'return', 'string', 'switch', 'throw', 'try', 'type', 'typeof',
    'var', 'void', 'while',
  ],
  python: [
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
    'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  ],
  java: [
    'abstract', 'boolean', 'break', 'case', 'catch', 'char', 'class', 'continue',
    'default', 'do', 'double', 'else', 'extends', 'final', 'finally', 'float', 'for',
    'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'new',
    'package', 'private', 'protected', 'public', 'return', 'static', 'switch', 'this',
    'throw', 'throws', 'try', 'void', 'while',
  ],
  cpp: [
    'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const', 'continue',
    'default', 'delete', 'do', 'double', 'else', 'false', 'float', 'for', 'if',
    'include', 'int', 'long', 'namespace', 'new', 'private', 'protected', 'public',
    'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'template',
    'this', 'throw', 'true', 'try', 'typedef', 'using', 'void', 'while',
  ],
  c: [
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'include', 'int', 'long',
    'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
    'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
  ],
  csharp: [
    'abstract', 'as', 'base', 'bool', 'break', 'case', 'catch', 'char', 'class',
    'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
    'enum', 'event', 'false', 'finally', 'float', 'for', 'foreach', 'if', 'in',
    'int', 'interface', 'internal', 'is', 'long', 'namespace', 'new', 'null',
    'object', 'out', 'override', 'private', 'protected', 'public', 'readonly',
    'return', 'sealed', 'static', 'string', 'struct', 'switch', 'this', 'throw',
    'true', 'try', 'using', 'var', 'virtual', 'void', 'while',
  ],
  go: [
    'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
    'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map',
    'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var',
  ],
  rust: [
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'else', 'enum',
    'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match',
    'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
    'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
  ],
  kotlin: [
    'as', 'break', 'class', 'continue', 'data', 'do', 'else', 'false', 'for',
    'fun', 'if', 'import', 'in', 'interface', 'is', 'null', 'object', 'package',
    'return', 'sealed', 'super', 'this', 'throw', 'true', 'try', 'typealias',
    'val', 'var', 'when', 'while',
  ],
  ruby: [
    'BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class', 'def',
    'defined', 'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if',
    'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry',
    'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until',
    'when', 'while', 'yield',
  ],
  swift: [
    'Any', 'as', 'associatedtype', 'break', 'case', 'catch', 'class', 'continue',
    'default', 'defer', 'do', 'else', 'enum', 'extension', 'false', 'for', 'func',
    'guard', 'if', 'import', 'in', 'init', 'let', 'nil', 'private', 'protocol',
    'public', 'return', 'self', 'static', 'struct', 'switch', 'throw', 'throws',
    'true', 'try', 'typealias', 'var', 'while',
  ],
  php: [
    'abstract', 'and', 'array', 'as', 'break', 'case', 'catch', 'class', 'clone',
    'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else',
    'elseif', 'empty', 'endfor', 'endforeach', 'endif', 'endswitch', 'extends',
    'final', 'finally', 'for', 'foreach', 'function', 'global', 'if', 'implements',
    'include', 'instanceof', 'interface', 'namespace', 'new', 'or', 'private',
    'protected', 'public', 'return', 'static', 'switch', 'throw', 'trait', 'try',
    'use', 'var', 'while', 'xor',
  ],
};

const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'None', 'True', 'False', 'nullptr', 'nil']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenPattern(language) {
  const keywords = KEYWORDS[language] || KEYWORDS.javascript;
  const keywordPattern = keywords.map(escapeRegExp).join('|');
  const hashCommentLanguages = new Set(['python', 'ruby']);
  const commentPattern = hashCommentLanguages.has(language) ? '#.*' : '//.*|/\\*[\\s\\S]*?\\*/';
  return new RegExp(
    `(${commentPattern})|("""[\\s\\S]*?"""|'''[\\s\\S]*?'''|\`(?:\\\\.|[^\`\\\\])*\`|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|(\\b\\d+(?:\\.\\d+)?\\b)|(\\b(?:${keywordPattern})\\b)|(\\b[A-Za-z_][A-Za-z0-9_]*\\b)|([{}()[\\];,.<>:+\\-*/%=!&|^~?]+)`,
    'g',
  );
}

function tokenClass(token, match, language) {
  if (match[1]) return 'text-zinc-500';
  if (match[2]) return 'text-amber-300';
  if (match[3]) return 'text-sky-300';
  if (match[4]) return 'text-violet-300';
  if (LITERALS.has(token)) return 'text-rose-300';
  if (match[5]) {
    const nextNonSpace = tokenPattern(language).lastIndex;
    return nextNonSpace ? 'text-zinc-100' : 'text-zinc-100';
  }
  if (match[6]) return 'text-emerald-300';
  return 'text-zinc-100';
}

function highlightCode(code, language) {
  const source = String(code || '');
  const pattern = tokenPattern(language);
  const nodes = [];
  let lastIndex = 0;
  let tokenIndex = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const token = match[0];
    nodes.push(
      <span key={`${tokenIndex}-${match.index}`} className={tokenClass(token, match, language)}>
        {token}
      </span>,
    );
    tokenIndex += 1;
    lastIndex = match.index + token.length;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes.length ? nodes : '\u00a0';
}

function getIndent(language) {
  return ' '.repeat(INDENT_BY_LANGUAGE[language] || 2);
}

function getLineStart(value, position) {
  return value.lastIndexOf('\n', position - 1) + 1;
}

function getLineEnd(value, position) {
  const index = value.indexOf('\n', position);
  return index === -1 ? value.length : index;
}

function currentLine(value, position) {
  return value.slice(getLineStart(value, position), getLineEnd(value, position));
}

function leadingWhitespace(line) {
  return line.match(/^\s*/)?.[0] || '';
}

function replaceRange(value, start, end, replacement) {
  return value.slice(0, start) + replacement + value.slice(end);
}

function setSelectionSoon(ref, start, end = start) {
  requestAnimationFrame(() => {
    ref.current?.setSelectionRange(start, end);
  });
}

function clampHistory(items) {
  return items.length > HISTORY_LIMIT ? items.slice(items.length - HISTORY_LIMIT) : items;
}

function updateSelectedLines(value, selectionStart, selectionEnd, updateLine) {
  const blockStart = getLineStart(value, selectionStart);
  const blockEnd = selectionEnd > selectionStart && value[selectionEnd - 1] === '\n'
    ? selectionEnd - 1
    : getLineEnd(value, selectionEnd);
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  let startDelta = 0;
  let endDelta = 0;

  const updated = lines.map((line, index) => {
    const result = updateLine(line);
    const delta = result.length - line.length;
    if (index === 0 && selectionStart > blockStart) startDelta += delta;
    endDelta += delta;
    return result;
  }).join('\n');

  return {
    value: replaceRange(value, blockStart, blockEnd, updated),
    selectionStart: Math.max(blockStart, selectionStart + startDelta),
    selectionEnd: Math.max(blockStart, selectionEnd + endDelta),
  };
}

export default function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  minHeight = 560,
  disabled = false,
  className = '',
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const highlightRef = useRef(null);
  const pendingValueRef = useRef(null);
  const historyRef = useRef({
    past: [],
    future: [],
    current: {
      value: value || '',
      selectionStart: 0,
      selectionEnd: 0,
    },
  });
  const indent = getIndent(language);
  const lineNumbers = useMemo(() => {
    const count = Math.max(1, String(value || '').split('\n').length);
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [value]);

  useEffect(() => {
    const nextValue = value || '';
    if (pendingValueRef.current === nextValue) {
      pendingValueRef.current = null;
      return;
    }

    historyRef.current = {
      past: [],
      future: [],
      current: {
        value: nextValue,
        selectionStart: 0,
        selectionEnd: 0,
      },
    };
  }, [value]);

  function currentSnapshot() {
    const textarea = textareaRef.current;
    return {
      value: value || '',
      selectionStart: textarea?.selectionStart ?? historyRef.current.current.selectionStart,
      selectionEnd: textarea?.selectionEnd ?? historyRef.current.current.selectionEnd,
    };
  }

  function commit(nextValue, selectionStart, selectionEnd = selectionStart, options = {}) {
    const { record = true } = options;
    const snapshot = currentSnapshot();

    if (record && snapshot.value !== nextValue) {
      historyRef.current.past = clampHistory([...historyRef.current.past, snapshot]);
      historyRef.current.future = [];
    }

    historyRef.current.current = {
      value: nextValue,
      selectionStart,
      selectionEnd,
    };
    pendingValueRef.current = nextValue;
    onChange(nextValue);
    setSelectionSoon(textareaRef, selectionStart, selectionEnd);
  }

  function restoreHistory(entry) {
    historyRef.current.current = entry;
    pendingValueRef.current = entry.value;
    onChange(entry.value);
    setSelectionSoon(textareaRef, entry.selectionStart, entry.selectionEnd);
  }

  function undo() {
    const previous = historyRef.current.past.pop();
    if (!previous) return;

    historyRef.current.future = [
      currentSnapshot(),
      ...historyRef.current.future,
    ].slice(0, HISTORY_LIMIT);
    restoreHistory(previous);
  }

  function redo() {
    const next = historyRef.current.future.shift();
    if (!next) return;

    historyRef.current.past = clampHistory([
      ...historyRef.current.past,
      currentSnapshot(),
    ]);
    restoreHistory(next);
  }

  function handleChange(event) {
    commit(
      event.target.value,
      event.target.selectionStart,
      event.target.selectionEnd,
    );
  }

  function handleScroll(event) {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
    if (highlightRef.current) {
      highlightRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    }
  }

  function handleKeyDown(event) {
    if (disabled || event.defaultPrevented) return;

    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const text = value || '';
    historyRef.current.current = {
      value: text,
      selectionStart: start,
      selectionEnd: end,
    };

    const key = event.key.toLowerCase();
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }

    if (modifier && key === 'y') {
      event.preventDefault();
      redo();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      if (start !== end && text.slice(start, end).includes('\n')) {
        const next = updateSelectedLines(text, start, end, (line) => {
          if (event.shiftKey) {
            if (line.startsWith(indent)) return line.slice(indent.length);
            return line.replace(/^ {1,4}/, '');
          }
          return indent + line;
        });
        commit(next.value, next.selectionStart, next.selectionEnd);
        return;
      }

      if (event.shiftKey) {
        const lineStart = getLineStart(text, start);
        const beforeCursor = text.slice(lineStart, start);
        const removable = beforeCursor.match(/ {1,4}$/)?.[0] || '';
        if (removable) {
          const nextStart = start - removable.length;
          commit(replaceRange(text, nextStart, start, ''), nextStart, end - removable.length);
        }
        return;
      }

      commit(replaceRange(text, start, end, indent), start + indent.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const line = currentLine(text, start);
      const baseIndent = leadingWhitespace(line);
      const beforeCursor = text.slice(getLineStart(text, start), start).trimEnd();
      const nextChar = text[end] || '';
      const shouldIndent =
        /[{[(]$/.test(beforeCursor) ||
        (language === 'python' && /:\s*(#.*)?$/.test(beforeCursor));
      const extraIndent = shouldIndent ? indent : '';

      if (shouldIndent && ['}', ']', ')'].includes(nextChar)) {
        const middleIndent = baseIndent + extraIndent;
        const replacement = `\n${middleIndent}\n${baseIndent}`;
        commit(replaceRange(text, start, end, replacement), start + 1 + middleIndent.length);
        return;
      }

      const replacement = `\n${baseIndent}${extraIndent}`;
      commit(replaceRange(text, start, end, replacement), start + replacement.length);
      return;
    }

    if (event.key === 'Backspace' && start === end && start > 0) {
      const previous = text[start - 1];
      const next = text[start];
      if (OPENING_PAIRS[previous] === next) {
        event.preventDefault();
        commit(replaceRange(text, start - 1, start + 1, ''), start - 1);
      }
      return;
    }

    if (OPENING_PAIRS[event.key]) {
      event.preventDefault();
      const close = OPENING_PAIRS[event.key];
      const selected = text.slice(start, end);
      const replacement = `${event.key}${selected}${close}`;
      commit(replaceRange(text, start, end, replacement), start + 1, start + 1 + selected.length);
      return;
    }

    if (CLOSING_PAIRS.has(event.key) && start === end && text[start] === event.key) {
      event.preventDefault();
      commit(text, start + 1);
    }
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-card ${className}`}>
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-300">Code</span>
        <span className="font-mono text-xs text-zinc-500">{language}</span>
      </div>
      <div className="relative flex min-h-0 flex-1 bg-black" style={{ minHeight }}>
        <div
          ref={gutterRef}
          className="code-editor-gutter select-none overflow-hidden border-r border-zinc-900 bg-black px-3 py-4 text-right font-mono text-sm leading-relaxed text-zinc-600"
          style={{ maxHeight: minHeight }}
          aria-hidden="true"
        >
          {lineNumbers.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 bg-black">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <pre
              ref={highlightRef}
              className="min-h-full min-w-max whitespace-pre p-4 font-mono text-sm leading-relaxed"
              style={{ minHeight, tabSize: INDENT_BY_LANGUAGE[language] || 2 }}
              aria-hidden="true"
            >
              {highlightCode(value, language)}
            </pre>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            disabled={disabled}
            className="relative min-h-full w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-transparent caret-emerald-300 selection:bg-emerald-500/30 placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            style={{ minHeight, tabSize: INDENT_BY_LANGUAGE[language] || 2 }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
          />
        </div>
      </div>
    </div>
  );
}
