export const playCardSound = () => {
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-playing-card-peg-1033.mp3');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Audio play failed:', e));
};

export const playWinSound = () => {
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

export const playErrorSound = () => {
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-error-wrong-2573.mp3');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Audio play failed:', e));
};