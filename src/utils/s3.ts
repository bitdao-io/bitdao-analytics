import S3 from "aws-sdk/clients/s3";

async function uploadFile(s3:S3, bucketName:string, fileName:string, content:string) : Promise<string> {
    return (await s3.putObject({
        Bucket: bucketName,
        Key: fileName,
        Body: content,
        ACL: 'public-read'
    }).promise()).VersionId;
}

async function getFile(s3:S3, bucketName:string, fileName:string): Promise<string> {
    return  (await s3.getObject({
        Bucket: bucketName,
        Key: fileName
    }).promise()).Body.toString();
}

async function getJSON(s3:S3, bucketName:string, fileName:string) : Promise<object>{
    const file = await getFile(s3, bucketName, fileName);
    return JSON.parse(file);
}

export {
    uploadFile,
    getFile,
    getJSON
};
