import { create } from "zustand";
import type { Document, SearchResult } from "../types/document.types";

interface DocumentStore {
  userEmail: string | null;
  documents: Document[];
  searchResults: SearchResult[];
  isUploading: boolean;

  setUserEmail: (email: string) => void;
}

export const documentStore = create<DocumentStore>((set) => ({
  userEmail: localStorage.getItem("userEmail"),
  documents: [],
  searchResults: [],
  isUploading: false,

  setUserEmail: (email: string) => {
    localStorage.setItem("userEmail", email);
    set({ userEmail: email });
  },
}));
