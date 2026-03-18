import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../database/entities/document.entity';
import { DocumentsOpensearchRepository } from '../opensearch/documents-opensearch.repository';
import { SearchDocumentsPayload } from '../opensearch/interfaces/opensearch-payloads.interface';
import { SseService } from '../sse/sse.service';

@Injectable()
export class DocumentsService {
  private s3: S3Client;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private configService: ConfigService,
    private opensearchRepository: DocumentsOpensearchRepository,
    private sseService: SseService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId')!,
        secretAccessKey: this.configService.get('aws.secretAccessKey')!,
      },
    });
  }

  async createDocument(userEmail: string, originalFilename: string, key: string) {
    if (!key.startsWith('tmp/')) {
        throw new BadRequestException('Invalid temporary file key');
    }

    const bucket = this.configService.get('aws.s3Bucket');
    const s3Filename = key.replace('tmp/', '');

    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }));

      await this.s3.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: s3Filename,
      }));

      await this.s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
    } catch (e) {
      throw new BadRequestException('Invalid or missing uploaded file in temporary storage');
    }

    const document = this.documentsRepository.create({
      userEmail,
      userFilename: originalFilename,
      s3Filename,
      status: 'pending',
    });

    await this.documentsRepository.save(document);
    return { documentId: document.id, s3Filename };
  }

  async findAllByUser(userEmail: string) {
    return this.documentsRepository.find({
      where: { userEmail },
      order: { uploadedAt: 'DESC' },
    });
  }

  async updateStatus(s3Filename: string, status: 'success' | 'error') {
    const document = await this.documentsRepository.findOne({
      where: { s3Filename },
    });
    if (!document) return;

    document.status = status;
    await this.documentsRepository.save(document);

    this.sseService.emit(document.userEmail, {
      documentId: document.id,
      status,
    });
  }

  async deleteDocument(id: string, userEmail: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, userEmail },
    });
    if (!document) throw new Error('Document not found');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.configService.get('aws.s3Bucket'),
        Key: document.s3Filename,
      }),
    );

    try {
      await this.opensearchRepository.deleteDocument(id);
    } catch (e) {}

    await this.documentsRepository.remove(document);
  }

  async searchDocuments(query: string, userEmail: string) {
    const payload: SearchDocumentsPayload = { query, userEmail };
    const hits = await this.opensearchRepository.search(payload);
    const ids = hits.hits.map((h: any) => h._id);

    const documents = await this.documentsRepository.findByIds(ids);

    return hits.hits.map((hit: any) => {
      const doc = documents.find((d) => d.id === hit._id);
      const highlights = hit.highlight?.content ?? [];

      return {
        id: hit._id,
        userFilename: doc?.userFilename,
        uploadedAt: doc?.uploadedAt,
        highlight: highlights.join(' ... <br>'),
      };
    });
  }
}
