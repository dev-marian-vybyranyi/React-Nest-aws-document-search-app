import axios from "axios";
import type { Document, SearchResult } from "../types/document.types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getPresignedUrl = async (userEmail: string, filename: string) => {
  const { data } = await api.post<{
    url: string;
    documentId: string;
    s3Filename: string;
  }>("/documents/presigned-url", { userEmail, filename });
  return data;
};

export const uploadToS3 = async (url: string, file: File) => {
  await axios.put(url, file, {
    headers: { "Content-Type": file.type },
  });
};

export const getDocuments = async (userEmail: string): Promise<Document[]> => {
  const { data } = await api.get<Document[]>("/documents", {
    params: { userEmail },
  });
  return data;
};

export const deleteDocument = async (id: string, userEmail: string) => {
  await api.delete(`/documents/${id}`, { params: { userEmail } });
};

export const searchDocuments = async (
  q: string,
  userEmail: string,
): Promise<SearchResult[]> => {
  const { data } = await api.get<SearchResult[]>("/documents/search", {
    params: { q, userEmail },
  });
  return data;
};
