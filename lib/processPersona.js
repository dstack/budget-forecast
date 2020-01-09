const { Account, Accounts } = require("./Account");
const { Income, Expense } = require("./Recurring");
const { Event } = require("./Event");

module.exports = function(persona) {
  let state = {
    accounts: new Accounts(),
    rec: [],
    events: []
  };

  if(persona.accounts) {
    persona.accounts.forEach((pacc) => {
      state.accounts.addAccount(new Account(pacc));
    });
  }
  else {
    state.accounts.addAccount(new Account());
  }

  if(persona.recurring){
    if(persona.recurring.incomes) {
      persona.recurring.incomes.forEach((inc) => {
        state.rec.push(new Income(inc));
      });
    }
    if(persona.recurring.expenses) {
      persona.recurring.expenses.forEach((exp) => {
        state.rec.push(new Expense(exp));
      });
    }
  }

  if(persona.events) {
    persona.events.forEach((evt) => {
      state.events.push(new Event(evt));
    });
  }

  return state;
}
