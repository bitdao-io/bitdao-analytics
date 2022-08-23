import aws
    from 'aws-sdk';
import Web3
    from 'web3';
import {Config} from "./config";

export default function newConnections(config: Config) {
    const s3 = new aws.S3();

    if (config.s3.accessKeyID !== '' || config.s3.secretAccessKey !== ''){
        s3.config.update({
            accessKeyId: config.s3.accessKeyID,
            secretAccessKey: config.s3.secretAccessKey
        });
    }

    return {
        s3: s3,
        web3: new Web3(new Web3.providers.HttpProvider(config.web3RPCHost)),
    };
};
