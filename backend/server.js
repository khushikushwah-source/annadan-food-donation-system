const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const connectDB = require('./config/db');
const Listing = require('./models/Listing');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'Annadan backend chal raha hai!' });
});

// ─────────────────────────────────────────
// CRON JOB — Har 5 minute mein run hoga
// ─────────────────────────────────────────
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();

    // Jo listings expire ho gayi hain unhe find karo
    const expiredListings = await Listing.updateMany(
      {
        status: 'available',
        safeTime: { $lt: now },
      },
      {
        $set: { status: 'expired' }
      }
    );

    if (expiredListings.modifiedCount > 0) {
      console.log(`${expiredListings.modifiedCount} listings expire ho gayi — ${now.toLocaleTimeString()}`);
    }

  } catch (error) {
    console.error('Cron job error:', error);
  }
});

console.log('Auto-expire cron job shuru ho gaya — har 5 minute mein check hoga!');

// ─────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par`);
});