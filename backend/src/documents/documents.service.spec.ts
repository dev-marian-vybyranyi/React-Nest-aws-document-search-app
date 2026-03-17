jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-s3-url.com/test.pdf'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from './documents.service';
import { Document } from '../database/entities/document.entity';
import { OpensearchService } from '../opensearch/opensearch.service';
import { SseService } from '../sse/sse.service';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findByIds: jest.fn(),
};

const mockOpensearchService = {
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
        { provide: OpensearchService, useValue: mockOpensearchService },
        { provide: SseService, useValue: mockSseService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
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
});
