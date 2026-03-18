import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsOpensearchRepository } from './documents-opensearch.repository';
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

const mockOpensearchService = {
  client: mockClient,
};

describe('DocumentsOpensearchRepository', () => {
  let repository: DocumentsOpensearchRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsOpensearchRepository,
        { provide: OpensearchService, useValue: mockOpensearchService },
      ],
    }).compile();

    repository = module.get<DocumentsOpensearchRepository>(
      DocumentsOpensearchRepository,
    );
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create index if it does not exist', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: false });
      mockClient.indices.create.mockResolvedValue({});

      await repository.onModuleInit();

      expect(mockClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'documents' }),
      );
    });

    it('should not create index if it already exists', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: true });

      await repository.onModuleInit();

      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('indexDocument', () => {
    it('should index document with correct data', async () => {
      mockClient.index.mockResolvedValue({});

      await repository.indexDocument(
        'doc-id',
        'some text content',
        'test@gmail.com',
      );

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

      const result = await repository.search('text', 'test@gmail.com');

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

      await repository.deleteDocument('doc-id');

      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'documents',
        id: 'doc-id',
      });
    });
  });
});
