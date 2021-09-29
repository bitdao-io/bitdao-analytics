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
    - {token}-{yyyy}-{mm}-{dd}.json- If spot prices are pulled from multiple sources, use the
      following filename convention:
- Optional: Retrieve spot prices from multiple sources and store in the same file

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

1. Retrieve token spot price S3
2. Retrieve token amount from BitDAO treasury
3. Generate the static page with links pointing to the latest data files

## Treasury, Holdings

Display current ERC-20 token balance of the following coins:

- BIT
- USDT
- USDC
- xSUSHI

## Treasury, Inbound

Display

## Treasury, Outbound

### Data Sources

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