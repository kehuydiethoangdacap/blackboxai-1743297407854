import { motion } from 'framer-motion';

export const cardAnimation = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.3 }
};

export const playAnimation = {
  initial: { scale: 0.8 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 500, damping: 20 }
};

export const winnerAnimation = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 300, damping: 20 }
};

export const specialCardAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
