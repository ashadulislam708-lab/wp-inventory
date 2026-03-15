import { Injectable } from '@nestjs/common';

/**
 * S3Service stub - not used in Glam Lavish.
 * Kept to avoid import errors from infrastructure module.
 */
@Injectable()
export class S3Service {
    uploadFile(_file: any, _subfolder?: string): Promise<string> {
        throw new Error('S3 not configured for Glam Lavish');
    }

    deleteFile(_filePath: string): Promise<void> {
        throw new Error('S3 not configured for Glam Lavish');
    }
}
