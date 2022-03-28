// functions
function isLeapYear(y) {
	var year = Number(y);
	if (year % 100 === 0) {
		if (year % 400 === 0) return true;
		else return false;
	} else if (year % 4 === 0) return true;
	else return false;
}
function cycle() {
	var dateToday = new Date();

	// alter time for GMT +6
	dateToday.setTime(
		dateToday.getTime() + dateToday.getTimezoneOffset() * 60000 + 6 * 60 * 60000
	);

	var year = dateToday.getFullYear();
	var month = dateToday.getMonth();
	var date = dateToday.getDate();
	var yearStart, yearEnd, monthStart, monthEnd;

	// cycle calculator
	if (date < 13) {
		// second part
		if (month == 0) {
			// year junction
			yearStart = year - 1;
			yearEnd = year;
			monthStart = 11;
			monthEnd = month;
		} else {
			// no year junction
			yearStart = year;
			yearEnd = year;
			monthStart = month - 1;
			monthEnd = month;
		}
	} else {
		// first part
		if (month == 11) {
			// year junction
			yearStart = year;
			yearEnd = year + 1;
			monthStart = month;
			monthEnd = 0;
		} else {
			// no year junction
			yearStart = year;
			yearEnd = year;
			monthStart = month;
			monthEnd = month + 1;
		}
	}

	var startDate = new Date(yearStart, monthStart, 13);
	var endDate = new Date(yearEnd, monthEnd, 13);

	// alter time for GMT +6
	startDate.setTime(
		startDate.getTime() - startDate.getTimezoneOffset() * 60000 - 6 * 60 * 60000
	);
	endDate.setTime(
		endDate.getTime() - endDate.getTimezoneOffset() * 60000 - 6 * 60 * 60000
	);

	return {
		startDate: startDate.getTime(),
		endDate: endDate.getTime() - 1
	};
}
module.exports = {
	cycle: cycle,
	isLeapYear: isLeapYear
};
