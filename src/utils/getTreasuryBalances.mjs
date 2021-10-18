import env from 'dotenv';

// let conf = env.config({path: '../../.env'}); // works on command line
let conf = env.config({path: '.env'}); // works w yarn

import alasql from 'alasql';
import fetch from "node-fetch";

import {readFile, writeFile, mkdir} from 'fs/promises';

// console.log("conf:", conf);

let etherscankey = conf.parsed.ETHERSCAN_API_KEY;
// console.log("etherscankey:", etherscankey);

let treasuries = ["0x78605Df79524164911C144801f41e9811B7DB73D",
  "0x78605Df79524164911C144801f41e9811B7DB73D"]; // works with multiple treasuries

// treasuries = ["0x78605Df79524164911C144801f41e9811B7DB73D"];

function getURL(action, address) {
  let t = 'https://api.etherscan.io/api'
      + '?module=account'
      + '&action=' + action
      + '&address=' + address
      + '&startblock=0'
      + '&endblock=99999999'
      + '&page=1'
      + '&offset=10000'
      + '&sort=asc'
      + '&apikey=' + etherscankey;

  return t;
}

function getBalanceURL(address) {
  let t = "https://api.etherscan.io/api"
      + "?module=account"
      + "&action=balance"
      + '&address=' + address
      + "&tag=latest"
      + '&apikey=' + etherscankey;

  return t;
}

// not available - only avail with Pro account
// function getHistoricalBalance(address, blockno) {
//   let t = "https://api.etherscan.io/api"
//       + "?module=account"
//       + "&action=balancehistory"
//       + '&address=' + address
//       + '&blockno=' + block
//       + '&apikey=' + etherscankey;
//
//   return t;
// }

async function run(treasury_address) {

  let url = getURL("txlist", treasury_address);

  url = getBalanceURL(treasury_address);
  console.log("balanceurl:", url);

  let ethContent;
  await fetch(url).then(res => {
    let e = res.clone();
    e.text().then(t => {
      writeFile("log_balance_treasury_"+ (+new Date) + ".json", t);
    });
    return res;
  }).then(res => res.json())
  .then(out => {
    // console.log("balance:", out);
    let r = alasql('SELECT `result`::NUMERIC / POWER(10, 18) as ethbal FROM ?', [[out]]);
    // console.log("balance r:", r);
    ethContent = r;
  });

  console.log(url);
  console.log("\n");

  url = getURL("tokentx", treasury_address);

  console.log(url);
  console.log("\n");

  let content = null;
  await fetch(url)
  .then(res => {
    let e = res.clone();
    e.text().then(t => {
      writeFile("log_tokentx_treasury_" + (+new Date) + ".json", t);
    });
    return res;
  })
  .then(res => res.json())
  .then(out => {
    // console.log(out);
    // writeFile("log_stuff.json", out);
    content = out;
  }).catch(err => console.log(err));

  // console.log("content:result:", content.result);

  var res00 = alasql(
      'SELECT tokenSymbol, `value`::NUMERIC as `value`, `tokenDecimal`::NUMERIC as `tokenDecimal`, `from` as `from`, '
      + 'IF(LOWER(`from`) = LOWER("' + treasury_address + '"),-1,1) as `flow` '
      + 'FROM ?', [content.result]);

  // console.log(res00);

  var res0 = alasql(
      'SELECT tokenSymbol, SUM(`value` / POWER(10,`tokenDecimal`) * `flow`) as val '
      + 'FROM ? GROUP BY tokenSymbol', [res00]);
  var res1 = alasql('SELECT * INTO CSV("aggregated_treasury.json") FROM ?',
      [res0])
// writeFile("aggregated_treasury.json", JSON.stringify(res0, null, 4));
//   console.log(res0);
  // await console.log(res1);

  res0 = res0.concat([{'tokenSymbol': 'ETH', 'val': ethContent[0].ethbal}]);

  return res0;

// let content = null;
// await fetch(bitdao_url)
// .then(res => res.json())
// .then(out => {
//   console.log(out);
//   content = out;
// }).catch(err => console.log(err));

}

function treasuryAggr(treasuries) {
  var r = alasql(
      'SELECT `tokenSymbol`, SUM(`val`) as sumval FROM ? GROUP BY `tokenSymbol`',
      [treasuries]);
  return r;
}

let tall = [];

async function mainrun() {
  let res;
  let tt = [];
  let p = Promise.all(treasuries.map(async (t, i) => {
    await run(t).then(r => {
      console.log("treasury " + i + ":", r);
      tt = tt.concat(r);
    });
  }));
  await p.then(_ => {
    res = treasuryAggr(tt);
  });
  return res;
}

let tagg = await mainrun();
console.log("treasuryagg:", tagg);
