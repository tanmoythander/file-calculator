function now() {
	return new Date().getTime();
}

function today() {
	var now = new Date();
	var today = now.getTime();
	var offset = now.getTimezoneOffset() * 60 * 1000;
	today -= (today - offset) % (24 * 60 * 60 * 1000);
	return today;
}

function thatDay(millis) {
	// string value safety
	if (typeof millis === 'string') {
		if (!isNaN(parseInt(millis))) {
			millis = parseInt(millis);
		} else {
			return false;
		}
	}

	var thatDay = millis;
	var offset = new Date(millis).getTimezoneOffset() * 60 * 1000;
	thatDay -= (thatDay - offset) % (24 * 60 * 60 * 1000);
	return thatDay;
}

function jsToMysql(dateString, dateOnly) {
	var dateTime;
	if (dateString) {
		dateTime = new Date(dateString);
	} else {
		dateTime = new Date();
	}
	var yyyy = dateTime.getFullYear().toString();
	var mm = dateTime.getMonth() + 1;
	if (mm < 10) {
		mm = '0' + mm.toString();
	} else {
		mm = mm.toString();
	}
	var dd = dateTime.getDate();
	if (dd < 10) {
		dd = '0' + dd.toString();
	} else {
		dd = dd.toString();
	}
	var hh = dateTime.getHours();
	if (hh < 10) {
		hh = '0' + hh.toString();
	} else {
		hh = hh.toString();
	}
	var mmm = dateTime.getMinutes();
	if (mmm < 10) {
		mmm = '0' + mmm.toString();
	} else {
		mmm = mmm.toString();
	}
	var ss = dateTime.getSeconds();
	if (ss < 10) {
		ss = '0' + ss.toString();
	} else {
		ss = ss.toString();
	}
	if (dateOnly) {
		return yyyy + '-' + mm + '-' + dd;
	} else {
		return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mmm + ':' + ss;
	}
}

function jsToMysqlOneYear(dateString, dateOnly) {
	var dateTime;
	if (dateString) {
		dateTime = new Date(dateString);
	} else {
		dateTime = new Date();
	}
	var yyyy = (dateTime.getFullYear() + 1).toString();
	var mm = dateTime.getMonth() + 1;
	if (mm < 10) {
		mm = '0' + mm.toString();
	} else {
		mm = mm.toString();
	}
	var dd = dateTime.getDate();
	if (dd < 10) {
		dd = '0' + dd.toString();
	} else {
		dd = dd.toString();
	}
	var hh = dateTime.getHours();
	if (hh < 10) {
		hh = '0' + hh.toString();
	} else {
		hh = hh.toString();
	}
	var mmm = dateTime.getMinutes();
	if (mmm < 10) {
		mmm = '0' + mmm.toString();
	} else {
		mmm = mmm.toString();
	}
	var ss = dateTime.getSeconds();
	if (ss < 10) {
		ss = '0' + ss.toString();
	} else {
		ss = ss.toString();
	}
	if (dateOnly) {
		return yyyy + '-' + mm + '-' + dd;
	} else {
		return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mmm + ':' + ss;
	}
}

function ddmmmyyyy(millis) {
	// string value safety
	if (typeof millis === 'string') {
		if (!isNaN(parseInt(millis))) {
			millis = parseInt(millis);
		} else {
			return false;
		}
	}

	var dateObj = new Date(millis);
	var date = dateObj.getDate();
	var year = dateObj.getFullYear();
	var month = ' ';

	switch (dateObj.getMonth()) {
		case 0:
			month = ' Jan ';
			break;
		case 1:
			month = ' Feb ';
			break;
		case 2:
			month = ' Mar ';
			break;
		case 3:
			month = ' Apr ';
			break;
		case 4:
			month = ' May ';
			break;
		case 5:
			month = ' Jun ';
			break;
		case 6:
			month = ' Jul ';
			break;
		case 7:
			month = ' Aug ';
			break;
		case 8:
			month = ' Sep ';
			break;
		case 9:
			month = ' Oct ';
			break;
		case 10:
			month = ' Nov ';
			break;
		case 11:
			month = ' Dec ';
	}
	return (date < 10 ? '0' : '') + date + month + year;
}

function toTimeString(seconds) {
	var sec = seconds % 60;
	seconds -= sec;
	var min = seconds / 60;
	var temp = min;
	min %= 60;
	var hour = (temp - min) / 60;

	var str = '';
	if (hour > 0) {
		str += hour;
		str += ' hour';
		if (hour > 1) str += 's';
		if (min > 0 || sec > 0) str += ', ';
	}
	if (min > 0) {
		str += min;
		str += ' minute';
		if (min > 1) str += 's';
		if (sec > 0) str += ', ';
	}
	if (sec > 0) {
		str += sec;
		str += ' second';
		if (sec > 1) str += 's';
	}
	return str;
}

module.exports = {
	now: now,
	today: today,
	thatDay: thatDay,
	jsToMysql: jsToMysql,
	jsToMysqlOneYear: jsToMysqlOneYear,
	ddmmmyyyy: ddmmmyyyy,
	toTimeString: toTimeString
};
