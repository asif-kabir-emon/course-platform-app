import React, { ReactNode } from "react";

const inlinePattern =
  /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text: string) =>
  text.split(inlinePattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <del key={index}>{part.slice(2, -2)}</del>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
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
  let listItems: { content: string; checked?: boolean }[] = [];
  let listType: "bullet" | "ordered" | "checklist" | null = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    const ListTag = listType === "ordered" ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={
          listType === "ordered"
            ? "my-4 list-decimal space-y-2 pl-6"
            : listType === "checklist"
              ? "my-4 space-y-2"
              : "my-4 list-disc space-y-2 pl-6"
        }
      >
        {listItems.map((item, index) => (
          <li
            key={index}
            className={
              listType === "checklist"
                ? "flex list-none items-start gap-2"
                : undefined
            }
          >
            {listType === "checklist" && (
              <span
                className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                  item.checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {item.checked ? "✓" : ""}
              </span>
            )}
            <span>{renderInline(item.content)}</span>
          </li>
        ))}
      </ListTag>,
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const checklist = line.match(/^- \[([ xX])\] (.*)$/);
    if (checklist) {
      if (listType && listType !== "checklist") flushList();
      listType = "checklist";
      listItems.push({
        content: checklist[2],
        checked: checklist[1].toLowerCase() === "x",
      });
      return;
    }
    if (line.startsWith("- ")) {
      if (listType && listType !== "bullet") flushList();
      listType = "bullet";
      listItems.push({ content: line.slice(2) });
      return;
    }
    const orderedItem = line.match(/^\d+\. (.*)$/);
    if (orderedItem) {
      if (listType && listType !== "ordered") flushList();
      listType = "ordered";
      listItems.push({ content: orderedItem[1] });
      return;
    }
    flushList();
    if (!line.trim()) return;
    if (line.trim() === "---") {
      blocks.push(<hr key={blocks.length} className="my-8 border-border" />);
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1
          key={blocks.length}
          className="mb-3 mt-5 text-3xl font-bold tracking-tight"
        >
          {renderInline(line.slice(2))}
        </h1>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={blocks.length} className="mb-2.5 mt-5 text-2xl font-semibold">
          {renderInline(line.slice(3))}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={blocks.length} className="mb-2 mt-4 text-lg font-semibold">
          {renderInline(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={blocks.length}
          className="my-4 border-l-4 border-primary/40 bg-primary/5 px-4 py-2.5 text-muted-foreground"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={blocks.length} className="my-2 leading-7 text-foreground/90">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList();

  return (
    <div className="max-w-none break-words leading-7 [overflow-wrap:anywhere]">
      {blocks}
    </div>
  );
};

export default MarkdownContent;
