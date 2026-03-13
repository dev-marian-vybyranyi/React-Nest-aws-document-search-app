import { Body, Controller, Post } from '@nestjs/common';
import { SseService } from '../sse/sse.service';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly sseService: SseService,
  ) {}

  @Post('presigned-url')
  async getPresignedUrl(@Body() body: { userEmail: string; filename: string }) {
    return this.documentsService.getPresignedUrl(body.userEmail, body.filename);
  }
}
