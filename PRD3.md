# Feature Scope: Investment Portfolio Tracker With Automatic Price Tracking Using Finnhub

## Context

The app is a budgeting and personal finance app.

It already supports:

- budget periods
- categories
- expenses
- SMS transaction imports
- reports/charts

We now want to add an investment module for users who invest in stocks and ETFs.

The user wants to track investments inside the same app with no extra paid infrastructure.

This must be a portfolio tracker, not a brokerage/trading app.

---

# Core Goal

Allow users to manually record investment activity while the app automatically tracks market price changes and calculates gains/losses.

The user should manually log:

- buys
- sells
- dividends
- deposits
- withdrawals
- fees
- stock splits

The user should NOT manually log:

- stock went up
- stock went down
- daily price movement
- daily portfolio value

The app should handle price movement automatically using Finnhub market data.

---

# Product Principle

The user records what they did.

The system calculates what happened after that.

Example:

User records:

```text
Bought 10 GOOG at $150
```

System automatically fetches later:

```text
GOOG latest price = $160
```

System calculates:

```text
Current value = 10 × 160 = 1,600
Unrealized gain = 1,600 - original cost basis
```

---

# Non-Goals

Do not build:

- trade execution
- brokerage integration
- Robinhood-style trading
- robo-advisor
- buy/sell recommendations
- tax reporting
- options tracking
- margin tracking
- futures
- forex trading
- crypto trading
- paid market data feeds

This is only a portfolio tracker.

---

# High-Level Flow

```text
User adds investment account
→ User adds asset, such as GOOG, AAPL, VOO, QQQ
→ User records buy/sell/dividend transactions
→ Daily cron job fetches latest prices from Finnhub
→ App stores price snapshots
→ App recalculates holdings
→ App calculates current value, gains, losses, and allocation
→ Investment dashboard updates
```

---

# Modules To Build

## 1. Investment Accounts

Users should be able to create investment accounts.

Examples:

- Interactive Brokers
- Sarwa
- Emirates NBD Securities
- Manual Portfolio
- Retirement Account

Fields:

```text
id
user_id
name
type
currency
created_at
updated_at
```

Account type values:

```text
brokerage
manual
retirement
other
```

---

## 2. Investment Assets

Users should be able to add stocks and ETFs.

Examples:

```text
GOOG | Alphabet Inc. | stock | NASDAQ | USD
AAPL | Apple Inc. | stock | NASDAQ | USD
VOO  | Vanguard S&P 500 ETF | etf | NYSEARCA | USD
QQQ  | Invesco QQQ ETF | etf | NASDAQ | USD
```

Fields:

```text
id
symbol
name
asset_type
exchange
currency
created_at
updated_at
```

Asset type values:

```text
stock
etf
mutual_fund
other
```

Initial supported assets:

- US stocks
- US ETFs

Do not build broad international support yet unless Finnhub symbol lookup confirms the symbol cleanly.

---

## 3. Investment Transactions

Investment transactions are the source of truth.

Every holding, gain, loss, and return calculation must come from transactions plus latest price snapshots.

Fields:

```text
id
user_id
investment_account_id
asset_id
type
quantity
price_per_unit
total_amount
fees
currency
transaction_date
note
created_at
updated_at
```

Transaction type values:

```text
buy
sell
dividend
deposit
withdrawal
fee
split
```

Important:

- Buy/sell require asset, quantity, and price_per_unit.
- Dividend requires asset and total_amount.
- Deposit/withdrawal can have no asset.
- Fee can either be linked to an asset or standalone.
- Split requires asset and split ratio.

---

## 4. Price Snapshots

The app must store market prices from Finnhub.

Do not only store the latest price on the asset record.

Store daily snapshots so charts and historical portfolio values can be built later.

Fields:

```text
id
asset_id
symbol
price
currency
source
price_date
raw_response_json
created_at
```

Source values:

```text
finnhub
manual
```

Important:

- Store one price snapshot per symbol per day.
- Avoid duplicate snapshots for the same symbol and price_date.
- Use upsert behavior.
- Store raw_response_json for debugging.

---

## 5. Holding Snapshots

HoldingSnapshot stores the calculated state of a user’s holding at a point in time.

This makes reports and charts easier.

Fields:

```text
id
user_id
investment_account_id
asset_id
quantity
average_cost
cost_basis
latest_price
current_value
unrealized_gain_loss
realized_gain_loss
dividends_received
standalone_fees
total_return
total_return_percentage
allocation_percentage
snapshot_date
created_at
```

Important:

- Holdings can be calculated live from transactions.
- But also store daily snapshots after price updates.
- Charts should read from HoldingSnapshot, not hit Finnhub repeatedly.

---

# Finnhub Market Data Integration

## Provider

Use Finnhub as the first market data provider.

Use environment variable:

```text
FINNHUB_API_KEY
```

Base URL:

```text
https://finnhub.io/api/v1
```

Quote endpoint:

```http
GET /quote?symbol=AAPL&token=FINNHUB_API_KEY
```

Full example:

```text
https://finnhub.io/api/v1/quote?symbol=AAPL&token=FINNHUB_API_KEY
```

Expected response shape:

```json
{
  "c": 190.15,
  "d": 1.25,
  "dp": 0.66,
  "h": 191.1,
  "l": 188.9,
  "o": 189,
  "pc": 188.9,
  "t": 1715846400
}
```

Use:

```text
c = current/latest price
t = timestamp
pc = previous close
```

If c is null, zero, or missing, treat quote as failed.

---

# Provider Abstraction

Do not hardcode Finnhub logic throughout the app.

Create a market data provider abstraction.

Example TypeScript interface:

```ts
export type Quote = {
  symbol: string;
  price: number;
  currency?: string;
  source: "finnhub" | "manual";
  timestamp?: Date;
  raw?: unknown;
};

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getBatchQuotes(symbols: string[]): Promise<Quote[]>;
}
```

Create implementation:

```ts
FinnhubMarketDataProvider implements MarketDataProvider
```

Even if Finnhub does not provide a clean batch quote endpoint for the selected plan, keep getBatchQuotes and internally loop through symbols with rate limiting.

---

# Finnhub Service Behavior

## getQuote(symbol)

Steps:

1. Validate symbol exists.
2. Call Finnhub quote endpoint.
3. Read `c` as latest price.
4. If price is invalid, throw provider error.
5. Return normalized Quote object.

Pseudo-code:

```ts
async function getQuote(symbol: string): Promise<Quote> {
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Finnhub quote failed for ${symbol}`);
  }

  const data = await res.json();

  if (!data.c || data.c <= 0) {
    throw new Error(`Invalid Finnhub price for ${symbol}`);
  }

  return {
    symbol,
    price: data.c,
    source: "finnhub",
    timestamp: data.t ? new Date(data.t * 1000) : new Date(),
    raw: data
  };
}
```

---

# Daily Price Update Job

Create a scheduled job endpoint:

```text
/api/cron/update-investment-prices
```

This should run once daily.

Recommended timing:

```text
After US market close
```

Do not fetch prices on every page load.

Do not fetch prices every minute.

Do not fetch the same symbol once per user.

---

## Daily Price Update Flow

### Step 1: Find tracked symbols

Find all unique active symbols across all users.

Example:

```text
AAPL
GOOG
VOO
QQQ
MSFT
```

Only include assets that have at least one active holding or at least one transaction.

---

### Step 2: Fetch each unique symbol once

Bad:

```text
User 1 owns AAPL
User 2 owns AAPL
User 3 owns AAPL

Fetch AAPL 3 times
```

Good:

```text
Unique symbols = AAPL
Fetch AAPL once
Apply the price to all users holding AAPL
```

---

### Step 3: Save PriceSnapshot

For each successful quote:

```text
asset_id
symbol
price
currency
source = finnhub
price_date = today
raw_response_json
```

Use upsert by:

```text
asset_id + price_date + source
```

---

### Step 4: Recalculate holdings

After storing prices:

1. Recalculate quantity
2. Recalculate average cost
3. Recalculate cost basis
4. Recalculate current value
5. Recalculate unrealized gain/loss
6. Recalculate realized gain/loss
7. Recalculate dividends received
8. Recalculate total return
9. Recalculate allocation percentages
10. Save HoldingSnapshot

---

### Step 5: Log job result

Create a job log table or use existing logging.

Track:

```text
job_name
started_at
finished_at
symbols_attempted
symbols_succeeded
symbols_failed
error_summary
created_at
```

---

# Market Data Failure Handling

If Finnhub fails for a symbol:

1. Do not break the entire job.
2. Log the failed symbol.
3. Keep using the last known price.
4. Mark price as stale in the UI.
5. Allow manual price override.

UI should show:

```text
Last updated: 2 days ago
```

not:

```text
$0
```

Never show zero as a real price unless the asset actually has zero value, which stocks/ETFs normally should not.

---

# Manual Price Override

Allow users to manually update price for an asset.

Example:

```text
GOOG = 162.00
```

This creates a PriceSnapshot:

```text
source = manual
price = 162.00
price_date = today
```

Use the latest available snapshot, whether source is:

```text
finnhub
manual
```

Manual override is a fallback, not the default behavior.

---

# Holding Calculation Rules

For each user + investment account + asset:

Sort all transactions by:

```text
transaction_date ASC
created_at ASC
```

Initialize:

```text
quantity = 0
cost_basis = 0
realized_gain_loss = 0
dividends_received = 0
standalone_fees = 0
cash_balance = 0
```

---

## Buy Transaction

Formula:

```text
buy_cost = quantity_bought × price_per_unit + fees
quantity += quantity_bought
cost_basis += buy_cost
cash_balance -= buy_cost
```

Example:

```text
Buy 10 GOOG at $150
Fee = $1

buy_cost = 10 × 150 + 1 = 1,501
quantity = 10
cost_basis = 1,501
average_cost = 150.10
```

---

## Sell Transaction

Use average cost basis for MVP.

Formula:

```text
average_cost_before_sale = cost_basis / quantity_before_sale
cost_removed = average_cost_before_sale × quantity_sold
sell_proceeds = quantity_sold × sell_price - fees
realized_gain_loss += sell_proceeds - cost_removed
quantity -= quantity_sold
cost_basis -= cost_removed
cash_balance += sell_proceeds
```

Validation:

```text
sell quantity cannot exceed current owned quantity
```

Example:

```text
Own 10 GOOG
Cost basis = 1,500
Average cost = 150

Sell 3 GOOG at 170
Fee = 1

sell_proceeds = 3 × 170 - 1 = 509
cost_removed = 3 × 150 = 450
realized_gain = 509 - 450 = 59

remaining quantity = 7
remaining cost_basis = 1,050
```

---

## Dividend Transaction

Formula:

```text
dividends_received += total_amount
cash_balance += total_amount
```

Important:

Dividends do not increase quantity automatically.

If dividend reinvestment happens, user should record:

1. dividend received
2. buy transaction using dividend amount

Do not auto-create reinvestment unless explicitly supported later.

---

## Deposit Transaction

Formula:

```text
cash_balance += total_amount
```

Deposits are not profit.

They are external money added to the investment account.

---

## Withdrawal Transaction

Formula:

```text
cash_balance -= total_amount
```

Withdrawals are not losses.

They are external money removed from the investment account.

---

## Fee Transaction

If fee is tied to a buy/sell transaction, include it in that transaction.

If standalone fee:

```text
standalone_fees += total_amount
cash_balance -= total_amount
```

---

## Stock Split Transaction

Fields needed:

```text
split_ratio_numerator
split_ratio_denominator
```

Example:

```text
2-for-1 split
numerator = 2
denominator = 1
```

Formula:

```text
quantity = quantity × numerator / denominator
cost_basis remains unchanged
average_cost changes automatically
```

---

# Latest Holding Metrics

After processing transactions and latest price:

```text
current_value = quantity × latest_price
average_cost = cost_basis / quantity
unrealized_gain_loss = current_value - cost_basis
total_return = unrealized_gain_loss + realized_gain_loss + dividends_received - standalone_fees
```

If quantity is zero:

```text
current_value = 0
average_cost = 0
unrealized_gain_loss = 0
```

---

# Portfolio-Level Metrics

For each user:

```text
total_portfolio_value = sum(current_value across holdings) + cash_balance
total_cost_basis = sum(cost_basis across holdings)
total_unrealized_gain_loss = sum(unrealized_gain_loss)
total_realized_gain_loss = sum(realized_gain_loss)
total_dividends_received = sum(dividends_received)
total_return = total_unrealized_gain_loss + total_realized_gain_loss + total_dividends_received - total_standalone_fees
```

Total return percentage:

```text
total_return_percentage = total_return / total_invested × 100
```

Be careful:

Deposits are not returns.
Withdrawals are not losses.
Dividends are returns.
Realized gains are returns.
Unrealized gains are returns on open holdings.

---

# Allocation Calculation

For each holding:

```text
allocation_percentage = current_value / total_holdings_value × 100
```

Use holdings value only, not cash, unless showing cash allocation separately.

Example:

```text
VOO = $7,000
GOOG = $2,000
Cash = $1,000

Holdings-only allocation:
VOO = 77.8%
GOOG = 22.2%

Portfolio allocation including cash:
VOO = 70%
GOOG = 20%
Cash = 10%
```

Show both later if needed.

---

# Screens To Build

## 1. Investments Dashboard

Show:

```text
Total portfolio value
Total holdings value
Cash balance
Total invested
Unrealized gain/loss
Realized gain/loss
Dividends received
Total return
Total return percentage
Last price update timestamp
```

Also show:

```text
Top holdings
Recent investment transactions
Stale price warnings
```

---

## 2. Investment Accounts Screen

User can:

```text
create account
edit account
archive account
view account-specific holdings
view account cash balance
```

---

## 3. Holdings Screen

Table columns:

```text
Symbol
Name
Quantity
Average Cost
Latest Price
Current Value
Unrealized P/L
Allocation %
Last Updated
```

Row example:

```text
GOOG | Alphabet Inc. | 10 | 150.10 | 160.00 | 1,600.00 | +99.00 | 12.8% | Today
```

---

## 4. Add Investment Transaction Screen

User selects:

```text
account
transaction type
asset
quantity
price per unit
fees
total amount
date
note
```

For buy/sell:

```text
quantity × price_per_unit + fees = total_amount
```

Allow the app to calculate total amount automatically, but let user override if needed.

---

## 5. Asset Detail Screen

Show:

```text
symbol
name
asset type
exchange
quantity owned
average cost
latest price
current value
unrealized gain/loss
realized gain/loss
dividends received
total return
transaction history
price history
```

---

## 6. Portfolio Reports

Build charts after calculation engine works.

Reports:

```text
Portfolio value over time
Allocation by asset
Allocation by asset type
Gain/loss over time
Dividends over time
Realized vs unrealized gains
```

Use HoldingSnapshot and PriceSnapshot.

Do not call Finnhub to render charts.

Charts should use stored data.

---

# Relationship With Budgeting Module

Keep budgeting and investments separate.

Do not mix investment transactions into expense transactions directly.

However, allow a light connection later:

Example:

```text
Budget category: Investments
Expense: 1,000 AED invested
Investment account: deposit 1,000 AED
```

Do not build this linkage in the first investment release unless easy.

For now:

```text
Budgeting = monthly money planning
Investments = portfolio tracking
```

---

# Validation Rules

## Asset

```text
symbol is required
name is required
asset_type is required
currency is required
```

## Buy

```text
account is required
asset is required
quantity > 0
price_per_unit > 0
fees >= 0
transaction_date is required
```

## Sell

```text
account is required
asset is required
quantity > 0
price_per_unit > 0
fees >= 0
quantity cannot exceed currently owned quantity
transaction_date is required
```

## Dividend

```text
account is required
asset is required
total_amount > 0
transaction_date is required
```

## Deposit

```text
account is required
total_amount > 0
transaction_date is required
```

## Withdrawal

```text
account is required
total_amount > 0
cash balance should not go negative unless user confirms
transaction_date is required
```

## Manual Price

```text
asset is required
price > 0
price_date is required
```

---

# Security And Reliability

## API Key

Store Finnhub API key only in server-side environment variables.

Do not expose it to the frontend.

```text
FINNHUB_API_KEY=
```

All Finnhub calls must happen server-side.

---

## Rate Limit Protection

The system must minimize API usage.

Rules:

```text
fetch once daily
fetch unique symbols only
do not fetch on page load
do not fetch per user
cache price snapshots
retry failed symbols carefully
```

If the app grows beyond the free plan, we can later:

```text
reduce fetch frequency
limit tracked symbols per user
add paid plan
switch provider
use another data source
```

---

## Cron Security

Protect the cron endpoint.

Use a secret:

```text
CRON_SECRET=
```

Cron request must include:

```http
Authorization: Bearer CRON_SECRET
```

Reject unauthorized requests.

---

# API Routes

Create these routes or equivalents based on the existing app structure.

## Investment Accounts

```text
GET    /api/investments/accounts
POST   /api/investments/accounts
PATCH  /api/investments/accounts/:id
DELETE /api/investments/accounts/:id
```

## Assets

```text
GET    /api/investments/assets
POST   /api/investments/assets
PATCH  /api/investments/assets/:id
```

## Transactions

```text
GET    /api/investments/transactions
POST   /api/investments/transactions
PATCH  /api/investments/transactions/:id
DELETE /api/investments/transactions/:id
```

## Holdings

```text
GET /api/investments/holdings
```

## Dashboard

```text
GET /api/investments/dashboard
```

## Manual Price

```text
POST /api/investments/assets/:id/manual-price
```

## Cron

```text
POST /api/cron/update-investment-prices
```

---

# Cron Job Pseudo-Code

```ts
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assets = await db.investmentAsset.findMany({
    where: {
      transactions: {
        some: {}
      }
    },
    select: {
      id: true,
      symbol: true,
      currency: true
    }
  });

  const uniqueAssets = dedupeBySymbol(assets);

  const provider = new FinnhubMarketDataProvider(process.env.FINNHUB_API_KEY);

  const results = [];

  for (const asset of uniqueAssets) {
    try {
      const quote = await provider.getQuote(asset.symbol);

      await db.priceSnapshot.upsert({
        where: {
          assetId_priceDate_source: {
            assetId: asset.id,
            priceDate: today(),
            source: "finnhub"
          }
        },
        update: {
          price: quote.price,
          rawResponseJson: quote.raw
        },
        create: {
          assetId: asset.id,
          symbol: asset.symbol,
          price: quote.price,
          currency: asset.currency,
          source: "finnhub",
          priceDate: today(),
          rawResponseJson: quote.raw
        }
      });

      results.push({ symbol: asset.symbol, status: "success" });
    } catch (error) {
      results.push({
        symbol: asset.symbol,
        status: "failed",
        error: String(error)
      });
    }
  }

  await recalculateAllInvestmentHoldings();

  return Response.json({
    success: true,
    results
  });
}
```

---

# Recalculation Pseudo-Code

```ts
async function recalculateHolding(userId, accountId, assetId) {
  const transactions = await getTransactions(userId, accountId, assetId);
  const latestPrice = await getLatestPrice(assetId);

  let quantity = 0;
  let costBasis = 0;
  let realizedGainLoss = 0;
  let dividendsReceived = 0;
  let standaloneFees = 0;

  for (const tx of transactions) {
    if (tx.type === "buy") {
      const buyCost = tx.quantity * tx.pricePerUnit + tx.fees;
      quantity += tx.quantity;
      costBasis += buyCost;
    }

    if (tx.type === "sell") {
      const averageCost = quantity > 0 ? costBasis / quantity : 0;
      const costRemoved = averageCost * tx.quantity;
      const sellProceeds = tx.quantity * tx.pricePerUnit - tx.fees;

      realizedGainLoss += sellProceeds - costRemoved;
      quantity -= tx.quantity;
      costBasis -= costRemoved;
    }

    if (tx.type === "dividend") {
      dividendsReceived += tx.totalAmount;
    }

    if (tx.type === "fee") {
      standaloneFees += tx.totalAmount;
    }

    if (tx.type === "split") {
      quantity = quantity * tx.splitRatioNumerator / tx.splitRatioDenominator;
    }
  }

  const currentValue = quantity * latestPrice;
  const averageCost = quantity > 0 ? costBasis / quantity : 0;
  const unrealizedGainLoss = currentValue - costBasis;
  const totalReturn =
    unrealizedGainLoss +
    realizedGainLoss +
    dividendsReceived -
    standaloneFees;

  return {
    quantity,
    averageCost,
    costBasis,
    latestPrice,
    currentValue,
    unrealizedGainLoss,
    realizedGainLoss,
    dividendsReceived,
    standaloneFees,
    totalReturn
  };
}
```

---

# Empty States

## No investment account

Show:

```text
Start tracking your investments by creating your first investment account.
```

CTA:

```text
Create Investment Account
```

## No holdings

Show:

```text
Add your first stock or ETF transaction to see your holdings and performance.
```

CTA:

```text
Add Investment Transaction
```

## No price data

Show:

```text
Price data has not been updated yet. The app will update prices automatically, or you can enter a manual price.
```

CTA:

```text
Update Price Manually
```

---

# User Experience Requirements

The investment module should feel simple.

Avoid advanced finance jargon unless necessary.

Use clear labels:

```text
Invested
Current Value
Profit/Loss
Dividends
Cash
Allocation
```

Avoid confusing labels:

```text
alpha
beta
Sharpe ratio
time-weighted return
money-weighted return
IRR
```

Those can come much later.

---

# Build Order

Build in this order:

## Phase 1: Core Manual Tracking

1. Investment accounts
2. Assets
3. Buy transaction
4. Sell transaction
5. Dividend transaction
6. Holdings calculation
7. Holdings screen

## Phase 2: Finnhub Price Tracking

1. Finnhub provider
2. PriceSnapshot table
3. Daily cron job
4. Latest price display
5. Unrealized gain/loss calculation
6. Stale price handling
7. Manual price fallback

## Phase 3: Dashboard

1. Total portfolio value
2. Total invested
3. Unrealized gain/loss
4. Realized gain/loss
5. Dividends received
6. Total return
7. Top holdings

## Phase 4: Reports and Charts

1. Portfolio value over time
2. Allocation by asset
3. Allocation by asset type
4. Dividends over time
5. Gain/loss over time

Do not build charts before the calculation engine is correct.

---

# Success Criteria

The feature is complete when:

1. User can create an investment account.
2. User can add stock/ETF assets.
3. User can record buy transactions.
4. User can record sell transactions.
5. User can record dividends.
6. App fetches latest prices from Finnhub once daily.
7. App stores price snapshots.
8. App calculates current holding value.
9. App calculates unrealized gain/loss.
10. App calculates realized gain/loss.
11. App calculates dividends received.
12. App shows holdings table.
13. App shows investment dashboard.
14. User does not need to manually log market movement.
15. If Finnhub fails, the app keeps last known prices and does not break.
16. Manual price override exists as fallback.

---

# Final Product Behavior

The user experience should be:

```text
I bought VOO and GOOG.
I entered the buys once.
Every day the app updates their prices.
The app shows my portfolio value, gains, losses, allocation, and dividends.
I never manually enter daily price movement.
```