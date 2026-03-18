import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpensearchService } from './opensearch.service';
import { Client } from '@opensearch-project/opensearch';

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn().mockImplementation(() => ({})),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize OpenSearch client', () => {
    expect(service.client).toBeDefined();
    expect(Client).toHaveBeenCalled();
  });
});