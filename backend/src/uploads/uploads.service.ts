import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId')!,
        secretAccessKey: this.configService.get('aws.secretAccessKey')!,
      },
    });
  }

  async getPresignedUrl(originalFilename: string) {
    if (!originalFilename) {
      throw new BadRequestException('Filename is required');
    }

    const ext = originalFilename.split('.').pop();
    const s3Filename = `tmp/${uuidv4()}.${ext}`;
    const bucket = this.configService.get('aws.s3Bucket');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Filename,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 86400 });

    return { url, key: s3Filename };
  }
}
