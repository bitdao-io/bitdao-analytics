const dateUtils = {
    /**
     * Get Year.
     * @returns full year
     */
    getYear: function () {
        const myDate = new Date();
        const year = myDate.getFullYear();
        return year;
    },
    /**
     * Get month.
     */
    getMonth: function () {
        const myDate = new Date();
        let month = myDate.getMonth() + 1;
        if (month <= 9) {
            month = '0' + month;
        }
        return month;
    },
    /**
     * Get current day.
     */
    getDay: function () {
        const myDate = new Date();
        let day = myDate.getDate();
        if (day <= 9) {
            day = '0' + day;
        }
        return day;
    },
    getToday: function () {
        const year = dateUtils.getYear();
        const month = dateUtils.getMonth();
        const day = dateUtils.getDay();
        return year + "-" + month + "-" + day;
    }
}

module.exports = {
    getYear: dateUtils.getYear,
    getMonth: dateUtils.getMonth,
    getDay: dateUtils.getDay,
    getToday: dateUtils.getToday
}