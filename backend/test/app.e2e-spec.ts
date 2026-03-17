import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Documents API (e2e)', () => {
  let app: INestApplication;
  const testEmail = 'e2e-test@gmail.com';
  let createdDocumentId: string;

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

  describe('POST /documents/presigned-url', () => {
    it('should return presigned url and create document', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/presigned-url')
        .send({ userEmail: testEmail, filename: 'e2e-test.pdf' })
        .expect(201);

      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('documentId');
      expect(response.body).toHaveProperty('s3Filename');
      expect(response.body.url).toContain('amazonaws.com');

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
