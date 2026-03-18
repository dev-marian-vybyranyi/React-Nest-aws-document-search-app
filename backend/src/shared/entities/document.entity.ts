import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type DocumentStatus = 'pending' | 'success' | 'error';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userEmail: string;

  @Column()
  userFilename: string;

  @Column()
  s3Filename: string;

  @Column({ default: 'pending' })
  status: DocumentStatus;

  @CreateDateColumn()
  uploadedAt: Date;
}
