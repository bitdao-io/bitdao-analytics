import newConfigFromEnv from '../config';
import newConnections from '../connections';

import {uploadFile} from '../s3';
import {formatDate} from '../dateUtils';

import getBalances from '../getters/getBalances';
import getContributions from "../getters/getContributions";

const config = newConfigFromEnv();
const {s3, web3} = newConnections(config);

function writeToS3(name: string, func: Function) : Promise<string> {
    return func().then((resp: any) => {
        const json = JSON.stringify({success: true, body: resp});
        uploadFile(s3, config.s3.bucket, 'analytics/'+name+'.json', json);
        uploadFile(s3, config.s3.bucket, 'analytics/'+name+'-' + formatDate(new Date()) + '.json', json);
        return true;
    });
}

function print(func: Function) : Promise<string> {
    return func().then((resp: any) => {
        console.log("---");
        console.log(JSON.stringify(resp));
        return true;
    });
}

export default async function handler() {
    return Promise.all([
        writeToS3('balance', () => {
            return getBalances(web3, config.treasuryAddress);
        }),
        print(getContributions),
    ]);
}
