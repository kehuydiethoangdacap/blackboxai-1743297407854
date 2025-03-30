import React from 'react';
import { motion } from 'framer-motion';
import { playCardSound } from '../utils/sounds';
import { cardAnimation, playAnimation, specialCardAnimation } from '../utils/animations';

const suitSymbols = {
  spades: '♠',
  clubs: '♣', 
  diamonds: '♦',
  hearts: '♥'
};

const suitColors = {
  spades: 'text-black',
  clubs: 'text-black',
  diamonds: 'text-red-600',
  hearts: 'text-red-600'
};

const specialCards = {
  '2S': true, // 2 of Spades
  '3S': true  // 3 of Spades
};

const Card = ({ card, isSelected, onClick, isPlayable }) => {
  const isSpecial = specialCards[`${card.rank}${card.suit[0].toUpperCase()}`];
  
  const handleClick = () => {
    playCardSound();
    onClick();
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative w-16 h-24 rounded-lg border-2 flex flex-col justify-between p-2 cursor-pointer
        ${isSelected ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-300'}
        ${suitColors[card.suit]} bg-white bg-opacity-95 hover:bg-opacity-100
        transition-all duration-200 ${!isPlayable ? 'opacity-60' : ''}`}
      {...(isSpecial ? specialCardAnimation : isSelected ? playAnimation : cardAnimation)}
      whileHover={isPlayable ? { scale: 1.08, zIndex: 10 } : {}}
      whileTap={isPlayable ? { scale: 0.92 } : {}}
    >
      {/* Card shine effect */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      )}

      {/* Special card indicator */}
      {isSpecial && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full shadow-sm" />
      )}

      <div className="text-lg font-bold">
        {card.rank}
      </div>
      <div className="text-2xl self-center">
        {suitSymbols[card.suit]}
      </div>
      <div className="text-lg font-bold self-end transform rotate-180">
        {card.rank}
      </div>

      {/* Hover elevation effect */}
      <div className="absolute inset-0 rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default Card;
