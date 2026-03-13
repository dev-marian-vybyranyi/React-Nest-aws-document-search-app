import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpensearchService {
  private client: Client;
  private readonly index = 'documents';

  constructor(private configService: ConfigService) {
    this.client = new Client({
      node: this.configService.get('aws.opensearchEndpoint'),
      auth: {
        username: this.configService.get('opensearch.username')!,
        password: this.configService.get('opensearch.password')!,
      },
      ssl: { rejectUnauthorized: false },
    });
  }

  async indexDocument(documentId: string, content: string, userEmail: string) {
    await this.client.index({
      index: this.index,
      id: documentId,
      body: { content, userEmail },
    });
  }

  async search(query: string, userEmail: string) {
    const response = await this.client.search({
      index: this.index,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  content: {
                    query,
                    fuzziness: 'AUTO',
                  },
                },
              },
            ],
            filter: [{ term: { userEmail } }],
          },
        },
        highlight: {
          fields: { content: {} },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
      },
    });
    return response.body.hits;
  }

  async deleteDocument(documentId: string) {
    await this.client.delete({
      index: this.index,
      id: documentId,
    });
  }
}
