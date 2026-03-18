import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Documents API (e2e)', () => {
  let app: INestApplication;
  const testEmail = 'e2e-test@gmail.com';
  let createdDocumentId: string;
  let uploadKey: string;
  let uploadUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /uploads/presigned-url', () => {
    it('should return presigned url', async () => {
      const response = await request(app.getHttpServer())
        .get('/uploads/presigned-url')
        .query({ filename: 'e2e-test.pdf' })
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('key');
      expect(response.body.url).toContain('amazonaws.com');

      uploadUrl = response.body.url;
      uploadKey = response.body.key;
    });
  });

  describe('POST /documents', () => {
    it('should upload file to S3 and then create document', async () => {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: Buffer.from('mock pdf content'),
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      expect(uploadResponse.ok).toBe(true);

      const response = await request(app.getHttpServer())
        .post('/documents')
        .send({ userEmail: testEmail, originalFilename: 'e2e-test.pdf', key: uploadKey })
        .expect(201);

      expect(response.body).toHaveProperty('documentId');
      expect(response.body).toHaveProperty('s3Filename');

      createdDocumentId = response.body.documentId;
    });
  });

  describe('GET /documents', () => {
    it('should return list of user documents', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .query({ userEmail: testEmail })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      const doc = response.body.find((d: any) => d.id === createdDocumentId);
      expect(doc).toBeDefined();
      expect(doc.status).toBe('pending');
      expect(doc.userFilename).toBe('e2e-test.pdf');
    });
  });

  describe('GET /documents/search', () => {
    it('should return empty array for new index', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents/search')
        .query({ q: 'test', userEmail: testEmail })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${createdDocumentId}`)
        .query({ userEmail: testEmail })
        .expect(200);
    });

    it('should not find deleted document', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .query({ userEmail: testEmail })
        .expect(200);

      const doc = response.body.find((d: any) => d.id === createdDocumentId);
      expect(doc).toBeUndefined();
    });
  });
});
