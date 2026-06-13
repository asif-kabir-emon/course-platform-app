import React, { ReactNode } from "react";

const inlinePattern = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text: string) =>
  text.split(inlinePattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-4"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });

const MarkdownContent = ({ content }: { content: string }) => {
  const blocks: ReactNode[] = [];
  const lines = content.split("\n");
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul
        key={`list-${blocks.length}`}
        className="my-4 list-disc space-y-2 pl-6"
      >
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line) => {
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }
    flushList();
    if (!line.trim()) return;
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={blocks.length} className="mb-3 mt-7 text-xl font-semibold">
          {renderInline(line.slice(3))}
        </h2>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={blocks.length}
          className="my-4 border-l-4 border-primary/40 bg-primary/5 px-4 py-3 text-muted-foreground"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={blocks.length} className="my-3 leading-8 text-foreground/90">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList();

  return <div className="max-w-none">{blocks}</div>;
};

export default MarkdownContent;
