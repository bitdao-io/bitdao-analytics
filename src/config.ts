require("dotenv").config({ path: '.env' });

export function newConfigFromEnv() {
    return {
        displayPrecision: 3,
        treasuryAddress: process.env.BITDAO_ACCOUNT,
        web3RPCHost: process.env.MAIN_RPC_URL,
        aws: {
            bucket: process.env.AWS_BUCKET_NAME,
            accessKeyID: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    };
}

export default {
     newConfigFromEnv,
};
