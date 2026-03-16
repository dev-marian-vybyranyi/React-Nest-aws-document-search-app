import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../database/entities/document.entity';
import { DocumentsModule } from '../documents/documents.module';
import { OpensearchModule } from '../opensearch/opensearch.module';
import { SqsService } from './sqs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    DocumentsModule,
    OpensearchModule,
  ],
  providers: [SqsService],
})
export class SqsModule {}
