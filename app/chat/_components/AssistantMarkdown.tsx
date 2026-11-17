import Markdown, { type Components } from "react-markdown";

// Defined once at module level so the renderers are not recreated per message.
const components: Components = {
  h1: (props) => <h2 className="text-base font-semibold mt-2 mb-1" {...props} />,
  h2: (props) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
  h3: (props) => <h4 className="text-sm font-semibold mt-1 mb-1" {...props} />,
  p: (props) => <p className="leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 space-y-1" {...props} />,
  ol: (props) => (
    <ol className="list-decimal pl-5 space-y-1 mt-8 first:mt-0" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  code: (props) => (
    <code
      className="px-1 py-0.5 rounded text-xs"
      style={{ background: "var(--surface-2)" }}
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="underline"
      style={{ color: "var(--azure)" }}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  hr: () => <hr style={{ borderColor: "var(--steel-soft)" }} />,
  blockquote: (props) => (
    <blockquote
      className="pl-3 italic"
      style={{
        borderLeft: "3px solid var(--steel-soft)",
        color: "var(--ink-secondary)",
      }}
      {...props}
    />
  ),
};

export function AssistantMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-2">
      <Markdown components={components}>{children}</Markdown>
    </div>
  );
}
