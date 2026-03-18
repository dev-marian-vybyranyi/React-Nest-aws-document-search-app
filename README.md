# Document Search App

A full-stack application for uploading, processing, and searching documents (PDF, DOCX, DOC) with real-time status updates and full-text search capabilities.

## Features

- **Asynchronous Document Processing**: Automatically extracts text from uploaded documents using AWS SQS for reliable background processing.
- **Full-Text Search**: Highly performant search powered by OpenSearch, featuring relevant highlights from document content.
- **Real-Time Status Notifications**: Leverages Server-Sent Events (SSE) to notify users in real-time about their document processing status (Pending → Success/Error).
- **Secure File Storage**: Integration with AWS S3 for secure file storage and pre-signed URL uploads.
- **Modular Backend Architecture**: Reorganized into clean `modules`, `libs`, and `shared` layers for maintainability and scalability.

## Technology Stack

### Backend (NestJS)
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Search**: OpenSearch Project
- **Infrastructure**: AWS SDK (S3, SQS)
- **File Parsing**: `mammoth` (DOCX), `pdf-parse` (PDF), `word-extractor` (DOC)

### Frontend (React)
- **Build Tool**: Vite
- **UI Architecture**: shadcn/ui + TailwindCSS
- **State Management**: Zustand
- **Forms & Validation**: Formik + Yup
- **API Client**: Axios

## Project Structure

```text
├── backend/            # NestJS Application
│   ├── src/
│   │   ├── modules/    # Documents, Uploads, SSE
│   │   ├── libs/       # OpenSearch, SQS wrappers
│   │   └── shared/     # Config, Entities, Interfaces
├── frontend/           # Vite + React Application
└── docker-compose.yml  # Local Postgres container
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for PostgreSQL)
- AWS Account (S3 Buckets, SQS Queues)
- OpenSearch Instance

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd document-search-app
   ```

2. **Database Setup**:
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Configure .env based on requirements
   npm run start:dev
   ```

4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## License

[UNLICENSED]
