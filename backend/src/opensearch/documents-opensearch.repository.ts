import { Injectable, OnModuleInit } from '@nestjs/common';
import { OpensearchService } from './opensearch.service';

@Injectable()
export class DocumentsOpensearchRepository implements OnModuleInit {
  private readonly index = 'documents';

  constructor(private readonly opensearchService: OpensearchService) {}

  async onModuleInit() {
    await this.ensureIndex();
  }

  private async ensureIndex() {
    const exists = await this.opensearchService.client.indices.exists({
      index: this.index,
    });
    if (!exists.body) {
      await this.opensearchService.client.indices.create({
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
    await this.opensearchService.client.index({
      index: this.index,
      id: documentId,
      body: { content, userEmail },
    });
  }

  async search(query: string, userEmail: string) {
    const response = await this.opensearchService.client.search({
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
    await this.opensearchService.client.delete({
      index: this.index,
      id: documentId,
    });
  }
}
