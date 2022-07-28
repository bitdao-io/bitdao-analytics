import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const dateFormat = 'YYYY-MM-DD'

class TimeRange {
    start: number
    end: number
}

function DateEndTime(formattedDate: string): number {
    return ParseDate(formattedDate).endOf('day').unix() * 1000
}

function DateTimeRange(formattedDate: string): TimeRange {
    const date = ParseDate(formattedDate)
    let timeRange = new TimeRange()
    timeRange.start = date.startOf('day').unix() * 1000
    timeRange.end = date.endOf('day').unix() * 1000
    return timeRange
}

function WrapNumber(amount: number): string {
    return amount.toString(10)
}

function FormatDate(d: Date): string {
    return dayjs(d).utc().format(dateFormat)
}

function ParseDate(formattedDate: string): dayjs.Dayjs {
    return dayjs.utc(formattedDate, dateFormat)
}

export {DateEndTime, DateTimeRange, FormatDate, ParseDate, WrapNumber}
