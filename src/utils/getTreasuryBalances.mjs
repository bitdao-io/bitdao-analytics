import env from 'dotenv';
import alasql from 'alasql';
import fetch from "node-fetch";

import {readFile, writeFile, mkdir} from 'fs/promises';

let conf = env.config({path: '.env'});
let etherscankey = conf.parsed.ETHERSCAN_API_KEY;

// works with multiple treasuries
// let treasuries = ["0x78605Df79524164911C144801f41e9811B7DB73D",
//   "0x78605Df79524164911C144801f41e9811B7DB73D"];

let treasuries = ["0x78605Df79524164911C144801f41e9811B7DB73D"];

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

async function run(treasury_address) {

  let url = getURL("txlist", treasury_address);

  url = getBalanceURL(treasury_address);
  console.log("balanceurl:", url);

  let ethContent;
  await fetch(url).then(res => {
    let e = res.clone();
    e.text().then(t => {
      // to write file out to disk
      // writeFile("log_balance_treasury_"+ (+new Date) + ".json", t);
    });
    return res;
  }).then(res => res.json())
  .then(out => {
    let r = alasql('SELECT `result`::NUMERIC / POWER(10, 18) as ethbal FROM ?', [[out]]);
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
      // to write file to disk
      // writeFile("log_tokentx_treasury_" + (+new Date) + ".json", t);
    });
    return res;
  })
  .then(res => res.json())
  .then(out => {
    content = out;
  }).catch(err => console.log(err));

  var res00 = alasql(
      'SELECT tokenSymbol, `value`::NUMERIC as `value`, `tokenDecimal`::NUMERIC as `tokenDecimal`, `from` as `from`, '
      + 'IF(LOWER(`from`) = LOWER("' + treasury_address + '"),-1,1) as `flow` '
      + 'FROM ?', [content.result]);

  var res0 = alasql(
      'SELECT tokenSymbol, SUM(`value` / POWER(10,`tokenDecimal`) * `flow`) as val '
      + 'FROM ? GROUP BY tokenSymbol', [res00]);
  // to write to csv file using alasql
  // var res1 = alasql('SELECT * INTO CSV("aggregated_treasury.json") FROM ?',
  //     [res0])

  res0 = res0.concat([{'tokenSymbol': 'ETH', 'val': ethContent[0].ethbal}]);

  return res0;
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
