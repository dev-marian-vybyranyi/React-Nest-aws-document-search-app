jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  CopyObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from './documents.service';
import { Document } from '../../shared/entities/document.entity';
import { DocumentsOpensearchRepository } from '../../libs/opensearch/documents-opensearch.repository';
import { SseService } from '../sse/sse.service';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findByIds: jest.fn(),
};

const mockOpensearchRepository = {
  indexDocument: jest.fn(),
  search: jest.fn(),
  deleteDocument: jest.fn(),
};

const mockSseService = {
  emit: jest.fn(),
  getOrCreateSubject: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'aws.region': 'eu-central-1',
      'aws.accessKeyId': 'test-key',
      'aws.secretAccessKey': 'test-secret',
      'aws.s3Bucket': 'test-bucket',
    };
    return config[key];
  }),
};

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document), useValue: mockRepository },
        { provide: DocumentsOpensearchRepository, useValue: mockOpensearchRepository },
        { provide: SseService, useValue: mockSseService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should throw exception if key does not start with tmp/', async () => {
      await expect(
        service.createDocument('test@gmail.com', 'test.pdf', 'test.pdf'),
      ).rejects.toThrow('Invalid temporary file key');
    });

    it('should copy file from tmp location and save document', async () => {
      const mockDoc = { id: 'uuid-1', s3Filename: 'test.pdf' };
      mockRepository.create.mockReturnValue(mockDoc);
      mockRepository.save.mockResolvedValue(mockDoc);

      const result = await service.createDocument(
        'test@gmail.com',
        'test.pdf',
        'tmp/test.pdf',
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'test@gmail.com',
          userFilename: 'test.pdf',
          s3Filename: 'test.pdf',
          status: 'pending',
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockDoc);
      expect(result.documentId).toBe('uuid-1');
      expect(result.s3Filename).toBe('test.pdf');
    });
  });

  describe('findAllByUser', () => {
    it('should return documents for a user', async () => {
      const mockDocs = [
        {
          id: 'uuid-1',
          userEmail: 'test@gmail.com',
          userFilename: 'test.pdf',
          s3Filename: 'uuid.pdf',
          status: 'success',
          uploadedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockDocs);

      const result = await service.findAllByUser('test@gmail.com');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userEmail: 'test@gmail.com' },
        order: { uploadedAt: 'DESC' },
      });
      expect(result).toEqual(mockDocs);
    });

    it('should return empty array if no documents', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAllByUser('empty@gmail.com');
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update status to success and emit SSE', async () => {
      const mockDoc = {
        id: 'uuid-1',
        userEmail: 'test@gmail.com',
        s3Filename: 'uuid.pdf',
        status: 'pending',
      };

      mockRepository.findOne.mockResolvedValue(mockDoc);
      mockRepository.save.mockResolvedValue({ ...mockDoc, status: 'success' });

      await service.updateStatus('uuid.pdf', 'success');

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockDoc,
        status: 'success',
      });
      expect(mockSseService.emit).toHaveBeenCalledWith('test@gmail.com', {
        documentId: 'uuid-1',
        status: 'success',
      });
    });

    it('should do nothing if document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await service.updateStatus('non-existent.pdf', 'success');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockSseService.emit).not.toHaveBeenCalled();
    });

    it('should update status to error and emit SSE', async () => {
      const mockDoc = {
        id: 'uuid-1',
        userEmail: 'test@gmail.com',
        s3Filename: 'uuid.pdf',
        status: 'pending',
      };

      mockRepository.findOne.mockResolvedValue(mockDoc);
      mockRepository.save.mockResolvedValue({ ...mockDoc, status: 'error' });

      await service.updateStatus('uuid.pdf', 'error');

      expect(mockSseService.emit).toHaveBeenCalledWith('test@gmail.com', {
        documentId: 'uuid-1',
        status: 'error',
      });
    });
  });

  describe('deleteDocument', () => {
    it('should throw if document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteDocument('non-existent-id', 'test@gmail.com'),
      ).rejects.toThrow('Document not found');
    });

    it('should delete from opensearch and db', async () => {
      const mockDoc = {
        id: 'uuid-1',
        userEmail: 'test@gmail.com',
        s3Filename: 'uuid.pdf',
        userFilename: 'test.pdf',
      };

      mockRepository.findOne.mockResolvedValue(mockDoc);
      mockRepository.remove.mockResolvedValue(mockDoc);
      mockOpensearchRepository.deleteDocument.mockResolvedValue(undefined);

      await service.deleteDocument('uuid-1', 'test@gmail.com');

      expect(mockOpensearchRepository.deleteDocument).toHaveBeenCalledWith(
        'uuid-1',
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(mockDoc);
    });
  });

  describe('searchDocuments', () => {
    it('should return search results with highlights', async () => {
      const mockHits = {
        hits: [
          {
            _id: 'uuid-1',
            highlight: {
              content: ['...some <mark>highlighted</mark> text...'],
            },
          },
        ],
      };

      const mockDocs = [
        {
          id: 'uuid-1',
          userFilename: 'test.pdf',
          uploadedAt: new Date(),
        },
      ];

      mockOpensearchRepository.search.mockResolvedValue(mockHits);
      mockRepository.findByIds.mockResolvedValue(mockDocs);

      const results = await service.searchDocuments(
        'highlighted',
        'test@gmail.com',
      );

      expect(results[0].highlight).toContain('<mark>highlighted</mark>');
      expect(results[0].userFilename).toBe('test.pdf');
    });

    it('should return empty array if no results', async () => {
      mockOpensearchRepository.search.mockResolvedValue({ hits: [] });
      mockRepository.findByIds.mockResolvedValue([]);

      const results = await service.searchDocuments(
        'nothing',
        'test@gmail.com',
      );
      expect(results).toEqual([]);
    });
  });
});
