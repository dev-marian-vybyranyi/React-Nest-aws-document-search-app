import { useRef } from "react";
import { useDocumentStore } from "../store/documentStore";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { ALLOWED_DOC_TYPES, MAX_FILE_SIZE } from "../constants/file";

export const UploadButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, isUploading } = useDocumentStore();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFile}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
    </>
  );
};
