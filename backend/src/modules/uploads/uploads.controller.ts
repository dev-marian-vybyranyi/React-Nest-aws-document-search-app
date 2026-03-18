import { Controller, Get, Query } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('presigned-url')
  async getPresignedUrl(@Query('filename') filename: string) {
    return this.uploadsService.getPresignedUrl(filename);
  }
}
