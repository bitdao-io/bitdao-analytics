require("dotenv").config({ path: '../../.env' });
// Load the SDK
var AWS = require('aws-sdk');

// Create an S3 client
var s3 = new AWS.S3();
s3.config.update({ accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY });

let bucketName = process.env.BUCKET_NAME;

async function uploadFile(fileName, content) {
    var params = { Bucket: bucketName, Key: fileName, Body: content, ACL: 'public-read' }
    s3.putObject(params, function (err, data) {
        if (err) {
            console.log(err)
            return false;
        }
        console.log("Successfully uploaded data to " + bucketName + "/" + fileName);
        return true;
    });
}

module.exports = {
    uploadFile: uploadFile
}
