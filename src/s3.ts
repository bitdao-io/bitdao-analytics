import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'

async function uploadFile(
    s3: S3Client,
    bucketName: string,
    fileName: string,
    content: string
) {
    return s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: content,
            ContentType: 'application/json',
            ACL: 'public-read',
            CacheControl: '300'
        })
    )
}

async function getJSON(
    s3: S3Client,
    bucketName: string,
    fileName: string
): Promise<object> {
    const file = await getFile(s3, bucketName, fileName)
    return JSON.parse(file)
}

async function getFile(
    s3: S3Client,
    bucketName: string,
    fileName: string
): Promise<string> {
    const output = await s3.send(
        new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName
        })
    )

    return output.Body.toString()
}

export {uploadFile, getJSON}
