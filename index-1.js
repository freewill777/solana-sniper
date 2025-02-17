require("dotenv").config();
const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');
const { TradingBot } = require("./useBot");

const app = express();
const port = 3001;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'client3/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client3/dist', 'index.html'));
});

class BotManager {
  constructor(ws) {
    this.ws = ws;
    this.bot = new TradingBot((data) => this.ws.send(JSON.stringify({ type: 'buy_order', data })));
    this.isRunning = false;
    this.buyMonitorPromise = null;
    this.positionMonitorPromise = null;
  }

  async start() {
    if (this.isRunning) return;

    try {
      await this.bot.initialize();
      this.isRunning = true;

      // Start monitors and store their promises
      this.buyMonitorPromise = this.bot.buyMonitor();
      this.positionMonitorPromise = this.bot.positionMonitor();

      this.ws.send(JSON.stringify({ type: 'status', data: 'Bot started successfully' }));
    } catch (error) {
      this.ws.send(JSON.stringify({ type: 'error', data: `Failed to start bot: ${error.message}` }));
    }
  }

  async stop() {
    this.isRunning = false;
    this.bot.abortBot()
    this.ws.send(JSON.stringify({ type: 'status', data: 'Bot stopped successfully' }));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      positions: Array.from(this.bot.positions.entries()),
      soldPositions: this.bot.soldPositions
    };
  }
}
let botManagerRef = null;
app.get('/status', (req, res) => {
  res.json(botManagerRef ? botManagerRef.getStatus() : { isRunning: false });

});

// wss.on('connection', (ws) => {
//   console.log('Client connected');
//   let counter = 0

//   const interval = setInterval(() => {
//     ws.send(counter);
//     counter = counter + 1;
//   }, 3000);

//   const bot = new TradingBot((data) => ws.send("BUY ORDER: " + data));
//   bot.start().catch((error) => console.error("Error in bot execution", error));

//   ws.on('close', () => {
//     console.log('Client disconnected');
//     clearInterval(interval);
//   });
// });

wss.on('connection', (ws) => {
  console.log('Client connected');
  const botManager = new BotManager(ws);
  botManagerRef = botManager;
  ws.on('message', async (message) => {
    try {
      const data = message.toString();
      console.log('Received message data:', data);

      switch (data) {
        case 'start':
          await botManager.start();
          break;
        case 'stop':
          await botManager.stop();
          break;
        case 'status':
          ws.send(JSON.stringify({
            type: 'status_update',
            data: botManager.getStatus()
          }));
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: `Unknown command: ${data.command}`
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: `Error processing command: ${error.message}`
      }));
    }
  });

  ws.on('close', async () => {
    console.log('Client disconnected');
    await botManager.stop();
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});