import { Module } from '@nestjs/common';
import { OpensearchService } from './opensearch.service';
import { DocumentsOpensearchRepository } from './documents-opensearch.repository';

@Module({
  providers: [OpensearchService, DocumentsOpensearchRepository],
  exports: [OpensearchService, DocumentsOpensearchRepository],
})
export class OpensearchModule {}
