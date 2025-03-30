import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Database tạm thời lưu trong memory
const rooms = new Map();
const games = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Xử lý tạo phòng
  socket.on('create-room', (playerName) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      players: [{ id: socket.id, name: playerName }],
      status: 'waiting'
    });
    socket.join(roomId);
    socket.emit('room-created', { 
      roomId,
      shareLink: `http://localhost:3000?join=${roomId}`
    });
  });

  // Xử lý join phòng
  socket.on('join-room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) {
      return socket.emit('join-error', 'Phòng không tồn tại');
    }
    if (room.players.length >= 4) {
      return socket.emit('join-error', 'Phòng đã đầy');
    }
    
    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomId);
    io.to(roomId).emit('players-updated', room.players);
    
    // Tự động bắt đầu game khi đủ 4 người
    if (room.players.length === 4) {
      startGame(roomId);
    }
  });

  // Xử lý khi client disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Logic xử lý khi người chơi rời phòng
  });
});

function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.status = 'playing';
  const gameState = initializeGame(room.players);
  games.set(roomId, gameState);
  
  io.to(roomId).emit('game-started', gameState);
}

import { createDeck, validateMove } from '../client/src/utils/gameRules.js';

function initializeGame(players) {
  // Tạo bộ bài và chia bài
  const deck = createDeck();
  const playerCount = players.length;
  const cardsPerPlayer = Math.floor(deck.length / playerCount);
  
  // Xáo bài và chia đều cho người chơi
  const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
  const playersWithCards = players.map((player, index) => ({
    ...player,
    cards: shuffledDeck.slice(
      index * cardsPerPlayer,
      (index + 1) * cardsPerPlayer
    ).sort((a, b) => {
      const rankOrder = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
      const suitOrder = ['spades', 'clubs', 'diamonds', 'hearts'];
      const rankCompare = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
      if (rankCompare !== 0) return rankCompare;
      return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    })
  }));

  // Tìm người có 3 bích đi đầu
  const firstPlayer = playersWithCards.findIndex(player => 
    player.cards.some(card => card.rank === '3' && card.suit === 'spades')
  );

  return {
    players: playersWithCards,
    currentTurn: playersWithCards[firstPlayer >= 0 ? firstPlayer : 0].id,
    lastMove: null,
    direction: 1,
    status: 'playing'
  };
}

// Thêm xử lý đánh bài
io.on('connection', (socket) => {
  // ... existing code ...

  socket.on('play-cards', ({ roomId, cards, playerId }) => {
    const game = games.get(roomId);
    if (!game || game.currentTurn !== playerId) return;

    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    // Kiểm tra bài đánh có hợp lệ không
    const validation = validateMove(cards, game.lastMove);
    if (!validation.valid) {
      return socket.emit('invalid-move', validation.reason);
    }

    // Cập nhật game state
    player.cards = player.cards.filter(
      card => !cards.some(c => c.code === card.code)
    );
    
    const nextPlayerIndex = (game.players.findIndex(p => p.id === playerId) + game.direction) % game.players.length;
    const nextPlayer = game.players[nextPlayerIndex < 0 ? game.players.length - 1 : nextPlayerIndex];
    
    game.lastMove = {
      cards,
      moveType: validation.moveType,
      playerId,
      nextPlayer: nextPlayer.id
    };
    game.currentTurn = nextPlayer.id;

    // Kiểm tra điều kiện thắng
    if (player.cards.length === 0) {
      game.winner = playerId;
      game.status = 'finished';
      io.to(roomId).emit('game-finished', { winner: player.name });
    }

    io.to(roomId).emit('move-played', game.lastMove);
    io.to(roomId).emit('game-updated', game);
  });

  // Xử lý khi người chơi rời phòng
  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(roomId);
        games.delete(roomId);
      } else {
        io.to(roomId).emit('players-updated', room.players);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});