import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpensearchService implements OnModuleInit {
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

  async onModuleInit() {
    await this.ensureIndex();
  }

  private async ensureIndex() {
    const exists = await this.client.indices.exists({ index: this.index });
    if (!exists.body) {
      await this.client.indices.create({
        index: this.index,
        body: {
          mappings: {
            properties: {
              content: { type: 'text' },
              userEmail: { type: 'keyword' },
            },
          },
        },
      });
    }
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
          fields: {
            content: {
              number_of_fragments: 3,
              fragment_size: 150,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
            },
          },
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
