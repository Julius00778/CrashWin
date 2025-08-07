import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { CrashEngine } from "./crashEngine";
import { insertBetSchema, insertChatMessageSchema } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const crashEngine = new CrashEngine();

  // Store connected clients
  const clients = new Set<WebSocketClient>();

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocketClient) => {
    ws.isAlive = true;
    clients.add(ws);

    // Send initial game state
    const gameState = crashEngine.getPublicGameState();
    ws.send(JSON.stringify({
      type: 'gameState',
      data: gameState,
    }));

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'authenticate':
            ws.userId = message.userId || 'default-user';
            console.log('=== SERVER: AUTHENTICATION ===');
            console.log('User ID:', ws.userId);
            ws.send(JSON.stringify({
              type: 'authenticated',
              data: { userId: ws.userId },
            }));
            break;

          case 'placeBet':
            console.log('=== SERVER: PLACE BET REQUEST ===');
            console.log('User ID:', ws.userId);
            console.log('Amount:', message.amount);
            console.log('Auto Cash Out:', message.autoCashOut);
            
            if (ws.userId) {
              const result = await crashEngine.placeBet(
                ws.userId,
                message.amount,
                message.autoCashOut
              );
              
              console.log('=== SERVER: BET RESULT ===');
              console.log('Result:', result);
              
              const response = {
                type: 'betPlaced',
                success: result.success,
                message: result.message,
                betId: result.betId,
                userId: ws.userId,
                amount: parseFloat(message.amount),
                username: 'Player' // Add username for chat notifications
              };
              
              console.log('=== SERVER: SENDING RESPONSE ===');
              console.log('Response:', response);
              
              ws.send(JSON.stringify(response));
            } else {
              console.error('No user ID for bet placement');
              ws.send(JSON.stringify({
                type: 'betPlaced',
                success: false,
                message: 'Not authenticated',
                userId: null,
                amount: parseFloat(message.amount)
              }));
            }
            break;

          case 'cashOut':
            if (ws.userId) {
              const result = await crashEngine.manualCashOut(ws.userId);
              ws.send(JSON.stringify({
                type: 'cashedOut',
                success: result.success,
                message: result.message,
                winAmount: result.winAmount,
                userId: ws.userId
              }));
            }
            break;

          case 'chatMessage':
            if (ws.userId && message.message) {
              const chatMessage = await storage.createChatMessage(ws.userId, {
                message: message.message,
              });
              
              // Broadcast to all clients
              const user = await storage.getUser(ws.userId);
              if (user) {
                broadcastToAll({
                  type: 'chatMessage',
                  data: {
                    id: chatMessage.id,
                    username: user.username,
                    avatar: user.avatar,
                    message: chatMessage.message,
                    timestamp: chatMessage.createdAt,
                  },
                });
              }
            }
            break;

          case 'ping':
            ws.isAlive = true;
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast function
  function broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Game engine event listeners
  crashEngine.on('gameStateUpdate', (gameState) => {
    broadcastToAll({
      type: 'gameState',
      data: gameState,
    });
  });

  crashEngine.on('gameCrashed', (data) => {
    broadcastToAll({
      type: 'gameCrashed',
      data,
    });
  });

  crashEngine.on('betPlaced', (data) => {
    broadcastToAll({
      type: 'betPlaced',
      data,
    });
  });

  crashEngine.on('betCashedOut', (data) => {
    broadcastToAll({
      type: 'betCashedOut',
      data,
    });
  });

  // Heartbeat to check connection health
  setInterval(() => {
    clients.forEach((client) => {
      if (!client.isAlive) {
        client.terminate();
        clients.delete(client);
        return;
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  // Test route
  app.get('/game', (req, res) => {
    res.send('<h1>TEST: /game route works! React app should load here.</h1>');
  });

  // REST API routes
  app.get('/api/user/:userId', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/user/:userId/stats', async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/recent-games', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const games = await storage.getRecentGames(limit);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/top-winners', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const winners = await storage.getTopWinners(limit);
      res.json(winners);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/chat/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getRecentChatMessages(limit);
      const messagesWithUsers = await Promise.all(
        messages.map(async (msg) => {
          const user = await storage.getUser(msg.userId);
          return {
            id: msg.id,
            username: user?.username || 'Unknown',
            avatar: user?.avatar,
            message: msg.message,
            timestamp: msg.createdAt,
          };
        })
      );
      res.json(messagesWithUsers);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
