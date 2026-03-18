import axios from "axios";
import type { Document, SearchResult } from "../types/document.types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getPresignedUrl = async (filename: string) => {
  const { data } = await api.get<{
    url: string;
    key: string;
  }>("/uploads/presigned-url", { params: { filename } });
  return data;
};

export const createDocument = async (
  userEmail: string,
  originalFilename: string,
  key: string,
) => {
  const { data } = await api.post<{
    documentId: string;
    s3Filename: string;
  }>("/documents", { userEmail, originalFilename, key });
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
