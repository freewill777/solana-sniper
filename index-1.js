require("dotenv").config();
const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { TradingBot } = require("./useBot");

const app = express();
const port = 3001;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors()); 
app.use(express.static(path.join(__dirname, 'client3/dist')));
app.use(express.json());

class BotManager {
  constructor(ws) {
    this.ws = ws;
    this.bot = new TradingBot((data) => this.ws.send(JSON.stringify({ type: 'buy_order', data })));
    this.isRunning = false;
    this.buyMonitorPromise = null;
    this.positionMonitorPromise = null;

    this.bot.config = {
      minLiquidity: 1000,
      maxLiquidity: 1000000,
      minMarketCap: 2000,
      maxMarketCap: 10000000,
      minRiskScore: 0,
      maxRiskScore: 3,
      requireSocialData: true,
      markets: ['raydium', 'orca', 'pumpfun', 'moonshot', 'raydium-cpmm'],
      ...this.bot.config 
    };
  }

  updateFilters(filters) {
    if (!this.bot?.config) return null;

    this.bot.config = {
      ...this.bot.config,
      minLiquidity: filters.minLiquidity ?? this.bot.config.minLiquidity,
      maxLiquidity: filters.maxLiquidity ?? this.bot.config.maxLiquidity,
      minMarketCap: filters.minMarketCap ?? this.bot.config.minMarketCap,
      maxMarketCap: filters.maxMarketCap ?? this.bot.config.maxMarketCap,
      minRiskScore: filters.minRiskScore ?? this.bot.config.minRiskScore,
      maxRiskScore: filters.maxRiskScore ?? this.bot.config.maxRiskScore,
      requireSocialData: filters.requireSocialData ?? this.bot.config.requireSocialData,
      markets: filters.markets ?? this.bot.config.markets
    };

    return this.getFilters();
  }

  getFilters() {
    return {
      minLiquidity: this.bot.config.minLiquidity,
      maxLiquidity: this.bot.config.maxLiquidity,
      minMarketCap: this.bot.config.minMarketCap,
      maxMarketCap: this.bot.config.maxMarketCap,
      minRiskScore: this.bot.config.minRiskScore,
      maxRiskScore: this.bot.config.maxRiskScore,
      requireSocialData: this.bot.config.requireSocialData,
      markets: this.bot.config.markets
    };
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

let defaultBotManager = new BotManager(null);
let botManagerRef = defaultBotManager;

app.get('/status', (req, res) => {
  res.json(botManagerRef ? botManagerRef.getStatus() : { isRunning: false });
});

app.get('/filters', (req, res) => {
  if (!botManagerRef) {
    return res.status(400).json({ error: 'Bot manager not initialized' });
  }
  res.json(botManagerRef.getFilters());
});

app.post('/filters', (req, res) => {
  try {
    if (!botManagerRef?.bot?.config) {
      return res.status(400).json({ error: 'Bot not initialized' });
    }

    const filters = req.body;
    validateFilters(filters);
    const updatedFilters = botManagerRef.updateFilters(filters);
    defaultBotManager.bot.config = { ...updatedFilters };

    if (!updatedFilters) {
      return res.status(400).json({ error: 'Failed to update filters' });
    }

    return res.json(updatedFilters);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client3/dist', 'index.html'));
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  const botManager = new BotManager(ws);
  botManager.bot.config = { ...defaultBotManager.bot.config };
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
          botManagerRef = defaultBotManager;
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

function validateFilters(filters) {
  const errors = [];

  if (filters.minLiquidity !== undefined) {
    if (typeof filters.minLiquidity !== 'number' || filters.minLiquidity < 0) {
      errors.push('minLiquidity must be a non-negative number');
    }
  }

  if (filters.maxLiquidity !== undefined) {
    if (typeof filters.maxLiquidity !== 'number' || filters.maxLiquidity < 0) {
      errors.push('maxLiquidity must be a non-negative number');
    }
  }

  if (filters.minMarketCap !== undefined) {
    if (typeof filters.minMarketCap !== 'number' || filters.minMarketCap < 0) {
      errors.push('minMarketCap must be a non-negative number');
    }
  }

  if (filters.maxMarketCap !== undefined) {
    if (typeof filters.maxMarketCap !== 'number' || filters.maxMarketCap < 0) {
      errors.push('maxMarketCap must be a non-negative number');
    }
  }

  if (filters.minRiskScore !== undefined) {
    if (!Number.isInteger(filters.minRiskScore) || filters.minRiskScore < 0 || filters.minRiskScore > 10) {
      errors.push('minRiskScore must be an integer between 0 and 10');
    }
  }

  if (filters.maxRiskScore !== undefined) {
    if (!Number.isInteger(filters.maxRiskScore) || filters.maxRiskScore < 0 || filters.maxRiskScore > 10) {
      errors.push('maxRiskScore must be an integer between 0 and 10');
    }
  }

  if (filters.requireSocialData !== undefined) {
    if (typeof filters.requireSocialData !== 'boolean') {
      errors.push('requireSocialData must be a boolean');
    }
  }

  if (filters.markets !== undefined) {
    if (!Array.isArray(filters.markets) || !filters.markets.every(market => typeof market === 'string')) {
      errors.push('markets must be an array of strings');
    }
  }

  // Check relationships between min/max values
  if (filters.minLiquidity !== undefined && filters.maxLiquidity !== undefined) {
    if (filters.minLiquidity > filters.maxLiquidity) {
      errors.push('minLiquidity cannot be greater than maxLiquidity');
    }
  }

  if (filters.minMarketCap !== undefined && filters.maxMarketCap !== undefined) {
    if (filters.minMarketCap > filters.maxMarketCap) {
      errors.push('minMarketCap cannot be greater than maxMarketCap');
    }
  }

  if (filters.minRiskScore !== undefined && filters.maxRiskScore !== undefined) {
    if (filters.minRiskScore > filters.maxRiskScore) {
      errors.push('minRiskScore cannot be greater than maxRiskScore');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}