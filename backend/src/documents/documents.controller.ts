import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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
}
