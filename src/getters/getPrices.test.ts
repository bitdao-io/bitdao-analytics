import {
    GetBTCPrice,
    GetETHPrice,
    GetTokenPrice
} from "./getPrices";

describe('getPrices', () => {
    it('should return a reasonable current price for BTC', async () => {
        const p = await GetBTCPrice()
        expect(p > 2000 && p < 100000).toBe(true)
    })

    it('should return a reasonable current price for ETH', async () => {
        const p = await GetETHPrice()
        expect(p > 500 && p < 20000).toBe(true)
    })

    it('should return a reasonable current price for $BIT', async () => {
        const p = await GetTokenPrice('0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5')
        expect(p > 0.01 && p < 100).toBe(true)
    })
})
