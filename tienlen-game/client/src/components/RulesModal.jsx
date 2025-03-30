import React from 'react';
import { motion } from 'framer-motion';

const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Luật chơi Tiến Lên Miền Nam</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">1. Cách chơi cơ bản:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Người có 3 bích đi đầu tiên</li>
              <li>Lượt đi theo chiều kim đồng hồ</li>
              <li>Người hết bài trước thắng</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">2. Các bộ bài hợp lệ:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bài lẻ (1 lá)</li>
              <li>Đôi (2 lá cùng số)</li>
              <li>Sám cô (3 lá cùng số)</li>
              <li>Sảnh (3+ lá liên tiếp)</li>
              <li>Tứ quý (4 lá cùng số)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">3. Luật chặt:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tứ quý chặt được heo (2)</li>
              <li>3 đôi thông chặt được heo</li>
              <li>4 đôi thông chặt được 3 đôi thông</li>
            </ul>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Đóng
        </button>
      </motion.div>
    </motion.div>
  );
};

export default RulesModal;