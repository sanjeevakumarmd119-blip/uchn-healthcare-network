import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { setSocketIO } from './src/server/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  setSocketIO(io);

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user-specific room for private alerts & queue updates
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    // Join clinic-specific room for clinical operations
    socket.on('join:clinic', (clinicId: string) => {
      if (clinicId) {
        socket.join(`clinic:${clinicId}`);
        console.log(`🏥 Socket ${socket.id} joined clinic room: clinic:${clinicId}`);
      }
    });

    // Join global emergency channel
    socket.on('join:emergency', () => {
      socket.join('emergency:all');
      console.log(`🚨 Socket ${socket.id} joined emergency broadcast channel`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> UCHN Full-Stack Web Application ready on http://${hostname}:${port}`);
    console.log(`> Real-time Socket.IO Engine listening on port ${port}`);
  });
});

