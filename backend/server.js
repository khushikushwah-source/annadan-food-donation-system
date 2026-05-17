const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

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

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Annadan backend chal raha hai!' });
});

// SOCKET.IO — Real time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Room mein join karo
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Message receive karo aur bhejo
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par`);
});