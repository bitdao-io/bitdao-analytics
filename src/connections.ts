import aws from 'aws-sdk';
import Web3 from 'web3';
import {newConfigFromEnv} from "./config";

export function newConnections(config:any) {
    const s3 = new aws.S3();
    s3.config.update({ accessKeyId: config.aws.accessKeyID, secretAccessKey: config.aws.secretAccessKey });

    return {
        s3: s3,
        web3: new Web3(new Web3.providers.HttpProvider(config.web3RPCHost)),
    };
};


export default {
    newConnections,
};
