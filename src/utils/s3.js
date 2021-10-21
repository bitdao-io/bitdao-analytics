async function uploadFile(s3, bucketName, fileName, content) {
    var params = { Bucket: bucketName, Key: fileName, Body: content, ACL: 'private' };
    s3.putObject(params, function (err) {
        if (err) {
            console.log("Upload Error: " + err);
            return false;
        }
        console.log("Successfully uploaded data to " + bucketName + "/" + fileName);
        return true;
    });
}

module.exports = { uploadFile };
