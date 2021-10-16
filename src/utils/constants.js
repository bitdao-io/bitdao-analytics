module.exports = {
    tokens: [
        {
            symbol: 'ETH'
        },
        {
            symbol: 'BIT',
            tokenAddress: '0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5'
        },
        {
            symbol: 'USDT',
            tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        },
        {
            symbol: 'USDC',
            tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        },
        {
            symbol: 'xSUSHI',
            tokenAddress: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272'
        }
    ],
    // should be changed when tokens array updated
    tokenSymbols: 'ETH,BIT,USDT,USDC,xSUSHI',
    erc20MinABI: [
        // balanceOf
        {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "type": "function"
        },
        // decimals
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint256" }],
            "type": "function"
        }
    ]
}