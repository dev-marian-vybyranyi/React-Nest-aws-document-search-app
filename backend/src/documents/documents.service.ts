import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../database/entities/document.entity';
import { OpensearchService } from '../opensearch/opensearch.service';
import { SseService } from '../sse/sse.service';

@Injectable()
export class DocumentsService {
  private s3: S3Client;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private configService: ConfigService,
    private opensearchService: OpensearchService,
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

  async getPresignedUrl(userEmail: string, originalFilename: string) {
    const ext = originalFilename.split('.').pop();
    const s3Filename = `${uuidv4()}.${ext}`;
    const bucket = this.configService.get('aws.s3Bucket');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Filename,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    const document = this.documentsRepository.create({
      userEmail,
      userFilename: originalFilename,
      s3Filename,
      status: 'pending',
    });

    await this.documentsRepository.save(document);
    return { url, documentId: document.id, s3Filename };
  }

  async findAllByUser(userEmail: string) {
    return this.documentsRepository.find({
      where: { userEmail },
      order: { uploadedAt: 'DESC' },
    });
  }
}
