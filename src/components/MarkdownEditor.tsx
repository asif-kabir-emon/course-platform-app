"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  Quote,
  Rows3,
} from "lucide-react";
import { useRef, useState } from "react";
import MarkdownContent from "./MarkdownContent";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const MarkdownEditor = ({
  value,
  onChange,
  placeholder,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const wrapSelection = (before: string, after = before, fallback = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.slice(start, end) || fallback;
    const nextValue = `${value.slice(0, start)}${before}${selection}${after}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selection.length,
      );
    });
  };

  const prefixLines = (prefix: string, fallback: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.slice(start, end) || fallback;
    const formatted = selection
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    onChange(`${value.slice(0, start)}${formatted}${value.slice(end)}`);
  };

  const tools = [
    {
      label: "Heading",
      icon: Heading2,
      command: "heading",
    },
    {
      label: "Bold",
      icon: Bold,
      command: "bold",
    },
    {
      label: "Italic",
      icon: Italic,
      command: "italic",
    },
    {
      label: "Bullet list",
      icon: List,
      command: "list",
    },
    {
      label: "Quote",
      icon: Quote,
      command: "quote",
    },
    {
      label: "Link",
      icon: Link2,
      command: "link",
    },
  ] as const;

  const runCommand = (command: (typeof tools)[number]["command"]) => {
    if (command === "heading") {
      prefixLines("## ", "Section heading");
    } else if (command === "bold") {
      wrapSelection("**", "**", "important text");
    } else if (command === "italic") {
      wrapSelection("_", "_", "emphasized text");
    } else if (command === "list") {
      prefixLines("- ", "List item");
    } else if (command === "quote") {
      prefixLines("> ", "Key takeaway");
    } else {
      wrapSelection("[", "](https://)", "link text");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 p-2">
        <div className="flex flex-wrap gap-1">
          {tools.map(({ label, icon: Icon, command }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="icon"
              title={label}
              aria-label={label}
              onClick={() => runCommand(command)}
              className="size-8"
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant={showPreview ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowPreview((current) => !current)}
        >
          {showPreview ? <Rows3 /> : <Eye />}
          {showPreview ? "Write" : "Preview"}
        </Button>
      </div>
      {showPreview ? (
        <div className="min-h-80 p-5 sm:p-6">
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Start writing to preview the lesson.
            </p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-80 resize-y rounded-none border-0 px-5 py-4 font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
        />
      )}
      <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        Supports headings, bold, italic, lists, quotes, and links.
      </div>
    </div>
  );
};

export default MarkdownEditor;
