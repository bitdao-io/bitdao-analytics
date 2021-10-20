require("dotenv").config({ path: '.env' });

function validateConfig(conf) {
    // TODO: Add validation logic to ensure a minimum viable config is built
    return true;
}

function newFromEnv() {
    const conf = {
        displayPrecision: 3,
        treasuryAddress: process.env.BITDAO_ACCOUNT,
        web3RPCHost: process.env.MAIN_RPC_URL,
        aws: {
            bucket: process.env.AWS_BUCKET_NAME,
            accessKeyID: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    };

    if (!validateConfig(conf)) {
        return new Error("Invalid config");
    }

    return conf;
}

module.exports = {
    newFromEnv: newFromEnv,
};
