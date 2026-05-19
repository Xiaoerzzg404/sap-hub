"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export function MarkdownView({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) {
    return <p className="text-sm text-slate-500">暂无内容。</p>;
  }
  return (
    <div lang="ja" className="prose-md max-w-none text-sm leading-7 text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: (props) => <h2 className="mt-4 text-xl font-bold text-ink" {...props} />,
          h2: (props) => <h3 className="mt-3 text-lg font-bold text-ink" {...props} />,
          h3: (props) => <h4 className="mt-3 text-base font-bold text-ink" {...props} />,
          h4: (props) => <h5 className="mt-2 text-sm font-bold text-ink" {...props} />,
          p: (props) => <p className="my-2 leading-7" {...props} />,
          ul: (props) => <ul className="my-2 list-disc space-y-1 pl-6" {...props} />,
          ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-6" {...props} />,
          li: (props) => <li className="leading-7" {...props} />,
          strong: (props) => <strong className="font-semibold text-ink" {...props} />,
          em: (props) => <em className="italic" {...props} />,
          code: (props) => (
            <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs" {...props} />
          ),
          pre: (props) => (
            <pre className="my-3 overflow-x-auto rounded-md border border-line bg-mist p-3 text-xs" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="my-3 border-l-4 border-sap bg-blue-50 px-3 py-1 text-slate-700" {...props} />
          ),
          table: (props) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-mist text-slate-600" {...props} />,
          th: (props) => <th className="border border-line px-2 py-1" {...props} />,
          td: (props) => <td className="border border-line px-2 py-1 align-top" {...props} />,
          hr: () => <hr className="my-4 border-line" />,
          a: (props) => <a className="text-sap underline" {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
