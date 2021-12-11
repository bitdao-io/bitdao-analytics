import {ChartBody} from "../models";
import {
    getContributionsForHistoricalVolumes
} from "../getters/getExpectedContribution";
a
exqport default async function getChart(config: any, conns: any): Promise<ChartBody> {
    let chartBody = new ChartBody();
    chartBody.list = await getContributionsForHistoricalVolumes();
    return chartBody;
};
qq
