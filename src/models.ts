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
    ethCount: number;
    ethPrice: number;
    ethAmount: number;
    usdtAmount: number;
    usdtCount: number;
    usdcAmount: number;
    usdcCount: number;
    tradeVolume: number;
    contributeVolume: number;
}

export default {
    Token,
    Prices,
    Contribution
}
