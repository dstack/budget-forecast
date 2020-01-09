const Vorpal = require("vorpal");
const fsAutocomplete = require("vorpal-autocomplete-fs");
const chalk = Vorpal().chalk;

const moment = require("moment");
const Table = require("cli-table");

const { DISPLAY_DATE_FORMAT } = require("./lib/const");
const formatUSD = require("./lib/formatUSD");
const loadYML = require("./lib/loadYML");
const processPersona = require("./lib/processPersona");

const emptyState = {
  persona: false,
  personaFile: "",
  outstandingExp: []
};

let state = Object.assign({}, emptyState);

function newState() {
  state = Object.assign({}, emptyState);
}

function resetState() {
  let tmpPersona = state.persona;
  if(tmpPersona) {
    Object.assign(state, {persona: tmpPersona}, processPersona(tmpPersona))
  }
  else {
    newState();
  }
}

const vorpalInst = Vorpal();

vorpalInst
  .command("load <personaFile>", "Load a Financial Persona (relative to CWD)")
  .alias("l")
  .autocomplete(fsAutocomplete())
  .action(function(args, cb){
    let filename = args.personaFile;
    loadYML(filename)
      .then((persona) => {
        newState();
        state.personaFile = filename;
        state.persona = persona;
        resetState();
        this.log(`Loaded: ${state.persona.name}`)
        cb();
      })
      .catch((err) => {
        this.log(err);
        cb();
      })
  });

vorpalInst
  .command("reload", "Reload the current persona file")
  .alias("r")
  .action(function(args, cb){
    if(!state.persona) {
      this.log(`You must load a persona first.  Use "load <personaFile>".`);
      cb();
    }
    else {
      let filename = state.personaFile;
      loadYML(filename)
        .then((persona) => {
          newState();
          state.personaFile = filename;
          state.persona = persona;
          resetState();
          this.log(`Reloaded: ${state.persona.name}`)
          cb();
        })
        .catch((err) => {
          this.log(err);
          cb();
        })
    }
  });

vorpalInst
  .command("state")
  .action(function(args, cb){
    this.log(state);
    cb();
  });

vorpalInst
  .command("iterate [days]", "Iterates over the current persona, and shows a table.")
  .alias("i")
  .action(function(args, cb) {
    if(!state.persona) {
      this.log(`You must load a persona first.  Use "load <personaFile>".`);
      cb();
    }
    else {
      resetState();
      let times = args.days || 45;
      const headers = [" ", "Date"];
      const colWidths = [5, 20];
      state.accounts.accountNames().forEach((name) => {
        headers.push(name);
        colWidths.push(16);
      });
      headers.push("L. Net Worth");
      colWidths.push(12);

      headers.push("Paid");
      colWidths.push(60);
      const outTable = new Table({
        head: headers,
        colWidths: colWidths
      });

      const date = moment();
      date.millisecond(0);
      date.second(0);
      date.minute(0);
      date.hour(12);

      for(var i =0; i <= times; i++) {
        let payday = false;
        let paid = [];
        date.add((i > 0? 1 : 0), "d");

        // process events for today
        state.events = state.events.map((evt, indx) => {
          if(evt.isToday(date)){
            if(evt.ammt > 0){
              state.accounts.distribute(evt.dist, evt.ammt);
              paid.push(chalk.green(evt.name));
            }
            else {
              evt.dueDate = moment(date);
              state.outstandingExp.push(evt);
            }
            return false;
          }
          return evt;
        });
        state.events = state.events.filter((item) => { return !!item; });

        // take income, find bills
        state.rec.forEach((rt) => {
          if(rt.isDue(date)) {
            if(rt.income){
              state.accounts.distribute(rt.dist, rt.ammt);
              payday = true;
              paid.push(chalk.green(rt.desc));
            }
            else {
              rt.dueDate = moment(date);
              state.outstandingExp.push(rt);
            }
          }
        });

        // take daily first
        state.accounts.pay(state.persona.dailyBudget);

        // attempt to make payments
        state.outstandingExp = state.outstandingExp.map((exp, index) => {
          let payment = Math.abs(exp.ammt);
          let floatable = false;
          if(exp.canFloat) {
            const lastDay = moment(exp.dueDate).add(exp.canFloat, "days");
            if(date.isSameOrBefore(lastDay)) {
              floatable = true;
            }
          }
          if(
              state.accounts.canPay(payment) ||
              !floatable
            ) {
            state.accounts.pay(Math.abs(payment));
            paid.push(exp.name ? exp.name : exp.desc);
            return false;
          }
        });
        state.outstandingExp = state.outstandingExp.filter((item) => { return !!item; });

        // output table
        const statRow = [i, chalk[payday? "green" : "grey"](date.format(DISPLAY_DATE_FORMAT))];
        state.accounts.acctList.forEach((acct) => {
          const check = acct.thresholdCheck();
          const color = check < 1 ? "red" : (check <= 1.25 ? "yellow" : "grey");
          statRow.push(chalk[color](formatUSD(acct.balance)));
        });
        statRow.push(formatUSD(state.accounts.liquidNetWorth()));
        statRow.push(paid.join(", "))
        outTable.push(statRow);
      }

      this.log(outTable.toString())
      cb();
    }
  })

vorpalInst
  .delimiter("CFA$")
  .show();
