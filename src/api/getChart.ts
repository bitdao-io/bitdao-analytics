import {getJSON} from "../s3";
import {Chart} from "../models";
import {getExpectedContribution} from "../getters/getExpectedContribution";

function isTodayOrAfter(d: Date) {
    const today = new Date();
    const a = (d.getUTCFullYear() * 10000) + (d.getUTCMonth() * 100) + d.getUTCDate();
    const b = (today.getUTCFullYear() * 10000) + (today.getUTCMonth() * 100) + today.getUTCDate();
    return a >= b;
}

export default async function getChart(config: any, conns: any): Promise<Chart> {
    // Get current chart
    const chartJSON = (await getJSON(conns.s3, config.aws.bucket, "analytics/chart-100-day.json"));
    let chart = Object.assign(new Chart(), chartJSON);

    // Stop if the chart already has today
    if (isTodayOrAfter(new Date(chart.body.list[0].date))) {
        return new Chart();
    }

    // Get next contribution and add it to the front of the list
    const contribution = await getExpectedContribution();
    chart.body.list.unshift(contribution);

    // Trim list to max size
    if (chart.body.list.length > 100) {
        chart.body.list = chart.body.list.slice(0, 100);
    }

    return chart;
};
