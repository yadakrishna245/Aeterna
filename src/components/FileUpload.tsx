import { useState, useRef, useCallback } from "react";
import { Upload, File, Trash2, Check, Loader2 } from "lucide-react";
import { encryptBinary } from "../utils/crypto";
import type { EncryptedBinaryData } from "../utils/crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "text/markdown",
];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.doc,.docx,.txt,.csv,.md";

type FileStatus = "pending" | "encrypting" | "encrypted" | "error";

interface EncryptedFileEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: FileStatus;
  error?: string;
  encrypted?: EncryptedBinaryData;
}

export interface EncryptedFileResult {
  name: string;
  size: number;
  mimeType: string;
  encrypted: EncryptedBinaryData;
}

interface FileUploadProps {
  masterPassword: string;
  onFilesReady: (files: EncryptedFileResult[]) => void;
  onCancel?: () => void;
}

export function FileUpload({ masterPassword, onFilesReady, onCancel }: FileUploadProps) {
  const [files, setFiles] = useState<EncryptedFileEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const generateId = () => crypto.randomUUID();

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File exceeds 10MB limit (${formatSize(file.size)})`;
    }
    if (!ACCEPTED_TYPES.includes(file.type) && file.type !== "") {
      // Also check by extension for edge cases
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExts = ACCEPTED_EXTENSIONS.replace(/\./g, "").split(",");
      if (!ext || !validExts.includes(ext)) {
        return `Unsupported file type: ${file.type || file.name}`;
      }
    }
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setError("");
    const fileArray = Array.from(newFiles);

    if (files.length + fileArray.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. You have ${files.length} already.`);
      return;
    }

    const entries: EncryptedFileEntry[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      // Prevent duplicates by name
      if (files.some((f) => f.name === file.name)) {
        setError(`"${file.name}" is already added.`);
        continue;
      }

      entries.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        status: "pending",
      });
    }

    if (entries.length === 0) return;

    setFiles((prev) => [...prev, ...entries]);

    // Start encrypting new files
    encryptFiles(fileArray, entries);
  }, [files, masterPassword]);

  const encryptFiles = async (rawFiles: File[], entries: EncryptedFileEntry[]) => {
    setIsProcessing(true);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const file = rawFiles[i];

      // Update status to encrypting
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: "encrypting" as FileStatus } : f))
      );

      try {
        const arrayBuffer = await file.arrayBuffer();
        const encrypted = await encryptBinary(arrayBuffer, masterPassword);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "encrypted" as FileStatus, encrypted }
              : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Encryption failed";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "error" as FileStatus, error: message }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setError("");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = "";
    }
  }, [addFiles]);

  const handleSubmit = useCallback(() => {
    const encryptedFiles = files.filter(
      (f): f is EncryptedFileEntry & { encrypted: EncryptedBinaryData } =>
        f.status === "encrypted" && !!f.encrypted
    );

    if (encryptedFiles.length === 0) return;

    const results: EncryptedFileResult[] = encryptedFiles.map((f) => ({
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      encrypted: f.encrypted,
    }));

    onFilesReady(results);
  }, [files, onFilesReady]);

  const allEncrypted = files.length > 0 && files.every((f) => f.status === "encrypted");
  const hasErrors = files.some((f) => f.status === "error");

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-gold" />
        <h3 className="text-lg font-semibold text-slate-100">Encrypted File Upload</h3>
      </div>

      {/* Drop Zone */}
      {files.length < MAX_FILES && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragOver
              ? "border-gold bg-gold/5 shadow-glow"
              : "border-navy-700 hover:border-gold/40 hover:bg-navy-900/50"
          }`}
          role="button"
          tabIndex={0}
          aria-label="Drop files here or click to browse"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <Upload
            className={`w-10 h-10 mb-3 transition-colors ${
              isDragOver ? "text-gold" : "text-slate-500"
            }`}
          />
          <p className="text-sm text-slate-300 text-center">
            {isDragOver ? (
              <span className="text-gold font-medium">Drop files here</span>
            ) : (
              <>
                <span className="text-gold font-medium">Click to browse</span> or drag & drop files
              </>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            PDF, images, docs, text • Max 10MB per file • Up to {MAX_FILES} files
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleInputChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            Files ({files.length}/{MAX_FILES})
          </p>

          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 bg-navy-900 border border-navy-700 rounded-lg px-4 py-3"
              >
                {/* File Icon */}
                <File className="w-4 h-4 text-slate-400 shrink-0" />

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {file.status === "pending" && (
                    <span className="text-xs text-slate-500">Pending</span>
                  )}
                  {file.status === "encrypting" && (
                    <div className="flex items-center gap-1.5 text-gold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Encrypting</span>
                    </div>
                  )}
                  {file.status === "encrypted" && (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs">Encrypted</span>
                    </div>
                  )}
                  {file.status === "error" && (
                    <span className="text-xs text-red-400" title={file.error}>
                      Failed
                    </span>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="shrink-0 text-slate-500 hover:text-red-400 transition-colors p-1"
                  aria-label={`Remove ${file.name}`}
                  disabled={file.status === "encrypting"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allEncrypted || isProcessing}
            className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Encrypting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {allEncrypted ? "Upload Encrypted Files" : "Waiting for encryption..."}
              </>
            )}
          </button>

          {hasErrors && (
            <span className="text-xs text-red-400">
              Some files failed. Remove them and try again.
            </span>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline"
              disabled={isProcessing}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Security Footer */}
      <div className="pt-2 border-t border-navy-700">
        <p className="text-xs text-slate-600">
          🔒 All files are encrypted locally with AES-256-GCM before upload. The server stores only ciphertext.
        </p>
      </div>
    </div>
  );
}
