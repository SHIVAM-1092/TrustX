import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  className = '',
  showLineNumbers = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className={`relative group rounded-md bg-[#070A11] border border-slate-800/90 overflow-hidden font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/80 text-slate-400">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{language}</span>
        <button
          onClick={handleCopy}
          aria-label="Copy code block"
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto max-h-[340px]">
        {showLineNumbers ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="pr-4 text-right text-slate-600 select-none w-8 align-top">
                    {idx + 1}
                  </td>
                  <td className="text-slate-300 whitespace-pre">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="text-slate-200 whitespace-pre-wrap break-all leading-relaxed font-mono">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
};
