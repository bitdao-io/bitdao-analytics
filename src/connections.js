const aws = require('aws-sdk');
const web3 = require('web3');

module.exports = (conf) => {
    const s3 = new aws.S3();
    s3.config.update({ accessKeyId: conf.aws.accessKeyID, secretAccessKey: conf.aws.secretAccessKey });

    return {
        s3: s3,
        web3: new web3(new web3.providers.HttpProvider(conf.web3RPCHost)),
    };
};
