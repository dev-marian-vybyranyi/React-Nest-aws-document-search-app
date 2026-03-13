import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from '../database/entities/document.entity';
import { OpensearchModule } from '../opensearch/opensearch.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), OpensearchModule, SseModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
