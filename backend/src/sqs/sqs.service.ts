import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsDispatcher } from './sqs.dispatcher';

@Injectable()
export class SqsService implements OnModuleInit {
  private sqs: SQSClient;
  private readonly logger = new Logger(SqsService.name);
  private isPolling = false;

  constructor(
    private configService: ConfigService,
    private sqsDispatcher: SqsDispatcher,
  ) {
    this.sqs = new SQSClient({
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
        await this.sqsDispatcher.dispatch(message);

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
}
