# PRD: Budgeting & Personal Finance App

## 1. Product Summary

A simple budgeting and personal finance app that helps users plan money over a defined date range, split that money into spending categories, record expenses, and see exactly how much remains per category.

The core idea is:

> User defines a budget period, allocates money into categories, then logs expenses. The app intelligently matches each expense to the right budget period and helps the user assign it to a category, while showing remaining balances, uncategorized spend, and category overflow.

---

## 2. Product Goal

Help users answer three questions instantly:

1. **How much money do I have for this period?**
2. **Where is that money supposed to go?**
3. **How much is left after my expenses?**

The app should feel simpler than a spreadsheet but smarter than a basic expense tracker.

---

## 3. Target User

### Primary User

A person who wants to manage their personal money manually without connecting bank accounts.

They may receive money monthly, weekly, or irregularly and want to divide it across categories like food, transport, subscriptions, shopping, savings, and emergency money.

### Early Use Case

The user gets paid or sets aside an amount, for example:

> “I have 4,000 AED from May 1 to May 31. I want to split it across rent, food, transport, gym, subscriptions, and savings.”

Then every expense logged during May should affect that budget.

---

## 4. Core Concept

### Budget Period

A budget period is a date range with a total amount of money.

Example:

| Field        | Example    |
| ------------ | ---------- |
| Name         | May Budget |
| Start date   | May 1      |
| End date     | May 31     |
| Total budget | 4,000 AED  |

The user can create multiple budget periods, but expenses should only match one active period based on date.

---

## 5. MVP Scope

### Included in MVP

* Create budget periods
* Set start date and end date
* Enter total budget amount
* Create budget categories
* Allocate money to each category
* Log expenses
* Match expenses to the correct budget period by date
* Suggest relevant categories when logging an expense
* Show amount spent and remaining per category
* Handle uncategorized expenses
* Handle category overspending
* Show total remaining money for the period
* Show simple summary dashboard

### Not Included in MVP

* Bank account syncing
* Automatic transaction importing
* Credit card reconciliation
* Investment tracking
* Invoicing
* Multi-user/family budgeting
* AI financial advice
* Tax reporting

Build the manual budgeting loop first. Bank integrations can come later, but they will add complexity early.

---

## 6. User Stories

### Budget Creation

As a user, I want to create a budget for a specific date range so I can manage money for that period.

### Category Allocation

As a user, I want to split my budget into categories so I know how much I can spend in each area.

### Expense Logging

As a user, I want to submit an expense quickly so my budget stays updated.

### Category Suggestions

As a user, I want the app to suggest categories when I log an expense so I do not need to think too much.

### Remaining Balances

As a user, I want to see how much is left in each category so I can adjust my spending.

### Overflow Handling

As a user, I want the app to clearly show when I overspend a category so I understand the impact.

### Uncategorized Handling

As a user, I want expenses without a category to be tracked separately so they do not disappear from my budget.

---

## 7. Main User Flow

### Flow 1: Create Budget Period

1. User opens app
2. User taps **Create Budget**
3. User enters:
   * Budget name
   * Start date
   * End date
   * Total amount
   * Currency
4. User creates categories
5. User assigns an amount to each category
6. App validates that allocations do not exceed total budget
7. Budget becomes active

### Example

Total Budget: **4,000 AED**

| Category      | Allocated |
| ------------- | --------: |
| Food          |   900 AED |
| Transport     |   500 AED |
| Subscriptions |   200 AED |
| Shopping      |   600 AED |
| Savings       | 1,000 AED |
| Emergency     |   800 AED |

Total allocated: **4,000 AED**

---

## 8. Expense Logging Flow

### Flow 2: Add Expense

1. User taps **Add Expense**
2. User enters:
   * Amount
   * Date
   * Merchant or note
   * Optional category
3. App checks which budget period contains the expense date
4. App shows category suggestions
5. User selects category
6. Expense is saved
7. Category remaining amount updates
8. Budget dashboard updates

### Example

Expense:

| Field              | Value  |
| ------------------ | ------ |
| Amount             | 75 AED |
| Date               | May 6  |
| Note               | Dinner |
| Suggested category | Food   |

The app deducts **75 AED** from the Food category in the May Budget.

---

## 9. Smart Matching Logic

### Budget Period Matching

When an expense is submitted, the app should match it to the budget period where:

```text
expense.date >= budget.start_date
AND
expense.date <= budget.end_date
```

### If one matching budget exists

Attach expense to that budget automatically.

### If no matching budget exists

Show:

> “This expense does not belong to any active budget period.”

Options:

* Add to Uncategorized
* Create new budget period
* Change expense date
* Save without budget

### If multiple matching budgets exist

This should ideally be prevented. Budget periods should not overlap by default.

If overlapping budgets are allowed later, the app must ask the user which budget to use.

---

## 10. Category Suggestion Logic

When adding an expense, the app should suggest categories based on:

### MVP Suggestion Rules

1. Previously used category for similar merchant or note
2. Keyword matching
3. Most used categories
4. Categories with remaining balance

### Example Keyword Mapping

| Keyword                         | Suggested Category |
| ------------------------------- | ------------------ |
| restaurant, cafe, dinner, lunch | Food               |
| taxi, fuel, parking, metro      | Transport          |
| Netflix, Spotify, iCloud        | Subscriptions      |
| gym, pharmacy, doctor           | Health             |
| mall, clothes, Amazon           | Shopping           |

### UX Requirement

The app should not force the suggestion. It should present likely categories as tappable options.

Example:

> Suggested: Food, Shopping, Uncategorized

---

## 11. Category Balance Logic

Each category should show:

```text
remaining = allocated_amount - spent_amount
```

### Category States

| State       | Condition                 | UI Meaning            |
| ----------- | ------------------------- | --------------------- |
| Healthy     | spent < allocated         | User is within budget |
| Near Limit  | spent >= 80% of allocated | User should slow down |
| Full        | spent = allocated         | No money left         |
| Over Budget | spent > allocated         | User overspent        |

### Example

| Category  | Allocated |   Spent | Remaining |
| --------- | --------: | ------: | --------: |
| Food      |   900 AED | 725 AED |   175 AED |
| Transport |   500 AED | 520 AED |   -20 AED |
| Shopping  |   600 AED | 100 AED |   500 AED |

Transport is over budget by  **20 AED** .

---

## 12. Overflow Handling

When a category goes over budget, the app should not block the expense. Blocking creates friction.

Instead, the app should show the overflow clearly.

### Example

Transport:

```text
Allocated: 500 AED
Spent: 520 AED
Overflow: 20 AED
```

### Overflow Display

The app should show:

> “Transport is 20 AED over budget.”

Then offer actions:

1. Keep overflow
2. Move money from another category
3. Mark as unavoidable
4. Reassign expense to another category

### MVP Recommendation

For MVP, use simple overflow tracking only.

Do **not** build automatic money movement yet. Let users manually move budget between categories.

---

## 13. No Category Handling

If the user does not select a category, the expense should go into  **Uncategorized** .

### Uncategorized Rules

* Uncategorized expenses still reduce the total budget remaining
* They do not reduce any category balance
* The dashboard should show Uncategorized clearly
* User should be encouraged to categorize later

### Example

Total budget: 4,000 AED
Categorized spend: 1,200 AED
Uncategorized spend: 300 AED

Total spent: 1,500 AED
Total remaining: 2,500 AED

The app should not hide uncategorized spend. That is where bad budgeting apps fail.

---

## 14. Budget Dashboard

The budget dashboard should show:

### Top Summary

| Metric          |   Example |
| --------------- | --------: |
| Total Budget    | 4,000 AED |
| Total Spent     | 1,500 AED |
| Total Remaining | 2,500 AED |
| Days Left       |   18 days |

### Category Breakdown

| Category      | Allocated | Spent | Left |
| ------------- | --------: | ----: | ---: |
| Food          |       900 |   725 |  175 |
| Transport     |       500 |   520 |  -20 |
| Shopping      |       600 |   100 |  500 |
| Uncategorized |         0 |   300 | -300 |

### Useful Dashboard Messages

* “You have spent 37.5% of this budget.”
* “You are 20 AED over in Transport.”
* “300 AED is uncategorized.”
* “You have 2,500 AED left for 18 days.”

---

## 15. Screens

### MVP Screens

1. **Home**
   * Current active budget
   * Total remaining
   * Recent expenses
2. **Budget Details**
   * Budget period
   * Category balances
   * Overflow warnings
   * Uncategorized amount
3. **Create Budget**
   * Date range
   * Total amount
   * Category allocations
4. **Add Expense**
   * Amount
   * Date
   * Note or merchant
   * Category suggestions
5. **Expense Details**
   * Amount
   * Date
   * Category
   * Budget period
   * Edit/delete actions
6. **Categories**
   * Create category
   * Edit category
   * View category history

---

## 16. Functional Requirements

### Budget Periods

| ID    | Requirement                                    | Priority |
| ----- | ---------------------------------------------- | -------- |
| BR-01 | User can create a budget period                | Must     |
| BR-02 | User can define start and end date             | Must     |
| BR-03 | User can enter total budget amount             | Must     |
| BR-04 | User can edit budget period                    | Must     |
| BR-05 | User can delete budget period                  | Should   |
| BR-06 | App prevents overlapping active budget periods | Should   |

### Categories

| ID     | Requirement                                     | Priority |
| ------ | ----------------------------------------------- | -------- |
| CAT-01 | User can create budget categories               | Must     |
| CAT-02 | User can allocate money to categories           | Must     |
| CAT-03 | User can edit category allocation               | Must     |
| CAT-04 | App shows spent and remaining per category      | Must     |
| CAT-05 | App supports Uncategorized as a system category | Must     |

### Expenses

| ID     | Requirement                                  | Priority |
| ------ | -------------------------------------------- | -------- |
| EXP-01 | User can add expense                         | Must     |
| EXP-02 | User can set expense date                    | Must     |
| EXP-03 | App matches expense to budget period by date | Must     |
| EXP-04 | User can assign category                     | Must     |
| EXP-05 | App suggests categories                      | Should   |
| EXP-06 | User can edit expense                        | Must     |
| EXP-07 | User can delete expense                      | Must     |

### Overflow

| ID     | Requirement                                       | Priority |
| ------ | ------------------------------------------------- | -------- |
| OVF-01 | App detects category overspending                 | Must     |
| OVF-02 | App shows overflow amount                         | Must     |
| OVF-03 | User can move budget from one category to another | Should   |
| OVF-04 | App can recommend category adjustment             | Later    |

---

## 17. Data Model

### User

```text
id
name
email
default_currency
created_at
updated_at
```

### BudgetPeriod

```text
id
user_id
name
start_date
end_date
total_amount
currency
status
created_at
updated_at
```

### BudgetCategory

```text
id
budget_period_id
name
allocated_amount
sort_order
created_at
updated_at
```

### Expense

```text
id
user_id
budget_period_id
category_id nullable
amount
date
merchant nullable
note nullable
created_at
updated_at
```

### CategoryRule

Optional for later category suggestions.

```text
id
user_id
keyword
category_name
created_at
updated_at
```

---

## 18. Important Calculation Rules

### Total Allocated

```text
sum(category.allocated_amount)
```

### Total Spent

```text
sum(expense.amount where expense.budget_period_id = current_budget.id)
```

### Category Spent

```text
sum(expense.amount where expense.category_id = category.id)
```

### Category Remaining

```text
category.allocated_amount - category_spent
```

### Total Remaining

```text
budget.total_amount - total_spent
```

### Uncategorized Spend

```text
sum(expense.amount where category_id is null)
```

---

## 19. Validation Rules

### Budget Creation

* Start date is required
* End date is required
* End date must be after start date
* Total amount must be greater than 0
* Category allocation cannot be negative
* Total category allocation should not exceed total budget

### Expense Creation

* Amount is required
* Amount must be greater than 0
* Date is required
* Expense should match a budget period if one exists
* Category is optional

---

## 20. Edge Cases

### Expense outside budget range

Show warning and let user save without budget or change date.

### Expense causes category overflow

Allow it, but highlight overflow.

### Expense has no category

Save under Uncategorized.

### User edits expense date

Recalculate budget period matching.

### User edits expense amount

Recalculate category balance and total remaining.

### User deletes expense

Restore remaining balance automatically.

### User changes category allocation

Recalculate remaining and overflow states.

### Budget categories do not equal full budget

Allow it, but show unallocated money.

Example:

```text
Total Budget: 4,000 AED
Allocated: 3,500 AED
Unallocated: 500 AED
```

This is useful because not all money needs to be assigned immediately.

---

## 21. UX Principles

### Keep it manual-first

Do not over-automate early. The user should feel in control.

### Make money status obvious

Every screen should answer:

> “Am I okay, or am I overspending?”

### Do not punish the user

If they overspend, the app should explain the impact, not block them.

### Make uncategorized visible

Uncategorized spend should be treated as a problem to clean up, not hidden.

---

## 22. Success Metrics

### Activation

* User creates first budget period
* User adds at least 3 categories
* User logs first expense

### Retention

* User logs expenses for 7 days
* User returns to check remaining budget
* User creates second budget period

### Engagement

* Expenses logged per week
* Percentage of categorized expenses
* Number of category adjustments
* Number of completed budget periods

### Quality

* Low number of uncategorized expenses
* Low abandoned budget periods
* High repeat budget creation

---

## 23. MVP Recommendation

Build this version first:

1. Manual budget creation
2. Manual category allocation
3. Manual expense logging
4. Date-based budget matching
5. Simple category suggestions
6. Remaining balances
7. Overflow tracking
8. Uncategorized tracking

Do **not** start with bank syncing, AI, investments, or subscription detection. Those sound attractive, but they will delay the actual budgeting loop.

---

## 24. Suggested Product Positioning

### Simple Version

> A budgeting app that shows exactly where your money is going and how much you have left.

### Stronger Version

> Plan your money by date range, split it into categories, and track every expense against the budget it belongs to.

### Short App Store Style Description

> Create a budget for any date range, divide it into categories, track expenses, and instantly see what is left.

---

## 25. Next Build Steps

1. Design the core database tables:
   * `budget_periods`
   * `budget_categories`
   * `expenses`
2. Build the main flows:
   * Create budget
   * Add category
   * Add expense
   * View budget dashboard
3. Implement the matching logic:
   * Expense date → budget period
   * Expense category → category balance
4. Keep the first version brutally simple:
   * No bank sync
   * No AI
   * No advanced reports
   * No multi-budget complexity

The real MVP is not “personal finance.” It is  **date-based category budgeting with smart expense matching** . That is the core product.
