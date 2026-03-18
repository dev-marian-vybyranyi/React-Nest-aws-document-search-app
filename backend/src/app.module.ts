import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './shared/config/configuration';
import { Document } from './shared/entities/document.entity';
import { DocumentsModule } from './modules/documents/documents.module';
import { OpensearchModule } from './libs/opensearch/opensearch.module';
import { SqsModule } from './libs/sqs/sqs.module';
import { SseModule } from './modules/sse/sse.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [Document],
        synchronize: configService.get('database.sync'),
      }),
      inject: [ConfigService],
    }),
    SseModule,
    OpensearchModule,
    DocumentsModule,
    SqsModule,
    UploadsModule,
  ],
})
export class AppModule {}

