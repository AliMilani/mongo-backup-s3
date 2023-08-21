export default {
    s3Endpoint: process.env.S3_ENDPOINT,
    s3BucketName: process.env.S3_BUCKET_NAME,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3Region: process.env.S3_REGION,
    mongoDBUri: process.env.MONGODB_URI,
    backupCron: process.env.BACKUP_CRON,
}