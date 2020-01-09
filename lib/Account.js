const { ACCOUNT_TYPES } = require("./const");

class Account {
  constructor(settings){
    this.type = Object.values(ACCOUNT_TYPES).indexOf(settings.type) > -1 ? settings.type : ACCOUNT_TYPES.checking;
    this.name = settings.name || `*** (${this.type})`;
    this.balance = settings.balance;
    this.threshold = settings.threshold || 1;
    this.default = settings.default || false;
    this.liquid = this.type != ACCOUNT_TYPES.retirement && this.type != ACCOUNT_TYPES.brokerage;
  }

  deposit(ammt) {
    this.balance += ammt;
  }

  withdraw(ammt) {
    this.balance -= ammt;
  }

  thresholdCheck() {
    return this.balance / this.threshold;
  }

  thresholdDiff() {
    return this.balance - this.threshold;
  }
}

class Accounts {
  constructor(){
    this.acctList = [];
    this.defaultAcct = 0;
  }

  accountNames() {
    return this.acctList.map((acct) => {
      return acct.name;
    });
  }

  addAccount(acct) {
    this.acctList.push(acct);
    if(acct.default) {
      this.defaultAcct = this.acctList.length - 1;
    }
    return;
  }

  findAccountByName(name) {
    return this.acctList.find((acct) => {
      return acct.name == name;
    });
  }

  liquidAccounts() {
    return this.acctList.filter((acct) => {
      return acct.liquid;
    });
  }

  distribute(distRules, ammt) {
    if(!distRules) {
      this.acctList[this.defaultAcct].deposit(ammt);
    }
    else{
      let tmp = ammt;
      distRules.forEach((rule) => {
        const target = this.findAccountByName(rule.target);
        if(target){
          let distAmmt = rule.ammt < tmp ? rule.ammt : tmp;
          tmp -= distAmmt;
          target.deposit(distAmmt);
        }
      });
      if(tmp > 0) {
        this.acctList[this.defaultAcct].deposit(tmp);
      }
    }
    return;
  }

  pay(ammt) {
    let defaultAcct = this.acctList[this.defaultAcct];
    let liquidAccts = this.liquidAccounts();
    // attempt pay from default
    if(defaultAcct.thresholdDiff() >= ammt){
      defaultAcct.withdraw(ammt);
      ammt = 0;
    }
    else {
      // find the money elsewhere
      let liquidAccts = this.liquidAccounts();
      liquidAccts.forEach((acct) => {
        let diff = acct.thresholdDiff();
        let payment = Math.min(diff, ammt);
        acct.withdraw(payment);
        ammt -= payment;
      });
      if(ammt > 0) {
        let nextPayment = Math.ceil(ammt / liquidAccts.length);
        liquidAccts.forEach((acct) => {
          acct.withdraw(nextPayment);
          ammt -= nextPayment;
        });
      }
    }
    // attempt pay from default
    defaultAcct.withdraw(ammt);
  }

  netWorth() {
    return this.acctList.reduce((sum, acct) => {
      return sum + acct.balance;
    }, 0);
  }

  liquidNetWorth() {
    return this.acctList.reduce((sum, acct) => {
      return (acct.liquid? sum + acct.balance : sum);
    }, 0);
  }

  totalLiquidReserve() {
    return this.acctList.reduce((sum, acct) => {
      return (acct.liquid? sum + acct.threshold : sum);
    }, 0);
  }

  freeCash() {
    return this.liquidNetWorth() - this.totalLiquidReserve();
  }

  canPay(ammt) {
    return this.freeCash() > ammt;
  }
}

module.exports = { Account, Accounts };
