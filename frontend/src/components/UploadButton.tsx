import { UploadCloud } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";
import { ALLOWED_DOC_TYPES, MAX_FILE_SIZE } from "../constants/file";
import { useDocumentStore } from "../store/documentStore";

export const UploadButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, isUploading } = useDocumentStore();

  const processFile = async (file: File) => {
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      toast.error("Only .pdf and .docx files are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be less than 10MB");
      return;
    }

    await toast.promise(uploadDocument(file), {
      loading: "Uploading...",
      success: "File uploaded! Indexing in progress...",
      error: "Upload failed",
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group 
          ${
            isUploading
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-70"
              : "border-slate-300 bg-white"
          }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors 
          ${
            isUploading
              ? "bg-slate-200 text-slate-400"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900 text-base">
            {isUploading ? "Uploading..." : "Click to upload"}
          </p>
          {!isUploading && (
            <p className="text-sm text-slate-500 mt-1">
              Supports .pdf and .docx (up to 10MB)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
