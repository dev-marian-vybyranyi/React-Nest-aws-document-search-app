import { Injectable, OnModuleInit } from '@nestjs/common';
import { OpensearchService } from './opensearch.service';
import {
  IndexDocumentPayload,
  SearchDocumentsPayload,
} from './interfaces/opensearch-payloads.interface';

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

  async indexDocument(payload: IndexDocumentPayload) {
    const { id, content, userEmail } = payload;
    await this.opensearchService.client.index({
      index: this.index,
      id,
      body: { content, userEmail },
    });
  }

  async search(payload: SearchDocumentsPayload) {
    const { query, userEmail } = payload;
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
