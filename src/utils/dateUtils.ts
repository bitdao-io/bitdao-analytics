/**
 * Get Year.
 * @returns full year
 */
function getYear(): string {
    const myDate = new Date();
    return myDate.getFullYear().toString(10);
}


/**
 * Get month.
 */
function getMonth(): string {
    const myDate = new Date();
    let month = myDate.getMonth() + 1;
    if (month <= 9) {
        return '0' + month;
    }
    return month.toString(10);
}


/**
 * Get current day.
 */
function getDay(): string {
    const myDate = new Date();
    let day = myDate.getDate();
    if (day <= 9) {
        return '0' + day;
    }
    return day.toString(10);
}


function getToday() {
    const year = getYear();
    const month = getMonth();
    const day = getDay();
    return year + "-" + month + "-" + day;
}


export function formatDate(date: Date) {
    const pad = (n: number) => (n < 10 ? '0' : '') + n;

    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());

    return y + '-' + m + '-' + d;
}

export default {
    getYear,
    getMonth,
    getDay,
    getToday,
    formatDate
}
