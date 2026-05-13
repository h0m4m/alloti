# PRD V2: More Featured Budgeting & Personal Finance App

This version builds on the finished MVP PRD, which centered on  **date-based category budgeting, manual expense logging, smart expense matching, uncategorized spend, and overflow visibility** .

The goal of V2 should **not** be “add everything.” The goal should be:

> Turn the MVP from a manual budget tracker into a useful personal finance system without making it feel like accounting software.

---

```md
# PRD V2: Advanced Budgeting & Personal Finance App

## 1. Product Summary

A more complete budgeting and personal finance app that helps users plan income, manage budgets across periods, track recurring expenses, monitor savings goals, review spending patterns, and make better decisions without needing bank integrations.

V1 helped users answer:

1. How much money do I have for this period?
2. Where is that money supposed to go?
3. How much is left after expenses?

V2 expands that into:

1. What money is coming in?
2. What expenses are predictable?
3. What spending patterns are hurting me?
4. Am I on track for my goals?
5. What should I adjust before the period ends?

---

## 2. Product Goal

Help users move from simple tracking to active money planning.

The app should help users:

- Plan budget periods faster
- Reuse previous budgets
- Track recurring payments
- Set savings goals
- Understand spending patterns
- Move money between categories
- Review completed budget periods
- See warnings before overspending gets worse

The product should still feel simple, manual-first, and personal.

---

## 3. Target User

### Primary User

A person who wants better control over personal money without connecting bank accounts.

They may be:

- A student
- A young professional
- A freelancer
- Someone paid monthly or irregularly
- Someone who wants to avoid spreadsheet budgeting
- Someone who wants to track cash, card, or mixed spending manually

### Secondary User

A user who already completed one or more budget periods and now wants deeper visibility into:

- Monthly spending behavior
- Recurring expenses
- Savings progress
- Category trends
- Budget discipline over time

---

## 4. Product Positioning

### Simple Positioning

A budgeting app that helps you plan your money, track spending, and stay on top of your financial goals.

### Stronger Positioning

Plan income, divide money into categories, track expenses, manage recurring costs, and understand where your money actually goes.

### App Store Style Description

Create budgets by date range, log expenses, manage recurring payments, track savings goals, and review your spending with clear personal finance insights.

---

## 5. V2 Scope

## Included in V2

### Budgeting

- Duplicate previous budget
- Budget templates
- Budget rollover
- Move money between categories
- Unallocated money tracking
- Budget period review
- Budget archive

### Expenses

- Recurring expenses
- Expense search and filtering
- Expense attachments or receipt images
- Expense notes
- Merchant history
- Custom category rules

### Income

- Add income manually
- Support multiple income entries per budget period
- Match income to budget period
- Compare planned income vs actual income

### Savings

- Savings goals
- Goal contribution tracking
- Goal progress percentage
- Link category allocation to a savings goal

### Reports

- Spending by category
- Spending over time
- Budget vs actual
- Top merchants
- Most overspent categories
- Monthly comparison

### Notifications

- Budget near limit alert
- Category near limit alert
- Recurring expense reminder
- End-of-period review reminder
- Uncategorized cleanup reminder

### Settings

- Default currency
- Default budget duration
- Default categories
- Notification preferences
- Theme preference
- Data export

---

## Not Included in V2

These should still be avoided unless the core product is already sticky:

- Bank syncing
- Credit card reconciliation
- Investment portfolio tracking
- Tax reporting
- Multi-user family budgets
- Full AI financial advisor
- Crypto tracking
- Loan amortization
- Business accounting

These features increase complexity and can distract from the core product.

---

# 6. Core V2 Concepts

## 6.1 Budget Template

A budget template is a reusable set of categories and allocations.

Example:

| Template Name | Description |
|---|---|
| Monthly Budget | Standard monthly budget |
| Student Budget | Rent, food, transport, subscriptions |
| Freelancer Budget | Income buffer, tax savings, expenses |
| Minimal Budget | Essentials only |

Users should be able to create a new budget from:

1. Blank budget
2. Previous budget
3. Saved template

---

## 6.2 Budget Rollover

Budget rollover lets leftover money from one period move into the next period.

Example:

| Previous Budget | Amount |
|---|---:|
| Total budget | 4,000 AED |
| Total spent | 3,700 AED |
| Remaining | 300 AED |

The user can choose:

1. Add 300 AED to next budget
2. Add 300 AED to savings
3. Ignore rollover
4. Split rollover manually

### Rollover Rules

- Rollover should be optional
- User must confirm rollover
- Rollover should be visible in the next budget
- Rollover should not silently modify future budgets

---

## 6.3 Category Transfers

Users can move money from one category to another.

Example:

Food is almost finished, but Shopping has extra budget.

| From | To | Amount |
|---|---|---:|
| Shopping | Food | 100 AED |

### Transfer Rules

- Transfers change allocation, not expense history
- App should keep transfer history
- Transfers should not affect total budget amount
- User should see adjusted category allocations

---

## 6.4 Recurring Expenses

Recurring expenses are predictable expenses that repeat.

Examples:

| Expense | Amount | Frequency |
|---|---:|---|
| Netflix | 39 AED | Monthly |
| Gym | 250 AED | Monthly |
| iCloud | 12 AED | Monthly |
| Rent | 3,500 AED | Monthly |

The app should help users avoid forgetting predictable costs.

---

## 6.5 Income Tracking

V1 assumed the budget amount was manually entered.

V2 should let the user track income separately from budget allocation.

Example:

| Income Source | Amount | Date |
|---|---:|---|
| Salary | 8,000 AED | May 1 |
| Freelance work | 1,500 AED | May 14 |

The user can then decide how much of that income becomes budgeted money.

---

## 6.6 Savings Goals

Savings goals let users track money they are intentionally setting aside.

Example:

| Goal | Target | Saved | Progress |
|---|---:|---:|---:|
| Emergency Fund | 10,000 AED | 2,500 AED | 25% |
| New MacBook | 7,000 AED | 1,200 AED | 17% |
| Travel | 5,000 AED | 900 AED | 18% |

A savings category inside a budget can be linked to a savings goal.

---

# 7. User Stories

## Budget Templates

As a user, I want to create a budget from a previous budget so I do not need to rebuild categories every month.

As a user, I want to save a budget structure as a template so I can reuse it later.

---

## Budget Rollover

As a user, I want to roll unused money into the next period so my budget reflects reality.

As a user, I want to decide where leftover money goes instead of the app deciding automatically.

---

## Category Transfers

As a user, I want to move money between categories when my plans change.

As a user, I want to see transfer history so I know why allocations changed.

---

## Recurring Expenses

As a user, I want to add recurring expenses so predictable payments appear automatically.

As a user, I want reminders before recurring expenses happen so I am not surprised.

---

## Income

As a user, I want to record income so I can see money coming in and going out.

As a user, I want to compare income against spending so I know whether I am living within my means.

---

## Savings Goals

As a user, I want to create savings goals so I can track progress toward important purchases or financial buffers.

As a user, I want to contribute to savings goals from my budget.

---

## Reports

As a user, I want to see where most of my money goes so I can make better decisions.

As a user, I want to compare one period to another so I can see whether I am improving.

---

# 8. Main User Flows

## Flow 1: Create Budget From Previous Budget

1. User opens Home
2. User taps New Budget
3. User selects Duplicate Previous Budget
4. App shows previous categories and allocations
5. User edits date range, name, and amounts
6. User confirms
7. New budget is created

### Acceptance Criteria

- User can duplicate any previous budget
- Expenses are not copied
- Categories and allocations are copied
- User can edit copied categories before saving

---

## Flow 2: Create Budget From Template

1. User taps New Budget
2. User selects Use Template
3. App shows available templates
4. User chooses template
5. App pre-fills categories and allocation structure
6. User enters date range and total amount
7. User adjusts allocations
8. Budget is created

### Acceptance Criteria

- Templates can be created, edited, and deleted
- Templates do not contain expenses
- Template categories can be edited after selection

---

## Flow 3: Move Money Between Categories

1. User opens Budget Details
2. User taps Adjust Budget
3. User selects Move Money
4. User chooses source category
5. User chooses destination category
6. User enters amount
7. App validates available balance
8. Transfer is saved
9. Category balances update

### Example

Move 150 AED from Shopping to Food.

Shopping allocation decreases by 150 AED.
Food allocation increases by 150 AED.

---

## Flow 4: Add Recurring Expense

1. User opens Recurring Expenses
2. User taps Add Recurring Expense
3. User enters:
   - Name
   - Amount
   - Category
   - Frequency
   - Start date
   - Optional end date
4. App shows upcoming occurrences
5. User saves recurring expense
6. App creates or suggests expenses when dates arrive

### MVP V2 Recommendation

Do not automatically create expenses silently.

Instead:

- Show “Upcoming recurring expenses”
- Let user confirm when paid
- Optionally allow auto-create later

This keeps the app accurate and avoids fake expenses.

---

## Flow 5: Add Income

1. User taps Add Income
2. User enters:
   - Amount
   - Date
   - Source
   - Note
3. App matches income to budget period by date
4. Income appears in budget summary
5. User can decide whether to increase budget amount

### Important Rule

Income should not automatically increase budget unless the user chooses that behavior.

---

## Flow 6: Create Savings Goal

1. User opens Goals
2. User taps New Goal
3. User enters:
   - Goal name
   - Target amount
   - Starting amount
   - Target date optional
4. User saves goal
5. Goal appears on dashboard

### Contribution Flow

1. User opens a savings goal
2. User taps Add Contribution
3. User enters amount
4. App updates saved amount
5. Goal progress updates

---

## Flow 7: End-of-Period Review

1. Budget period ends
2. App prompts user to review
3. App shows:
   - Total budget
   - Total spent
   - Remaining
   - Overspent categories
   - Uncategorized expenses
   - Biggest merchants
   - Category performance
4. User chooses what to do with remaining money
5. User can create next budget from this one

---

# 9. Screens

## V2 Screens

1. Home Dashboard
2. Budget Details
3. Create Budget
4. Budget Templates
5. Add Expense
6. Expense Details
7. Expenses List
8. Recurring Expenses
9. Add Income
10. Income List
11. Savings Goals
12. Goal Details
13. Reports
14. End-of-Period Review
15. Settings
16. Data Export

---

# 10. Home Dashboard

The Home Dashboard should show:

## Active Budget Card

| Metric | Example |
|---|---:|
| Budget | May Budget |
| Total Budget | 4,000 AED |
| Total Spent | 1,850 AED |
| Remaining | 2,150 AED |
| Days Left | 12 days |

## Quick Actions

- Add Expense
- Add Income
- Move Money
- View Reports
- Create Next Budget

## Alerts

- Food is 85% used
- Transport is 20 AED over budget
- 300 AED is uncategorized
- Netflix payment is due in 2 days

## Goals Preview

| Goal | Progress |
|---|---:|
| Emergency Fund | 25% |
| Travel | 18% |

---

# 11. Budget Details Screen

The Budget Details screen should show:

## Summary

- Total budget
- Planned income
- Actual income
- Total spent
- Total remaining
- Unallocated money
- Uncategorized spend
- Days left

## Category Breakdown

| Category | Allocated | Spent | Remaining | Status |
|---|---:|---:|---:|---|
| Food | 900 | 725 | 175 | Healthy |
| Transport | 500 | 520 | -20 | Over |
| Shopping | 600 | 100 | 500 | Healthy |
| Subscriptions | 200 | 180 | 20 | Near Limit |

## Actions

- Add Expense
- Edit Budget
- Move Money
- Duplicate Budget
- End Budget
- Review Budget

---

# 12. Expenses List

The Expenses List should support:

- Search by merchant or note
- Filter by category
- Filter by date
- Filter by budget period
- Filter by uncategorized
- Sort by newest
- Sort by highest amount
- Sort by merchant
- Bulk categorize uncategorized expenses

### Expense Row

Each expense should show:

- Amount
- Date
- Merchant or note
- Category
- Budget period
- Attachment indicator if receipt exists

---

# 13. Recurring Expenses

## Recurring Expense Fields

```text
id
user_id
name
amount
currency
category_id
frequency
start_date
end_date nullable
next_due_date
auto_create_expense boolean
status
created_at
updated_at
```

## Frequency Options

* Daily
* Weekly
* Every 2 weeks
* Monthly
* Quarterly
* Yearly
* Custom

## Recurring Expense States

| State     | Meaning              |
| --------- | -------------------- |
| Upcoming  | Due soon             |
| Due Today | Expected today       |
| Overdue   | Not marked as paid   |
| Paid      | Confirmed by user    |
| Paused    | Temporarily inactive |

---

# 14. Income Tracking

## Income Fields

```text
id
user_id
budget_period_id nullable
amount
currency
date
source
note nullable
created_at
updated_at
```

## Income Summary

The app should show:

| Metric            | Meaning                     |
| ----------------- | --------------------------- |
| Planned income    | What user expected          |
| Actual income     | What user actually received |
| Budgeted amount   | Amount assigned to budget   |
| Unbudgeted income | Income not allocated yet    |

### Important UX Rule

Do not confuse income with budget.

Income is money received.
Budget is money planned for use.

---

# 15. Savings Goals

## Goal Fields

```text
id
user_id
name
target_amount
current_amount
currency
target_date nullable
status
created_at
updated_at
```

## Goal Contribution Fields

```text
id
goal_id
user_id
amount
date
source_budget_period_id nullable
note nullable
created_at
updated_at
```

## Goal States

| State       | Condition                              |
| ----------- | -------------------------------------- |
| Not Started | current_amount = 0                     |
| In Progress | current_amount > 0 and < target_amount |
| Completed   | current_amount >= target_amount        |
| Paused      | user paused goal                       |

---

# 16. Reports

## Report 1: Spending by Category

Shows how much the user spent in each category.

Example:

| Category  |    Amount | Percentage |
| --------- | --------: | ---------: |
| Food      | 1,200 AED |        30% |
| Transport |   500 AED |      12.5% |
| Shopping  |   700 AED |      17.5% |

---

## Report 2: Budget vs Actual

Shows planned amount compared to actual spending.

| Category  | Planned | Actual | Difference |
| --------- | ------: | -----: | ---------: |
| Food      |     900 |  1,200 |       -300 |
| Transport |     500 |    450 |        +50 |
| Shopping  |     600 |    300 |       +300 |

---

## Report 3: Monthly Comparison

Shows how spending changes across budget periods.

| Month | Budget | Spent | Remaining |
| ----- | -----: | ----: | --------: |
| March |  4,000 | 3,800 |       200 |
| April |  4,000 | 4,200 |      -200 |
| May   |  4,000 | 3,500 |       500 |

---

## Report 4: Top Merchants

Shows where the user spends the most.

| Merchant | Total Spent | Count |
| -------- | ----------: | ----: |
| Talabat  |     420 AED |     9 |
| Careem   |     300 AED |     6 |
| Amazon   |     250 AED |     3 |

---

## Report 5: Uncategorized Spend

Shows expenses that need cleanup.

| Date  | Note   |  Amount |
| ----- | ------ | ------: |
| May 4 | Dinner |  75 AED |
| May 8 | Mall   | 120 AED |

---

# 17. Notifications

## Notification Types

| ID   | Notification           | Trigger                                |
| ---- | ---------------------- | -------------------------------------- |
| N-01 | Category near limit    | Category reaches 80% spent             |
| N-02 | Category over budget   | Category exceeds allocation            |
| N-03 | Budget near end        | 3 days before end date                 |
| N-04 | Recurring expense due  | Before due date                        |
| N-05 | Uncategorized cleanup  | Uncategorized spend exists for 3+ days |
| N-06 | Goal progress reminder | Monthly                                |
| N-07 | End-of-period review   | Budget period ends                     |

## Notification Settings

User can enable or disable each notification type.

---

# 18. Category Rules

Category rules improve suggestions.

## Rule Examples

| Keyword   | Category      |
| --------- | ------------- |
| Starbucks | Food          |
| Netflix   | Subscriptions |
| Petrol    | Transport     |
| Amazon    | Shopping      |
| Gym       | Health        |

## Rule Fields

```text
id
user_id
keyword
category_name
match_type
created_at
updated_at
```

## Match Types

* Contains
* Exact match
* Starts with

## UX Rule

When the app suggests a category, it should explain why.

Example:

“Suggested Food because you usually categorize Starbucks as Food.”

---

# 19. Attachments / Receipts

Users can attach a receipt image to an expense.

## Attachment Fields

```text
id
expense_id
user_id
file_url
file_name
file_type
file_size
created_at
```

## V2 Recommendation

Do not build OCR yet.

Receipt upload is useful enough without extracting text automatically.

OCR can come later.

---

# 20. Data Export

Users should be able to export their data.

## Export Formats

* CSV
* JSON

## Export Scope

* All expenses
* Budget periods
* Categories
* Income
* Savings goals
* Recurring expenses

## Reason

Data export increases trust. Users are more willing to use a personal finance app if they know their data is not trapped.

---

# 21. Settings

Settings should include:

## Profile

* Name
* Email
* Avatar

## Preferences

* Default currency
* Default budget duration
* First day of week
* Date format
* Number format

## Budget Defaults

* Default categories
* Default template
* Default rollover behavior

## Notifications

* Enable/disable alerts
* Reminder timing

## Data

* Export data
* Delete account
* Delete all financial data

---

# 22. Functional Requirements

## Budget Templates

| ID    | Requirement                          | Priority |
| ----- | ------------------------------------ | -------- |
| BT-01 | User can create budget template      | Must     |
| BT-02 | User can edit budget template        | Must     |
| BT-03 | User can delete budget template      | Should   |
| BT-04 | User can create budget from template | Must     |
| BT-05 | User can duplicate previous budget   | Must     |

---

## Budget Rollover

| ID    | Requirement                                    | Priority |
| ----- | ---------------------------------------------- | -------- |
| RO-01 | App calculates remaining money at period end   | Must     |
| RO-02 | User can roll remaining money into next budget | Should   |
| RO-03 | User can send remaining money to savings goal  | Should   |
| RO-04 | User can ignore rollover                       | Must     |
| RO-05 | App records rollover history                   | Should   |

---

## Category Transfers

| ID    | Requirement                            | Priority |
| ----- | -------------------------------------- | -------- |
| CT-01 | User can move money between categories | Must     |
| CT-02 | App validates source category balance  | Must     |
| CT-03 | App records transfer history           | Should   |
| CT-04 | App shows adjusted allocations         | Must     |

---

## Recurring Expenses

| ID    | Requirement                             | Priority |
| ----- | --------------------------------------- | -------- |
| RE-01 | User can create recurring expense       | Must     |
| RE-02 | User can set frequency                  | Must     |
| RE-03 | User can pause recurring expense        | Should   |
| RE-04 | App shows upcoming recurring expenses   | Must     |
| RE-05 | User can mark recurring expense as paid | Must     |
| RE-06 | App can auto-create recurring expense   | Later    |

---

## Income

| ID    | Requirement                                 | Priority |
| ----- | ------------------------------------------- | -------- |
| IN-01 | User can add income                         | Must     |
| IN-02 | App matches income to budget period by date | Should   |
| IN-03 | User can edit income                        | Must     |
| IN-04 | User can delete income                      | Must     |
| IN-05 | App shows income summary                    | Must     |

---

## Savings Goals

| ID    | Requirement                            | Priority |
| ----- | -------------------------------------- | -------- |
| SG-01 | User can create savings goal           | Must     |
| SG-02 | User can add contribution              | Must     |
| SG-03 | User can edit goal                     | Must     |
| SG-04 | User can delete goal                   | Should   |
| SG-05 | App shows progress percentage          | Must     |
| SG-06 | User can link category to savings goal | Should   |

---

## Reports

| ID    | Requirement                    | Priority |
| ----- | ------------------------------ | -------- |
| RP-01 | App shows spending by category | Must     |
| RP-02 | App shows budget vs actual     | Must     |
| RP-03 | App shows monthly comparison   | Should   |
| RP-04 | App shows top merchants        | Should   |
| RP-05 | App shows uncategorized report | Must     |

---

## Notifications

| ID    | Requirement                              | Priority |
| ----- | ---------------------------------------- | -------- |
| NT-01 | User can enable/disable notifications    | Must     |
| NT-02 | App alerts when category reaches 80%     | Should   |
| NT-03 | App alerts when category is over budget  | Should   |
| NT-04 | App reminds user of recurring expense    | Should   |
| NT-05 | App reminds user to review budget period | Should   |

---

# 23. Data Model V2

## User

```text
id
name
email
default_currency
default_budget_duration
created_at
updated_at
```

---

## BudgetPeriod

```text
id
user_id
name
start_date
end_date
total_amount
currency
status
template_id nullable
rollover_from_budget_id nullable
created_at
updated_at
```

---

## BudgetCategory

```text
id
budget_period_id
user_id
name
allocated_amount
linked_goal_id nullable
sort_order
created_at
updated_at
```

---

## Expense

```text
id
user_id
budget_period_id nullable
category_id nullable
recurring_expense_id nullable
amount
currency
date
merchant nullable
note nullable
has_attachment boolean
created_at
updated_at
```

---

## Income

```text
id
user_id
budget_period_id nullable
amount
currency
date
source
note nullable
created_at
updated_at
```

---

## BudgetTemplate

```text
id
user_id
name
description nullable
currency
created_at
updated_at
```

---

## BudgetTemplateCategory

```text
id
template_id
name
default_amount nullable
default_percentage nullable
sort_order
created_at
updated_at
```

---

## CategoryTransfer

```text
id
user_id
budget_period_id
from_category_id
to_category_id
amount
note nullable
created_at
```

---

## RecurringExpense

```text
id
user_id
name
amount
currency
category_id nullable
frequency
start_date
end_date nullable
next_due_date
status
auto_create_expense
created_at
updated_at
```

---

## SavingsGoal

```text
id
user_id
name
target_amount
current_amount
currency
target_date nullable
status
created_at
updated_at
```

---

## GoalContribution

```text
id
user_id
goal_id
source_budget_period_id nullable
amount
date
note nullable
created_at
updated_at
```

---

## CategoryRule

```text
id
user_id
keyword
category_name
match_type
created_at
updated_at
```

---

## ExpenseAttachment

```text
id
user_id
expense_id
file_url
file_name
file_type
file_size
created_at
```

---

# 24. Calculation Rules

## Total Income

```text
sum(income.amount where income.budget_period_id = budget.id)
```

## Actual Surplus / Deficit

```text
total_income - total_spent
```

## Budget Remaining

```text
budget.total_amount - total_spent
```

## Category Remaining

```text
category.allocated_amount - category_spent
```

## Unallocated Budget

```text
budget.total_amount - sum(category.allocated_amount)
```

## Goal Progress

```text
goal.current_amount / goal.target_amount * 100
```

## Rollover Amount

```text
budget.total_amount - total_spent
```

## Budget Health Score

Optional V2 metric:

```text
score = weighted result of:
- percentage of budget remaining
- number of over-budget categories
- uncategorized spend ratio
- savings contribution progress
```

Recommendation: show this later, not immediately.

---

# 25. Validation Rules

## Budget Template

* Template name is required
* Category names cannot be empty
* Default amounts cannot be negative

## Category Transfer

* Amount must be greater than 0
* Source and destination category cannot be the same
* Transfer cannot exceed source category remaining unless user confirms
* Transfer must belong to same budget period

## Recurring Expense

* Name is required
* Amount must be greater than 0
* Frequency is required
* Start date is required
* End date must be after start date if provided

## Income

* Amount is required
* Amount must be greater than 0
* Date is required
* Source is optional but recommended

## Savings Goal

* Goal name is required
* Target amount must be greater than 0
* Current amount cannot be negative
* Target date must be in the future if provided

---

# 26. Edge Cases

## User duplicates a budget with deleted categories

Copy the categories as they existed in that budget.

## User creates recurring expense but no active budget exists

Show it under upcoming recurring expenses, but do not attach it to a budget yet.

## Recurring expense date falls outside any budget

Allow user to mark as paid and save without budget.

## User moves money from over-budget category

Warn the user that this category is already over budget.

## User deletes category with expenses

Ask user to:

1. Move expenses to another category
2. Move expenses to Uncategorized
3. Cancel deletion

## User deletes savings goal linked to category

Unlink the category but keep the budget category.

## User deletes budget period

Soft-delete or archive recommended.
Hard delete only after confirmation.

## User changes currency

Do not convert old records automatically.
Apply new currency to future budgets only unless user explicitly edits records.

---

# 27. UX Principles

## Keep the app calm

Do not shame the user for overspending. Show the truth clearly.

## Make planning faster

The second budget should be easier to create than the first one.

## Do not hide messy money

Uncategorized expenses, overspending, and unallocated money should be visible.

## Manual-first, smart-assisted

The app can suggest, remind, and organize, but the user stays in control.

## Reports should lead to action

Every report should answer:

“So what should I do next?”

Example:

Bad:
“You spent 1,200 AED on Food.”

Better:
“You spent 300 AED more than planned on Food. Consider increasing Food next month or reducing restaurant expenses.”

---

# 28. Success Metrics

## Activation

* User creates first budget
* User creates first expense
* User creates first recurring expense
* User creates first savings goal

## Retention

* User creates second budget period
* User uses duplicate budget flow
* User reviews completed budget
* User logs expenses for 14+ days

## Engagement

* Expenses logged per week
* Percentage of categorized expenses
* Number of recurring expenses added
* Number of budget adjustments
* Number of reports viewed
* Number of goal contributions

## Quality

* Low uncategorized spend percentage
* Fewer abandoned budgets
* More completed budget reviews
* Higher template reuse
* Lower repeated overspending in same category

---

# 29. V2 Build Priority

## Phase 1: Budget Power Features

Build first:

1. Duplicate previous budget
2. Budget templates
3. Category transfers
4. Budget review
5. Expense search and filters

Reason:

These improve the core loop directly.

---

## Phase 2: Predictable Money

Build next:

1. Recurring expenses
2. Income tracking
3. Upcoming payments
4. Notifications

Reason:

This makes the app proactive instead of purely reactive.

---

## Phase 3: Goals and Reports

Build after that:

1. Savings goals
2. Goal contributions
3. Spending by category
4. Budget vs actual
5. Monthly comparison
6. Top merchants

Reason:

These add value after the user has enough data.

---

## Phase 4: Trust and Data Control

Build after core usage exists:

1. CSV export
2. JSON export
3. Delete all data
4. Receipt attachments
5. Advanced settings

Reason:

These improve trust and completeness but are not the main daily loop.

---

# 30. Recommended V2 MVP

The best V2 release should include:

1. Duplicate previous budget
2. Budget templates
3. Category transfers
4. Recurring expenses
5. Income tracking
6. Savings goals
7. Expense search and filtering
8. Budget review screen
9. Spending by category report
10. Budget vs actual report

Do not build everything in this PRD at once.

The strongest next product version is:

> Faster budget creation, recurring expense awareness, income tracking, savings goals, and simple reports.

That gives users a more complete personal finance app without turning it into a bloated bank-sync product.

```

## Suggested next step

Give this PRD to your coding agent with this instruction:

```md
Use the existing app as the baseline. Implement PRD V2 in phases. Start with Phase 1 only: duplicate previous budget, budget templates, category transfers, budget review, and expense search/filtering. Do not implement bank sync, AI advice, OCR, investments, or multi-user features.
```
