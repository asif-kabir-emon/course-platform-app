"use client";

import { Button } from "@/components/ui/button";
import {
  Bold,
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from "lucide-react";
import { useEffect, useRef } from "react";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  compact?: boolean;
};

const tools = [
  { label: "Heading 1", icon: Heading1, command: "heading1" },
  { label: "Heading 2", icon: Heading2, command: "heading2" },
  { label: "Heading 3", icon: Heading3, command: "heading3" },
  { label: "Bold", icon: Bold, command: "bold" },
  { label: "Italic", icon: Italic, command: "italic" },
  {
    label: "Strikethrough",
    icon: Strikethrough,
    command: "strikethrough",
  },
  { label: "Inline code", icon: Code2, command: "code" },
  { label: "Bullet list", icon: List, command: "bulletList" },
  { label: "Numbered list", icon: ListOrdered, command: "numberedList" },
  { label: "Checklist", icon: CheckSquare, command: "checklist" },
  { label: "Quote", icon: Quote, command: "quote" },
  { label: "Link", icon: Link2, command: "link" },
  { label: "Divider", icon: Minus, command: "divider" },
] as const;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const renderInlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );

const markdownToHtml = (markdown: string) => {
  if (!markdown.trim()) return "";

  const blocks: string[] = [];
  const lines = markdown.split("\n");
  let listItems: string[] = [];
  let listType: "ul" | "ol" | "checklist" | null = null;

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const tag = listType === "ol" ? "ol" : "ul";
    const className = listType === "checklist" ? ' data-checklist="true"' : "";
    blocks.push(`<${tag}${className}>${listItems.join("")}</${tag}>`);
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const checklist = line.match(/^- \[([ xX])\] (.*)$/);
    if (checklist) {
      if (listType && listType !== "checklist") flushList();
      listType = "checklist";
      listItems.push(
        `<li data-checked="${checklist[1].toLowerCase() === "x"}">${renderInlineMarkdown(checklist[2])}</li>`,
      );
      return;
    }

    const ordered = line.match(/^\d+\. (.*)$/);
    if (ordered) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
      return;
    }

    if (line.startsWith("- ")) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(`<li>${renderInlineMarkdown(line.slice(2))}</li>`);
      return;
    }

    flushList();
    if (!line.trim()) {
      blocks.push("<p><br></p>");
    } else if (line === "---") {
      blocks.push("<hr>");
    } else if (line.startsWith("# ")) {
      blocks.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      blocks.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      blocks.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("> ")) {
      blocks.push(
        `<blockquote>${renderInlineMarkdown(line.slice(2))}</blockquote>`,
      );
    } else {
      blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
    }
  });

  flushList();
  return blocks.join("");
};

const inlineHtmlToMarkdown = (element: HTMLElement) => {
  const convertNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }

    if (!(node instanceof HTMLElement)) return "";

    const content = Array.from(node.childNodes).map(convertNode).join("");
    const tag = node.tagName.toLowerCase();

    if (tag === "strong" || tag === "b") return `**${content}**`;
    if (tag === "em" || tag === "i") return `_${content}_`;
    if (tag === "s" || tag === "strike" || tag === "del") {
      return `~~${content}~~`;
    }
    if (tag === "code") return `\`${content}\``;
    if (tag === "a") return `[${content}](${node.getAttribute("href") || ""})`;
    if (tag === "br") return "\n";
    return content;
  };

  return Array.from(element.childNodes).map(convertNode).join("");
};

const htmlToMarkdown = (editor: HTMLElement) => {
  const lines = Array.from(editor.children).flatMap((element) => {
    if (!(element instanceof HTMLElement)) return [];
    const tag = element.tagName.toLowerCase();
    const content = inlineHtmlToMarkdown(element).trim();

    if (tag === "h1") return [`# ${content}`];
    if (tag === "h2") return [`## ${content}`];
    if (tag === "h3") return [`### ${content}`];
    if (tag === "blockquote") return [`> ${content}`];
    if (tag === "code") return [`\`${content}\``];
    if (tag === "hr") return ["---"];
    if (tag === "ul" || tag === "ol") {
      const checklist = element.dataset.checklist === "true";
      return Array.from(element.children).map((item, index) => {
        const itemElement = item as HTMLElement;
        const itemContent = inlineHtmlToMarkdown(itemElement).trim();
        if (checklist) {
          return `- [${itemElement.dataset.checked === "true" ? "x" : " "}] ${itemContent}`;
        }
        return tag === "ol" ? `${index + 1}. ${itemContent}` : `- ${itemContent}`;
      });
    }
    return [content];
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const MarkdownEditor = ({
  value,
  onChange,
  placeholder,
  ariaLabel = "Lesson content",
  compact = false,
}: MarkdownEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedValue = useRef(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmittedValue.current) return;
    editor.innerHTML = markdownToHtml(value);
    lastEmittedValue.current = value;
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && !editor.innerHTML) {
      editor.innerHTML = markdownToHtml(value);
    }
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const markdown = htmlToMarkdown(editor);
    lastEmittedValue.current = markdown;
    onChange(markdown);
  };

  const runCommand = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
  };

  const createLink = () => {
    const url = window.prompt("Enter the link URL", "https://");
    if (url) runCommand("createLink", url);
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      '<ul data-checklist="true"><li data-checked="false">Checklist item</li></ul>',
    );
    emitChange();
  };

  const insertDivider = () => {
    editorRef.current?.focus();
    document.execCommand("insertHorizontalRule");
    emitChange();
  };

  const runTool = (command: (typeof tools)[number]["command"]) => {
    if (command === "heading1") runCommand("formatBlock", "h1");
    else if (command === "heading2") runCommand("formatBlock", "h2");
    else if (command === "heading3") runCommand("formatBlock", "h3");
    else if (command === "bold") runCommand("bold");
    else if (command === "italic") runCommand("italic");
    else if (command === "strikethrough") runCommand("strikeThrough");
    else if (command === "code") runCommand("formatBlock", "code");
    else if (command === "bulletList") runCommand("insertUnorderedList");
    else if (command === "numberedList") runCommand("insertOrderedList");
    else if (command === "checklist") insertChecklist();
    else if (command === "quote") runCommand("formatBlock", "blockquote");
    else if (command === "link") createLink();
    else insertDivider();
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b bg-background/95 p-2 backdrop-blur">
        {tools.map(({ label, icon: Icon, command }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="icon"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runTool(command)}
            className="size-8"
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
      <div className="bg-muted/20 p-3 sm:p-5">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          data-placeholder={placeholder}
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand(
              "insertText",
              false,
              event.clipboardData.getData("text/plain"),
            );
          }}
          className={`mx-auto max-w-4xl break-words rounded-sm bg-background px-6 text-base leading-7 shadow-sm outline-none [overflow-wrap:anywhere] empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] sm:px-10 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-2.5 [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-6 [&_li]:my-0.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-checklist=true]]:list-none [&_ul[data-checklist=true]]:pl-0 ${
            compact ? "min-h-44 py-5" : "min-h-[34rem] py-7"
          }`}
        />
      </div>
      <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        Formatting appears directly in the lesson while you type.
      </div>
    </div>
  );
};

export default MarkdownEditor;
