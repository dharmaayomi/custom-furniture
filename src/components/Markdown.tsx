import { FC } from "react";

interface MarkdownProps {
  content: string;
}

const Markdown: FC<MarkdownProps> = ({ content }) => {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-2 text-2xl font-bold">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 text-xl font-semibold">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 text-lg font-medium">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-2 text-base text-gray-700">{children}</p>
    ),
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    u: ({ children }) => <u className="underline">{children}</u>,
    del: ({ children }) => <del className="line-through">{children}</del>,
    ul: ({ children }) => (
      <ul className="mb-2 ml-5 list-inside list-disc">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 ml-5 list-inside list-decimal">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-1">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="space-y-2 leading-relaxed">
      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
