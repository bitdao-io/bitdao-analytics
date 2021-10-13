# Treasury and Analytics

This specification provides details of BitDAO treasury and analytics pages, as well as associated
required services.

We first describe how services are constructed, then we describe how the data is presented to users.

The treasury and analytics approach taken here is based on daily values. This specification is not
intended to serve shorter periods or live updates (the backend services will need to be re-evaluated
for performance and flexibility, and likely requires rebuilding).

## Features

- Idempotent pipeline
- Static page generation
- Serverless using object storage, i.e., no key-value stores or relational database administration
- Decentralized analytics by enabling self-contained pages

## Analytics

Data retrieval:

- A serverless code executable retrieves token quantities and spot prices once a day.
- Retrieved values are saved to S3 (as CSV or JSON) using the following filename convention:
  - {token}-{yyyy}-{mm}-{dd}.json
- If spot prices are pulled from multiple sources, use the
  following filename convention:
  - {source}-{token}-{yyyy}-{mm}-{dd}.json
- Optional: Retrieve spot prices from multiple sources and store in the same file, simply add a source field

#### Token quantity specification:

| Field | Type | Description |
| ---- | ---- | ---- |
| yyyy | number | Year of retrieved value: MUST equal 2021 | 
| mm | number | Month of retrieved value: MUST be between 1 and 12 | 
| dd | number | Day of retrieved value: MUST be between 1 and 31 (validation tbd) |
| token | String | Short token identifier, e.g., BIT, BTC, ETH, USDC, USDT | 
| quantity | BigInt | Number of tokens: MUST be greater than or equal to 0: MUST support BigInt |
| source | String | The url where this row's value was obtained, e.g., https://coinmarketcap.com/currencies/bitdao/ | 

#### Spot price specification:

| Field | Type | Description |
| ---- | ---- | ---- |
| yyyy | number | Year of retrieved value: MUST equal 2021 |
| mm | number | Month of retrieved value: MUST be between 1 and 12 |
| dd | number | Day of retrieved value: MUST be between 1 and 31 (validation tbd) |
| token | String | Short token identifier, e.g., BIT, BTC, ETH, USDC, USDT |
| price | Decimal | Price of token: must accommodate exactly 2 decimal places, greater than 0, less than 5,000 |
| source | String | The url where this row's value was obtained, e.g., https://coinmarketcap.com/currencies/bitdao/ | 

## Building daily static page

Procedure to build static page:

1. Retrieve token spot price and store on S3
   1. Copy content of existing data file and store with a new name
2. Retrieve token amounts from BitDAO treasury
    1. Copy content of existing data file and store with a new name
3. Generate the static html page with links pointing to the latest data files
4. Include analytics javascript library to allow online aggregation 

## Treasury, Holdings

Display current ERC-20 token balance of the following coins:

- BIT
- USDT
- USDC
- xSUSHI

## Treasury, Inbound

- Should support reconciliation
- Reconciliation should not change past events and their computation
    - historical values should be hard coded
- Should support changing expected contribution amounts, e.g,. 50/50 BTC to ETH vs more tokens.
    - BitDAO has [pledged](https://docs.bitdao.io/partners/bybit-pledge) 50% ETH, 25% USDT, 25% USDC
- Day start = UTC 0, Day end = UTC 0
- USDT and USDC price will be $1.00 for simplicity
- Other Asset price feed based on Index Price (currently the weighted average of Kraken, Gemini,
  Coinbase Pro, Bittrex, and Bitstamp spot pairs) as described
  here https://help.bybit.com/hc/en-us/articles/360039261094
- Expected value sources can vary, currently includes:
    - ByBit
        - Futures products only (linear and inverse perpetual contracts, quarterly futures
          contracts, etc.)
        - Initial Contributed Asset mix: 50% ETH, 25% USDT, 25% USDC
        - Daily trade volume as provided by Bybit API to CoinGecko
        - Daily trade volume converted to units of each Contributed Asset at end of day's CoinGecko
          price
        - Contribution start date: July 15, 2021
        - At the start, the injections will be monthly. Based on the cumulative units of each
          Contributed Asset (derived from the daily calculations).
        - Contributions from Bybit will come from the following wallets:
          0x6a159503e49ddB8E49659D6CACf5236aC4213D86

### An Example

- Day trade volume $10,000,000,000
- ETH price $2,500, USDT price $1, USDC price $1
- Daily contribution value (2.5bps) = $2,500,000
- Asset to be contributed = 500 ETH units, 625,000 USDT units, 625,000 USDC units

## Treasury, Outbound

- Should support some form of reconciliation
- Reconciliation should not change past events and their computation
    - historical values should be hard coded

### Data Sources

- support 1+ spot price feed sources
- support spot price feed period

Use the following sources to retrieve token quantities:

- https://etherscan.io/address/0x78605df79524164911c144801f41e9811b7db73d

Use the following sources to retrieve the spot prices:

- https://coinmarketcap.com/currencies/bitdao/

Use the following sources to retrieve ByBit spot volume:

- https://www.coingecko.com/en/exchanges/bybit_spot

## Technology Stack

- serverless: AWS Lambda in javascript
- HTML w javascript
- JSON, CSV
- AWS S3 object storage

- Typescript is not planned for use in this project since it requires compilation as well access to
  all project files. It's much easier to generate a static page using output from javascript. 