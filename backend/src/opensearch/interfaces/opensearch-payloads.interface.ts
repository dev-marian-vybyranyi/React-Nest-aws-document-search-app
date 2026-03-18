export interface IndexDocumentPayload {
  id: string;
  content: string;
  userEmail: string;
}

export interface SearchDocumentsPayload {
  query: string;
  userEmail: string;
}
