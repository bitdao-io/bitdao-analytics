import express from 'express'
import {Client} from '../stores'
import {
    Balances,
    ByBitContribution
} from "../stores/models";

export function NewAPI(ddb : Client) {
    const app = express()

    app.get('/balances.json', async (req, res) => {
        const balances = await ddb.GetCurrentBalances()
        res.send(balances.Items.map(b => Balances.FromDDB(b)))
    })

    app.get('/bybit-contributions.json', async (req, res) => {
        const contributions = await ddb.GetAllByBitContributions('2022-07-26')
        res.send(contributions.Items.map(c => ByBitContribution.FromDDB(c)))
    })

    return app
}
