const moment = require("moment");

const { CONFIG_DATE_FORMAT } = require('./const');

class Event {
  constructor(settings) {
    this.name = settings.name;
    this.ammt = settings.ammt || 0;
    this.date = moment(settings.date, CONFIG_DATE_FORMAT);
  }

  isToday(date) {
    return date.isSame(this.date, "day");
  }
}

module.exports = { Event };
