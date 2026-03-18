import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import WordExtractor from 'word-extractor';
import { Document } from '../../database/entities/document.entity';
import { DocumentsService } from '../../documents/documents.service';
import { DocumentsOpensearchRepository } from '../../opensearch/documents-opensearch.repository';

@Injectable()
export class DocumentUploadedHandler {
  private s3: S3Client;
  private readonly logger = new Logger(DocumentUploadedHandler.name);

  constructor(
    private configService: ConfigService,
    private documentsService: DocumentsService,
    private opensearchRepository: DocumentsOpensearchRepository,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId')!,
        secretAccessKey: this.configService.get('aws.secretAccessKey')!,
      },
    });
  }

  async handle(payload: any) {
    if (!payload.Records) return;

    for (const record of payload.Records) {
      if (!record.s3) continue;
      const s3Filename = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' '),
      );
      await this.processFile(s3Filename);
    }
  }

  private async processFile(s3Filename: string) {
    this.logger.log(`Processing file: ${s3Filename}`);

    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.configService.get('aws.s3Bucket'),
        Key: s3Filename,
      });

      const s3Response = await this.s3.send(getCommand);
      const buffer = await this.streamToBuffer(s3Response.Body as Readable);

      let text = '';
      if (s3Filename.endsWith('.pdf')) {
        const pdf = new PDFParse({ data: buffer });
        const parsed = await pdf.getText();
        text = parsed.text;
      } else if (s3Filename.endsWith('.docx')) {
        const parsed = await mammoth.extractRawText({ buffer });
        text = parsed.value;
      } else if (s3Filename.endsWith('.doc')) {
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(buffer);
        text = extracted.getBody();
      }

      const document = await this.documentsRepository.findOne({
        where: { s3Filename },
      });

      if (!document) {
        this.logger.warn(`Document not found for s3Filename: ${s3Filename}`);
        return;
      }

      await this.opensearchRepository.indexDocument(
        document.id,
        text,
        document.userEmail,
      );

      await this.documentsService.updateStatus(s3Filename, 'success');
      this.logger.log(`Successfully indexed: ${s3Filename}`);
    } catch (error) {
      this.logger.error(`Error processing file ${s3Filename}:`, error);
      await this.documentsService.updateStatus(s3Filename, 'error');
    }
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
