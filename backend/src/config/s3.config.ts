import { S3Client } from '@aws-sdk/client-s3';
import { envConfigService } from './env-config.service';

export const s3Client = new S3Client({
    region: envConfigService.getAwsConfig().AWS_REGION,
    credentials: {
        accessKeyId: envConfigService.getAwsConfig().AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfigService.getAwsConfig().AWS_SECRET_ACCESS_KEY,
    },
});
