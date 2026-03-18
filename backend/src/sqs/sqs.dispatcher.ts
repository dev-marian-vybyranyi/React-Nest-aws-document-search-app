import { Injectable, Logger } from '@nestjs/common';
import { DocumentUploadedHandler } from './handlers/document-uploaded.handler';

@Injectable()
export class SqsDispatcher {
  private readonly logger = new Logger(SqsDispatcher.name);

  constructor(
    private readonly documentUploadedHandler: DocumentUploadedHandler,
  ) {}

  async dispatch(message: any) {
    const payload = this.parseMessage(message);

    if (!payload) return;

    if (this.isS3DocumentEvent(payload)) {
      return this.documentUploadedHandler.handle(payload);
    }

    this.logger.warn('Unknown message type');
  }

  private parseMessage(message: any) {
    try {
      const body = JSON.parse(message.Body);
      return JSON.parse(body.Message || message.Body);
    } catch (error) {
      this.logger.error('Error parsing message body:', error);
      return null;
    }
  }

  private isS3DocumentEvent(payload: any): boolean {
    return (
      payload &&
      payload.Records &&
      payload.Records.length > 0 &&
      payload.Records[0].eventSource === 'aws:s3'
    );
  }
}
