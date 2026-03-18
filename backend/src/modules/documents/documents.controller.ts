import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService } from '../sse/sse.service';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly sseService: SseService,
  ) {}

  @Post()
  async createDocument(@Body() body: { userEmail: string; originalFilename: string; key: string }) {
    return this.documentsService.createDocument(body.userEmail, body.originalFilename, body.key);
  }

  @Get()
  async getDocuments(@Query('userEmail') userEmail: string) {
    return this.documentsService.findAllByUser(userEmail);
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') id: string,
    @Query('userEmail') userEmail: string,
  ) {
    await this.documentsService.deleteDocument(id, userEmail);
    return { success: true };
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('userEmail') userEmail: string,
  ) {
    return this.documentsService.searchDocuments(query, userEmail);
  }

  @Sse('events')
  sse(@Query('userEmail') userEmail: string): Observable<MessageEvent> {
    const subject = this.sseService.getOrCreateSubject(userEmail);
    return subject
      .asObservable()
      .pipe(map((data) => ({ data }) as MessageEvent));
  }
}
