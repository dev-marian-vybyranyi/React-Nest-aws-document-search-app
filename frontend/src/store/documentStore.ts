import { create } from "zustand";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  getPresignedUrl,
  searchDocuments,
  uploadToS3,
} from "../api/documents.api";
import type { Document, SearchResult } from "../types/document.types";

interface DocumentStore {
  userEmail: string | null;
  documents: Document[];
  searchResults: SearchResult[];
  isUploading: boolean;

  setUserEmail: (email: string) => void;
  clearUserEmail: () => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  updateDocumentStatus: (
    documentId: string,
    status: "success" | "error",
  ) => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  userEmail: localStorage.getItem("userEmail"),
  documents: [],
  searchResults: [],
  isUploading: false,

  setUserEmail: (email: string) => {
    localStorage.setItem("userEmail", email);
    set({ userEmail: email });
  },

  clearUserEmail: () => {
    localStorage.removeItem("userEmail");
    set({ userEmail: null, documents: [], searchResults: [] });
  },

  fetchDocuments: async () => {
    const { userEmail } = get();
    if (!userEmail) return;
    const documents = await getDocuments(userEmail);
    set({ documents });
  },

  uploadDocument: async (file: File) => {
    const { userEmail, fetchDocuments } = get();
    if (!userEmail) return;

    set({ isUploading: true });
    try {
      const { url, key } = await getPresignedUrl(file.name);
      await uploadToS3(url, file);
      await createDocument(userEmail, file.name, key);
      await fetchDocuments();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      set({ isUploading: false });
    }
  },

  removeDocument: async (id: string) => {
    const { userEmail, fetchDocuments } = get();
    if (!userEmail) return;
    await deleteDocument(id, userEmail);
    await fetchDocuments();
  },

  search: async (query: string) => {
    const { userEmail } = get();
    if (!userEmail) return;
    const searchResults = await searchDocuments(query, userEmail);
    set({ searchResults });
  },

  clearSearch: () => set({ searchResults: [] }),

  updateDocumentStatus: (documentId: string, status: "success" | "error") => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, status } : doc,
      ),
    }));
  },
}));
