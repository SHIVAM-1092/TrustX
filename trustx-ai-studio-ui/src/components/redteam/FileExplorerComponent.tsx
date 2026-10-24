import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  File,
  Copy,
  Check,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { ApiClient, LabFile } from '../../services/apiClient';

interface FileExplorerComponentProps {
  labId: string;
}

export const FileExplorerComponent: React.FC<FileExplorerComponentProps> = ({ labId }) => {
  const [files, setFiles] = useState<LabFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>('instructions.md');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadFiles = async () => {
    const list = await ApiClient.getLabFiles(labId);
    setFiles(list);
    if (list.length > 0 && !selectedFile) {
      setSelectedFile(list[0].name);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [labId]);

  useEffect(() => {
    if (!selectedFile) return;
    const fetchContent = async () => {
      setLoadingContent(true);
      const content = await ApiClient.getFileContent(labId, selectedFile);
      setFileContent(content);
      setLoadingContent(false);
    };
    fetchContent();
  }, [labId, selectedFile]);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = (name: string) => {
    if (name.endsWith('.py') || name.endsWith('.js') || name.endsWith('.json')) {
      return <FileCode className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (name.endsWith('.md') || name.endsWith('.txt')) {
      return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (name.endsWith('.http') || name.endsWith('.log')) {
      return <File className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <File className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="space-y-3">
      {/* File Tree List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            <span>PRACTICE FILES ({files.length})</span>
          </span>
          <button
            onClick={loadFiles}
            title="Refresh files"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1 pt-1 font-mono text-xs">
          {files.map(f => {
            const isSelected = selectedFile === f.name;
            return (
              <button
                key={f.name}
                onClick={() => setSelectedFile(f.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getIcon(f.name)}
                  <span className="truncate">{f.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">{f.size} B</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* File Content Previewer */}
      {selectedFile && (
        <div className="rounded-lg bg-[#070A11] border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold text-slate-200 truncate">{selectedFile}</span>
            </div>
            <button
              onClick={handleCopyContent}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 max-h-48 overflow-y-auto">
            {loadingContent ? (
              <div className="text-center py-4 text-slate-500 text-xs">Loading file content...</div>
            ) : (
              <pre className="text-slate-200 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
