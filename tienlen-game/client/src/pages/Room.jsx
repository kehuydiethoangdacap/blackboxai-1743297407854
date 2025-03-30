import React, { useState, useEffect, useRef } from 'react';
import RulesModal from '../components/RulesModal';
import { motion } from 'framer-motion';
import { playCardSound, playWinSound, playErrorSound } from '../utils/sounds';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Card from '../components/Card';

const Room = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  
  const socket = io('http://localhost:5000');
  const { playerName, isHost } = location.state || {};

  useEffect(() => {
    if (!playerName || !roomId) {
      // Xử lý khi không có thông tin người chơi
      return;
    }

    // Join room khi component mount
    socket.emit('join-room', { roomId, playerName });

    // Lắng nghe các sự kiện từ server
    socket.on('players-updated', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setCurrentPlayer(updatedPlayers.find(p => p.id === socket.id));
    });

    socket.on('game-started', (state) => {
      setGameState(state);
      // Phân bài cho người chơi
      const player = state.players.find(p => p.id === socket.id);
      if (player) {
        setCurrentPlayer(player);
      }
    });

    socket.on('move-played', (move) => {
      setGameState(prev => ({
        ...prev,
        lastMove: move,
        currentTurn: move.nextPlayer
      }));
    });

    socket.on('game-updated', (game) => {
      setGameState(game);
      // Cập nhật bài của người chơi hiện tại
      const currentPlayer = game.players.find(p => p.id === socket.id);
      if (currentPlayer) {
        setCurrentPlayer(currentPlayer);
      }
    });

    socket.on('invalid-move', (message) => {
      alert(`Nước đi không hợp lệ: ${message}`);
    });

    socket.on('game-finished', ({ winner }) => {
      alert(`Trò chơi kết thúc! Người thắng là: ${winner}`);
      setGameState(prev => ({ ...prev, status: 'finished' }));
    });

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, playerName, socket]);

  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    
    socket.emit('play-cards', {
      roomId,
      cards: selectedCards,
      playerId: currentPlayer.id
    });
    setSelectedCards([]);
  };

  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    socket.emit('send-chat', {
      roomId,
      playerName,
      message
    });
    setMessage('');
  };

  const toggleCardSelect = (card) => {
    setSelectedCards(prev => 
      prev.some(c => c.code === card.code) 
        ? prev.filter(c => c.code !== card.code)
        : [...prev, card]
    );
  };

  const startGame = () => {
    socket.emit('start-game', roomId);
  };

  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Room header */}
        <div className="flex justify-between items-center mb-8 p-4 bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
              Phòng: {roomId}
            </h1>
            <span className="text-sm text-gray-300">
              {players.length}/4 người chơi
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowRules(true)}
              className="flex items-center space-x-1 text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white transition-all"
            >
              <i className="fas fa-book"></i>
              <span>Luật chơi</span>
            </button>
            {isHost && (
              <button 
                onClick={startGame}
                disabled={players.length < 2}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 px-6 py-2 rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
              >
                <i className="fas fa-play"></i>
                <span>Bắt đầu game</span>
              </button>
            )}
          </div>
        </div>

        {/* Players list */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {players.map(player => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-xl border ${player.id === currentPlayer?.id 
                ? 'bg-primary-900/50 border-primary-500 shadow-lg shadow-primary-500/20' 
                : 'bg-gray-800/50 border-gray-700'}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${player.ready ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <h3 className="font-semibold text-lg">
                  {player.name} {player.id === currentPlayer?.id && <span className="text-primary-400">(Bạn)</span>}
                </h3>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-300">Số bài: {player.cards?.length || 0}</span>
                {player.id === gameState?.currentTurn && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Đang chơi</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Game area */}
        {gameState ? (
          <div className="game-area space-y-8">
            {/* Played cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="played-cards-area p-6 bg-gray-800/50 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-300">Bài vừa đánh:</h2>
                {gameState.lastMove && (
                  <span className="text-sm text-gray-400">
                    Bởi: {players.find(p => p.id === gameState.lastMove.playerId)?.name}
                  </span>
                )}
              </div>
              {gameState.lastMove ? (
                <motion.div 
                  className="flex flex-wrap gap-3"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {gameState.lastMove.cards.map(card => (
                    <Card 
                      key={card.code} 
                      card={card}
                      isPlayable={false}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-cards text-4xl mb-2"></i>
                  <p>Chưa có bài được đánh</p>
                </div>
              )}
            </motion.div>

            {/* Player cards */}
            {currentPlayer && (
              <motion.div 
                className="player-cards-area bg-gray-900/50 p-6 rounded-xl border border-gray-700"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Bài của bạn</h2>
                  {gameState.currentTurn === currentPlayer.id && (
                    <span className="text-sm bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full">
                      Lượt của bạn
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {currentPlayer.cards?.map(card => (
                    <Card 
                      key={card.code} 
                      card={card} 
                      isSelected={selectedCards.some(c => c.code === card.code)}
                      isPlayable={gameState.currentTurn === currentPlayer.id}
                      onClick={() => toggleCardSelect(card)}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Đã chọn: {selectedCards.length} lá
                  </span>
                  <button
                    onClick={handlePlayCards}
                    disabled={selectedCards.length === 0 || gameState.currentTurn !== currentPlayer.id}
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 px-6 py-3 rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
                  >
                    <i className="fas fa-paper-plane"></i>
                    <span>Đánh bài</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="waiting-area text-center py-8">
            <h2 className="text-xl mb-4">Đang chờ người chơi khác...</h2>
            <p>Hiện có {players.length}/4 người chơi</p>
          </div>
        )}

        {/* Chat box */}
        <div className="chat-box mt-8 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-800/70 border-b border-gray-700">
            <h3 className="font-semibold flex items-center space-x-2">
              <i className="fas fa-comments"></i>
              <span>Trò chuyện</span>
            </h3>
          </div>
          
          <div className="chat-messages h-48 overflow-y-auto p-4 space-y-3">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.playerName === playerName ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs p-3 rounded-lg ${msg.playerName === playerName 
                    ? 'bg-primary-500/20 text-primary-100 rounded-br-none' 
                    : 'bg-gray-700/70 rounded-bl-none'}`}
                  >
                    <div className="text-xs font-semibold text-gray-400 mb-1">
                      {msg.playerName}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-comment-slash text-2xl mb-2"></i>
                  <p>Chưa có tin nhắn nào</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-3 rounded-l-lg bg-gray-700/50 border border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                placeholder="Nhập tin nhắn..."
              />
              <button
                onClick={handleSendMessage}
                className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-r-lg transition-all"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};

export default Room;
