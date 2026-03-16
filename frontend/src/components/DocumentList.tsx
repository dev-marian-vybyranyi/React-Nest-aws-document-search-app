import { useEffect } from "react";
import toast from "react-hot-toast";
import { useDocumentStore } from "../store/documentStore";
import { DocumentCard } from "./DocumentCard";

export const DocumentList = () => {
  const {
    documents,
    fetchDocuments,
    removeDocument,
    userEmail,
    updateDocumentStatus,
  } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const es = new EventSource(
      `http://localhost:3000/documents/events?userEmail=${encodeURIComponent(userEmail)}`,
    );

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        documentId: string;
        status: "success" | "error";
      };
      updateDocumentStatus(data.documentId, data.status);

      if (data.status === "success") {
        toast.success("Document indexed and ready to search!");
      } else if (data.status === "error") {
        toast.error("Document indexing failed");
      }
    };

    return () => es.close();
  }, [userEmail]);

  const handleDelete = async (id: string) => {
    await toast.promise(removeDocument(id), {
      loading: "Deleting...",
      success: "Document deleted",
      error: "Delete failed",
    });
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
        <p className="text-slate-500 font-medium">No documents yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Upload your first file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc as any} onDelete={handleDelete} />
      ))}
    </div>
  );
};
