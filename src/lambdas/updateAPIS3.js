const config = require('../config').newFromEnv();
const conns = require('../connections')(config);

const getAnalyticsAPIJSON = require('../utils/getAnalyticsAPIJSON');
const { uploadFile } = require('../utils/s3');


function formatFilenameDate(date) {
    const pad = (n) => (n < 10 ? '0' : '') + n;

    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth()+1);
    const d = pad(date.getUTCDate());

    return y + '-' + m + '-' + d;
}

exports.handler = async function() {
    const writeJSONToS3 = (name, data) => uploadFile(conns.s3, config.aws.bucket, 'analytics/' + name+'.json', data);

    return getAnalyticsAPIJSON(config, conns).then(apiBody => {
        const json = JSON.stringify({
            success: true,
            message: null,
            body: apiBody,
        });

        writeJSONToS3('balance', json);
        writeJSONToS3(formatFilenameDate(new Date()) + '-balance', json);
    });
}
