const moment = require("moment")

const { RECURRING_TYPES, CONFIG_DATE_FORMAT } = require('./const');

class Recurring {
  constructor(settings) {
    this.type = Object.values(RECURRING_TYPES).indexOf(settings.type) > -1 ? settings.type : RECURRING_TYPES.monthly;
    this.startDate = settings.startDate? moment(settings.startDate, CONFIG_DATE_FORMAT) : false;
    this.endDate = settings.endDate? moment(settings.endDate, CONFIG_DATE_FORMAT) : false;
    this.ammt = settings.ammt || 0;
    this.date = settings.date || 1;
    this.desc = settings.desc || "";
  }

  isDue(date) {
    let due = false;
    if(
      (this.startDate && date.isBefore(this.startDate)) ||
      (this.endDate && date.isAfter(this.endDate))
    ) {
      return due;
    }
    if(this.type == RECURRING_TYPES.biWeekly && this.startDate) {
      const diff = date.diff(this.startDate);
      this.daysSinceStart = Math.floor(moment.duration(diff).asDays());
      due = date.isSameOrAfter(this.startDate) && this.daysSinceStart % 14 == 0;
    }
    else if(this.type == RECURRING_TYPES.firstAndFifteenth) {
      due = date.date() == 1 || date.date() == 15;
    }
    else if(this.type == RECURRING_TYPES.monthly && this.startDate) {
      due = date.isSameOrAfter(this.startDate) && date.date() == this.startDate.date();
    }
    return due;
  }
}

class Income extends Recurring {
  constructor(opts){
    super(opts);
    this.income = true;
    if(this.type == RECURRING_TYPES.biWeekly) {
      this.recurrenceInc = 0;
    }
    if(opts.dist){
      this.dist = opts.dist;
    }
  }

  isPayDay(date) {
    return thios.isDue(date);
  }
}

class Expense extends Recurring {
  constructor(opts){
    super(opts);
    this.canFloat = opts.canFloat || false;
    if(this.type == RECURRING_TYPES.biWeekly) {
      this.recurrenceInc = 0;
    }
  }
}

module.exports = { Income, Expense };
