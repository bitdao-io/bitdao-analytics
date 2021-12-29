export class Token {
    symbol: string;
    address: string;
}

export class Prices {
    btc: number;
    eth: number;
}

export class Contribution {
    date: string;
    tradeVolume: number;
    contributeVolume: number;
    // ethCount: number;
    // ethPrice: number;
    ethAmount: number;
    usdtAmount: number;
    // usdtCount: number;
    usdcAmount: number;
    // usdcCount: number;
}

export class Symbols {
    inverse: string[]
    usdtPerpetual: string[]
};

export default {
    Token,
    Prices,
    Contribution,
    Symbols
}
