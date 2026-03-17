import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpensearchService } from './opensearch.service';

const mockClient = {
  index: jest.fn(),
  search: jest.fn(),
  delete: jest.fn(),
  indices: {
    exists: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn().mockImplementation(() => mockClient),
}));

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'aws.opensearchEndpoint': 'https://mock-opensearch.example.com',
      'opensearch.username': 'admin',
      'opensearch.password': 'password',
    };
    return config[key];
  }),
};

describe('OpensearchService', () => {
  let service: OpensearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpensearchService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OpensearchService>(OpensearchService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create index if it does not exist', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: false });
      mockClient.indices.create.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'documents' }),
      );
    });

    it('should not create index if it already exists', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: true });

      await service.onModuleInit();

      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('indexDocument', () => {
    it('should index document with correct data', async () => {
      mockClient.index.mockResolvedValue({});

      await service.indexDocument('doc-id', 'some text content', 'test@gmail.com');

      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'documents',
        id: 'doc-id',
        body: {
          content: 'some text content',
          userEmail: 'test@gmail.com',
        },
      });
    });
  });

  describe('search', () => {
    it('should search with fuzziness and highlight', async () => {
      const mockResponse = {
        body: {
          hits: {
            hits: [
              {
                _id: 'doc-id',
                highlight: { content: ['<mark>text</mark>'] },
              },
            ],
          },
        },
      };

      mockClient.search.mockResolvedValue(mockResponse);

      const result = await service.search('text', 'test@gmail.com');

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'documents',
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                must: expect.arrayContaining([
                  expect.objectContaining({
                    match: expect.objectContaining({
                      content: expect.objectContaining({
                        fuzziness: 'AUTO',
                      }),
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );

      expect(result.hits[0]._id).toBe('doc-id');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document by id', async () => {
      mockClient.delete.mockResolvedValue({});

      await service.deleteDocument('doc-id');

      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'documents',
        id: 'doc-id',
      });
    });
  });
});