import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable } from '@nestjs/common';
import { envConfigService } from 'src/config/env-config.service';
import { s3Client } from 'src/config/s3.config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
    private s3: S3Client;
    private bucketName: string;

    constructor() {
        this.s3 = s3Client;
        this.bucketName = envConfigService.getAwsConfig().AWS_S3_BUCKET;
    }

    /** Upload a single file */
    async uploadFile(
        file: Express.Multer.File,
        subfolder: string = '',
    ): Promise<string> {
        if (!file || !file.buffer) {
            throw new Error('Invalid file uploaded');
        }

        const fileName = `${uuidv4()}-${file.originalname}`;
        const filePath = `parking-go/${subfolder ? `${subfolder}/` : ''}${fileName}`;

        const upload = new Upload({
            client: this.s3,
            params: {
                Bucket: this.bucketName,
                Key: filePath,
                Body: file.buffer,
                ContentType: file.mimetype,
            },
        });

        await upload.done();
        return `https://${this.bucketName}.s3.${envConfigService.getAwsConfig().AWS_REGION}.amazonaws.com/${filePath}`;
    }

    /** Upload multiple files */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        subfolder: string = '',
    ): Promise<string[]> {
        if (!files || files.length === 0) {
            throw new Error('No files uploaded');
        }

        const uploadPromises = files.map((file) =>
            this.uploadFile(file, subfolder),
        );
        return Promise.all(uploadPromises);
    }

    /** Delete a single file from S3 */
    async deleteFile(filePath: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: this.formatLink(filePath),
        });

        await this.s3.send(command);
    }

    /** Delete multiple files from S3 */
    async deleteMultipleFiles(filePaths: string[]): Promise<void> {
        if (!filePaths || filePaths.length === 0) {
            throw new Error('No files provided for deletion');
        }

        const command = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
                Objects: filePaths.map((filePath) => ({
                    Key: this.formatLink(filePath),
                })),
            },
        });

        await this.s3.send(command);
    }

    formatLink(link: string) {
        return link.split('.amazonaws.com/')[1];
    }
}
