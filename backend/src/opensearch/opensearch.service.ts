import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpensearchService {
  public readonly client: Client;

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
}
