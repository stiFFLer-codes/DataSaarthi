import React from "react";

interface SimpleMarkdownProps {
  text: string;
  className?: string;
}

export function SimpleMarkdown({ text, className = "" }: SimpleMarkdownProps) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const renderInline = (line: string, key: number) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIndex = 0;

    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/);
      const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/);

      const firstMatch = codeMatch && boldMatch
        ? (codeMatch.index ?? 0) <= (boldMatch.index ?? 0) ? codeMatch : boldMatch
        : codeMatch || boldMatch;

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }

      const [, before, content, after] = firstMatch;
      if (before) parts.push(before);
      if (firstMatch === codeMatch) {
        parts.push(
          <code
            key={`${key}-${partIndex++}`}
            className="px-1.5 py-0.5 rounded bg-[hsl(var(--bezel-outer-bg))] text-[hsl(var(--accent))] font-mono text-xs font-medium"
          >
            {content}
          </code>
        );
      } else {
        parts.push(
          <strong key={`${key}-${partIndex++}`} className="font-semibold text-[hsl(var(--text-primary))]">
            {content}
          </strong>
        );
      }
      remaining = after;
    }
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-[hsl(var(--bezel-outer-bg))] rounded-lg p-4 overflow-x-auto text-xs font-mono text-[hsl(var(--text-secondary))] my-3 border border-[hsl(var(--border-hairline))]"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-display font-bold text-[hsl(var(--text-primary))] mt-6 mb-3 tracking-tight">
          {renderInline(trimmed.slice(2), i)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-display font-semibold text-[hsl(var(--text-primary))] mt-5 mb-2">
          {renderInline(trimmed.slice(3), i)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-display font-semibold text-[hsl(var(--text-primary))] mt-4 mb-2">
          {renderInline(trimmed.slice(4), i)}
        </h3>
      );
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={i} className="text-sm text-[hsl(var(--text-secondary))] ml-4 list-disc leading-relaxed">
          {renderInline(trimmed.slice(2), i)}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <li key={i} className="text-sm text-[hsl(var(--text-secondary))] ml-4 list-decimal leading-relaxed">
          {renderInline(content, i)}
        </li>
      );
    } else {
      elements.push(
        <p key={i} className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
          {renderInline(line, i)}
        </p>
      );
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre
        key="code-unclosed"
        className="bg-[hsl(var(--bezel-outer-bg))] rounded-lg p-4 overflow-x-auto text-xs font-mono text-[hsl(var(--text-secondary))] my-3 border border-[hsl(var(--border-hairline))]"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className={`space-y-2 ${className}`}>{elements}</div>;
}
