import { create } from "zustand";
import {
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
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  search: (query: string) => Promise<void>;
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
      const { url } = await getPresignedUrl(userEmail, file.name);
      await uploadToS3(url, file);
      await fetchDocuments();
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
}));
