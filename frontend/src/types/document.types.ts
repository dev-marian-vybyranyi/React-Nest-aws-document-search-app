export type DocumentStatus = "pending" | "success" | "error";

export interface Document {
  id: string;
  userFilename: string;
  uploadedAt: string;
  status: DocumentStatus;
  s3Filename: string;
}

export interface SearchResult {
  id: string;
  userFilename: string;
  uploadedAt: string;
  highlight: string | null;
}
