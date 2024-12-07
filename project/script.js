const Binance = require("binance-api-node").default;
const { Telegraf } = require("telegraf");

// Telegram configuratie
const TELEGRAM_BOT_TOKEN = "7638432397:AAHPMzcMh2tPxwVshMQnKU2YZPkIj5ZVSU8";
const CHAT_ID = "7503111686";
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Binance configuratie
const client = Binance({
  apiKey: "jouw_binance_api_key",
  apiSecret: "jouw_binance_api_secret",
});

// Bereken RSI
function calculateRSI(closes, period = 14) {
  if (closes.length < period) {
    throw new Error("Niet genoeg data om RSI te berekenen");
  }

  let gains = [];
  let losses = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains.push(change);
    } else {
      losses.push(Math.abs(change));
    }
  }

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period || 0;
  const avgLoss =
    losses.slice(-period).reduce((a, b) => a + b, 0) / period || 0;

  if (avgLoss === 0) {
    return 100; // RSI is maximaal
  }

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Telegram notificaties
function sendTelegramMessage(message) {
  bot.telegram.sendMessage(CHAT_ID, message);
}

// Haal marktdata op en bereken signalen
async function checkMarket(symbol, i, coins) {
  try {
    const candles = await client.candles({
      symbol,
      interval: "1h",
      limit: 100,
    });

    const closes = candles.map((candle) => parseFloat(candle.close));

    // Check of er genoeg data is voor de RSI-berekening
    if (closes.length < 14) {
      console.error("Niet genoeg data om RSI te berekenen");
      return;
    }

    const rsi = calculateRSI(closes);
    console.log(`${coins} RSI: ${rsi}`);

    if (rsi <= 30) {
      sendTelegramMessage(`RSI = ${rsi.toFixed(2)} buy ${coins}`);
    } else if (rsi >= 70) {
      sendTelegramMessage(`RSI = ${rsi.toFixed(2)} sell ${coins}`);
    } else if (rsi > 65 && rsi < 70) {
      sendTelegramMessage(
        `RSI = ${rsi.toFixed(2)} warning: be ready to buy ${coins}`
      );
    } else if (rsi > 30 && rsi < 35) {
      sendTelegramMessage(
        `RSI = ${rsi.toFixed(2)} warning: be ready to sell ${coins}`
      );
    }
  } catch (error) {
    console.error(
      `Fout bij het ophalen van data voor ${symbol}:`,
      error.message
    );
  }
}

// Hoofdprogramma
const coins = [
  "XRP",
  "PEPE",
  "BTC",
  "SOL",
  "ETH",
  "DOGE",
  "WIF",
  "SHIB",
  "ADA",
  "BONK",
  "FLOKI",
  "XLM",
  "HBAR",
];
const symbol = "USDT";
setInterval(() => {
  for (i = 0; i < coins.length; i++) {
    checkMarket(coins[i] + symbol, i, coins[i]);
  }
  console.log("----------------------------------");
}, 2000); // Controleer elke 10 seconden
