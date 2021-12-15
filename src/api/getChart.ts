import {Chart} from "../models";
import {
    getContributionsForHistoricalVolumes
} from "../getters/getExpectedContribution";

export default async function getChart(_config: any, _conns: any): Promise<Chart> {
    let chartBody = new Chart();
    chartBody.list = await getContributionsForHistoricalVolumes();
    return chartBody;
};
