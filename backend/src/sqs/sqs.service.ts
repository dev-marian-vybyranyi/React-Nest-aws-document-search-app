import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { Document } from '../database/entities/document.entity';
import { DocumentsService } from '../documents/documents.service';
import { OpensearchService } from '../opensearch/opensearch.service';

@Injectable()
export class SqsService implements OnModuleInit {
  private sqs: SQSClient;
  private s3: S3Client;
  private readonly logger = new Logger(SqsService.name);
  private isPolling = false;

  constructor(
    private configService: ConfigService,
    private documentsService: DocumentsService,
    private opensearchService: OpensearchService,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {
    this.sqs = new SQSClient({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId')!,
        secretAccessKey: this.configService.get('aws.secretAccessKey')!,
      },
    });

    this.s3 = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId')!,
        secretAccessKey: this.configService.get('aws.secretAccessKey')!,
      },
    });
  }

  onModuleInit() {
    this.startPolling();
  }

  private async startPolling() {
    this.isPolling = true;
    this.logger.log('SQS polling started...');

    while (this.isPolling) {
      await this.pollMessages();
    }
  }

  private async pollMessages() {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.configService.get('aws.sqsQueueUrl'),
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 20,
      });

      const response = await this.sqs.send(command);

      if (!response.Messages?.length) return;

      for (const message of response.Messages) {
        await this.processMessage(message);

        await this.sqs.send(
          new DeleteMessageCommand({
            QueueUrl: this.configService.get('aws.sqsQueueUrl'),
            ReceiptHandle: message.ReceiptHandle,
          }),
        );
      }
    } catch (error) {
      this.logger.error('SQS polling error:', error);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  private async processMessage(message: any) {
    try {
      const body = JSON.parse(message.Body);
      const s3Event = JSON.parse(body.Message || message.Body);

      if (!s3Event.Records) return;

      for (const record of s3Event.Records) {
        const s3Filename = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, ' '),
        );
        await this.processFile(s3Filename);
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
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
      }

      const document = await this.documentsRepository.findOne({
        where: { s3Filename },
      });

      if (!document) {
        this.logger.warn(`Document not found for s3Filename: ${s3Filename}`);
        return;
      }

      await this.opensearchService.indexDocument(
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
