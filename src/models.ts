export class Token {
    symbol: string;
    address: string;
}

export class Prices {
    btc: number;
    eth: number;
    bit: number;
}

export class Contribution {
    date: string;
    tradeVolume: number;
    contributeVolume: number;
    ethCount: number;
    ethPrice: number;
    bitPrice: number;
    ethAmount: number;
    usdtAmount: number;
    usdtCount: number;
    usdcAmount: number;
    usdcCount: number;
    bitAmount: number;
    bitCount: number;
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
