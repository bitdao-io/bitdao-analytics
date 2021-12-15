import newConfigFromEnv from '../config';
import newConnections from '../connections';

import {uploadFile} from '../s3';
import {formatDate} from '../dateUtils';

import getBalances from '../getters/getBalances';
import getContributions from "../getters/getContributions";

const config = newConfigFromEnv();
const {s3, web3} = newConnections(config);

function run(name: string, func: Function) : Promise<string> {
    return func().then((resp: any) => {
        const json = JSON.stringify({success: true, body: resp});
        uploadFile(s3, config.s3.bucket, 'analytics/'+name+'.json', json);
        uploadFile(s3, config.s3.bucket, 'analytics/'+name+'-' + formatDate(new Date()) + '.json', json);
    });
}

export default async function handler() {
    return Promise.all([
        run('balance', () => {
            return getBalances(web3, config.treasuryAddress);
        }),
        run('contributions', getContributions),
    ]);
}
