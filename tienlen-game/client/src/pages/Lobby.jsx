import React, { useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const socket = io('http://localhost:5000');

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên người chơi');
      return;
    }
    setIsCreating(true);
    socket.emit('create-room', playerName);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    socket.emit('join-room', { roomId, playerName });
  };

  // Xử lý sự kiện từ server
  React.useEffect(() => {
    socket.on('room-created', (data) => {
      // Copy share link to clipboard
      navigator.clipboard.writeText(data.shareLink)
        .then(() => {
          alert(`Đã tạo phòng thành công! Link chia sẻ đã được copy: ${data.shareLink}`);
        })
        .catch(() => {
          alert(`Đã tạo phòng thành công! Link chia sẻ: ${data.shareLink}`);
        });
      
      navigate(`/room/${data.roomId}`, { 
        state: { 
          playerName,
          isHost: true,
          shareLink: data.shareLink 
        } 
      });
    });

    socket.on('players-updated', (players) => {
      // Cập nhật danh sách người chơi trong phòng
    });

    socket.on('join-error', (message) => {
      setError(message);
    });

    return () => {
      socket.off('room-created');
      socket.off('players-updated');
      socket.off('join-error');
    };
  }, [navigate, playerName]);

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-primary-800 mb-6">
          Tiến Lên Miền Nam
        </h1>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tên người chơi:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Nhập tên của bạn"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Mã phòng (nếu có):</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Nhập mã phòng"
          />
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}
          </button>
          
          <button
            onClick={handleJoinRoom}
            className="bg-secondary-500 hover:bg-secondary-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Vào phòng
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;