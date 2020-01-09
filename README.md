# budget-forecast
A tool for money management

## Using this tool

### Installation and Dependencies
First, you must have NodeJS and npm installed.

[NodeJS & npm](https://nodejs.org/)

Second, install the dependencies by running `npm install` inside this directory.

Finally, run the application by using `node index.js` in this directory.

### Operation
Budget Forecast operates around two simple principles:
- Personas - a snapshot of the financials in question (accounts, income, and expenses).
- Events - each transaction is "evented" and run on a specific day, either explicitly or implicitly, while the system iterates over days and modifies the accounts.

To use this tool, you must load a persona using the `load` command, and then iterate over it using `iterate [number of days]`.  Since the system is setup to iterate each day individually, the output will represent all accounts and transactions starting from today until the number of iterations specified has been reached.

There is an example persona in `personas/default.yml`.  Follow this format to setup a persona for yourself or someone else.

#### Parts of a Persona
- **name**: a label for this persona
- **dailyBudget**: a combined target budget for daily expenses (food, bus fare, gas, etc.)
- **accounts**: this is where you list all accounts, with their types so that the system can make intelligent decisions about where the money for recurring expenses will come from.  See **Parts of an Account** below.
- **recurring**: recurring money events, which are divided into two more sections, **incomes** and **expenses**.  See **Recurring Income & Expenses** below.
  - **incomes**: This is a list of various kinds of periodic income; paychecks, anticipated dividends, etc.  These are expected to recur 1 or more times a month.
  - **expenses**: These are your monthly bills, or any expense that repeats at least 1 time per month; rent, utilities, subscription services, etc. Amounts used here are automatically converted to debits instead of credits.
- **events**: A list of one-off financial events.  Since these can be debits or credits, use negative numbers to represent expected financial losses or debts due.  See **Parts of an Event** below.

#### Parts of an Account
- **type**: the type of this account, must be in `savings, checking, retirement, brokerage`.  `savings` and `checking` represent liquid funds, while `retirement` and `brokerage` represent non-liquid investment accounts.
- **balance**: the current balance of this account, as of today.
- **name**: a label for this account
- **threshold**: the "low-water mark" for this account.  This is used to adjust the display for warning purposes, but also for advanced behavior between liquid accounts during iteration.

#### Recurring Income & Expenses
- **type**: must be in `monthly, bi-weekly, first-and-fifteenth`.  This determines how the recurrence is calculated.  The default is `monthly`.
- **startDate**: when did this income or expense start?  This also effects the recurrence calculation.  For `bi-weekly` or `monthly` this date is used to calculate the nest time this recurrence is "due": `bi-weekly` will occur 14 days from this date and repeat, `monthly` will occur on the same day "number".
- **endDate**: when should this recurrence stop being calculated?
- **ammt**: the amount that will be credited or debited on the recurrence.
- **desc**: a name or label for this recurrance

*Recurring incomes have one additional property*:
- **dist**: distribution of this credit.  Takes an amount and the name of an account to transfer the money to.
  - **target**: set this to the name of an account.
  - **ammt**: the amount to send to that account automatically

*Recurring expenses have one additional property*:
- **canFloat**: the number of days it is safe to wait to pay this expense if funds are, or would be inadequate to do so.

#### Parts of an Event
- **name**: a label for this event
- **ammt**: the amount that will be credited or debited.  For debits, use negative numbers here.
- **date**: the date this event is expected to take place.

### Commands
- **help**: show a list of commands
- **help [command]**: show help for a specific command
- **exit**: close the program
- **load <personaFile>**: load a persona YML file to set the initial state of the iterations, and the iteration rules.  There is no default, and you must do this before running any of the following commands.  This loads relative to your current working directory.
- **reload**: reloads the current persona file
- **state**: shows the current state of the program
- **iterate [days]**: runs the iteration over [days] days.

### What Happens in an Iteration?
- The program changes the date to ensure that the iteration is being run against the correct day.
- **IF** any of the events in the persona file match this date, these are processed.  These are run in the order they appear in the persona file.
- The program iterates over all recurring incomes and expenses to find any that are due on this date.
- The program attempts to set aside money for the daily budget from the first account of type `checking` (hereto referred to as the "primary" account).  If this transaction would put the primary account below a threshold, the program will attempt to get the remainder from other liquid accounts (`checking` or `savings`).  This represents a transfer between the accounts.
- **IF** any incomes or expenses are due on this date, the program modifies the accounts in the following order:
  - **FOR EACH INCOME** the amount of that income is credited to the primary account.  **IF** the income has a distribution, the amount is debited from the income, and credited to the target account.
  - **FOR EACH EXPENSE**:
    - **IF** `canFloat` is set, the due-date is modified by that many days to maximize cash flow and time-value.
    - The program attempts to debit the primary account for this expense.  If the amount of the expense would surpass the threshold of that account (or 0), the program attempts to pay this expense from an alternate liquid account.
    - If the program is unable to pay an expense, it will defer that expense to the next available date funds are available to pay the expense.

At this point, the next iteration starts.

## Understanding the Output
The output of this program is a table which contains a row for each iteration.  This row shows the state of each account, and the total liquid net worth.  The last column displays any income or expense that was paid on that specific date according to the rules of this program.

Consider the following output, which is the result of running the default persona for 28 iterations (4 weeks):
```
┌─────┬────────────────────┬────────────────┬────────────────┬────────────────┬────────────────┬────────────┬────────────────────────────────────────────────────────────┐
│     │ Date               │ My Savings Ac… │ My Checking A… │ 401K           │ Trading Acct   │ L. Net Wo… │ Paid                                                       │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 0   │ Wed, 01-08-2020    │ 80.00          │ 200.00         │ 1,000.00       │ 400.00         │ 280.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 1   │ Thu, 01-09-2020    │ 60.00          │ 200.00         │ 1,000.00       │ 400.00         │ 260.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 2   │ Fri, 01-10-2020    │ 40.00          │ 200.00         │ 1,000.00       │ 400.00         │ 240.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 3   │ Sat, 01-11-2020    │ 20.00          │ 200.00         │ 1,000.00       │ 400.00         │ 220.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 4   │ Sun, 01-12-2020    │ 10.00          │ 190.00         │ 1,000.00       │ 400.00         │ 200.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 5   │ Mon, 01-13-2020    │ 10.00          │ 170.00         │ 1,000.00       │ 400.00         │ 180.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 6   │ Tue, 01-14-2020    │ 10.00          │ 150.00         │ 1,000.00       │ 400.00         │ 160.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 7   │ Wed, 01-15-2020    │ 10.00          │ 130.00         │ 1,000.00       │ 400.00         │ 140.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 8   │ Thu, 01-16-2020    │ 10.00          │ 110.00         │ 1,000.00       │ 400.00         │ 120.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 9   │ Fri, 01-17-2020    │ 455.00         │ 110.00         │ 1,000.00       │ 400.00         │ 565.00     │ My Paycheck, Phone Bill                                    │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 10  │ Sat, 01-18-2020    │ 435.00         │ 110.00         │ 1,000.00       │ 400.00         │ 545.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 11  │ Sun, 01-19-2020    │ 415.00         │ 110.00         │ 1,000.00       │ 400.00         │ 525.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 12  │ Mon, 01-20-2020    │ 395.00         │ 110.00         │ 1,000.00       │ 400.00         │ 505.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 13  │ Tue, 01-21-2020    │ 375.00         │ 110.00         │ 1,000.00       │ 400.00         │ 485.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 14  │ Wed, 01-22-2020    │ 355.00         │ 110.00         │ 1,000.00       │ 400.00         │ 465.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 15  │ Thu, 01-23-2020    │ 335.00         │ 110.00         │ 1,000.00       │ 400.00         │ 445.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 16  │ Fri, 01-24-2020    │ 315.00         │ 110.00         │ 1,000.00       │ 400.00         │ 425.00     │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 17  │ Sat, 01-25-2020    │ 1,295.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,405.00   │ One Time Bonus                                             │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 18  │ Sun, 01-26-2020    │ 1,275.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,385.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 19  │ Mon, 01-27-2020    │ 1,255.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,365.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 20  │ Tue, 01-28-2020    │ 985.00         │ 110.00         │ 1,000.00       │ 400.00         │ 1,095.00   │ Loan Due                                                   │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 21  │ Wed, 01-29-2020    │ 965.00         │ 110.00         │ 1,000.00       │ 400.00         │ 1,075.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 22  │ Thu, 01-30-2020    │ 945.00         │ 110.00         │ 1,000.00       │ 400.00         │ 1,055.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 23  │ Fri, 01-31-2020    │ 1,425.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,535.00   │ My Paycheck                                                │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 24  │ Sat, 02-01-2020    │ 1,205.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,315.00   │ Twitch Subs, Rent                                          │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 25  │ Sun, 02-02-2020    │ 1,185.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,295.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 26  │ Mon, 02-03-2020    │ 1,165.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,275.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 27  │ Tue, 02-04-2020    │ 1,145.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,255.00   │                                                            │
├─────┼────────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────┼────────────────────────────────────────────────────────────┤
│ 28  │ Wed, 02-05-2020    │ 1,125.00       │ 110.00         │ 1,000.00       │ 400.00         │ 1,235.00   │                                                            │
└─────┴────────────────────┴────────────────┴────────────────┴────────────────┴────────────────┴────────────┴────────────────────────────────────────────────────────────┘
```

From this, it is clear to see the first couple weeks of the month would be slightly difficult financially, but will turn around as soon as the paycheck on the 17th hits.  This output could also help advise that this person should transfer at least $90 from their savings to checking, just to cover their daily budget.

Of note, while the investments are covered here, and their columns are displayed, no interest is calculated on these investments at this time.  Also, this persona is not making recurring distributions to their investment accounts, so these values never change.