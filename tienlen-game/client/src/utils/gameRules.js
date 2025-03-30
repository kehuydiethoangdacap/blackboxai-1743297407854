const rankOrder = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const suitOrder = ['spades', 'clubs', 'diamonds', 'hearts'];

export const createDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  
  const deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank, code: `${rank}${suit[0].toUpperCase()}` });
    });
  });
  return sortDeck(deck);
};

const sortDeck = (deck) => {
  return deck.sort((a, b) => {
    const rankCompare = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    if (rankCompare !== 0) return rankCompare;
    return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
  });
};

export const validateMove = (cards, lastMove) => {
  if (!lastMove) {
    const hasThreeOfSpades = cards.some(c => c.rank === '3' && c.suit === 'spades');
    return {
      valid: hasThreeOfSpades,
      reason: hasThreeOfSpades ? '' : 'Nước đi đầu phải có 3 bích',
      moveType: detectMoveType(cards)
    };
  }

  const moveType = detectMoveType(cards);
  const lastMoveType = lastMove.moveType;

  // Kiểm tra số lượng bài
  if (cards.length !== lastMove.cards.length && moveType !== 'tứ quý') {
    return {
      valid: false,
      reason: 'Số lượng bài không hợp lệ',
      moveType
    };
  }

  // Kiểm tra theo loại bài
  switch (moveType) {
    case 'đôi':
      return validatePair(cards, lastMove);
    case 'ba':
      return validateThree(cards, lastMove);
    case 'sảnh':
      return validateSequence(cards, lastMove);
    case 'tứ quý':
      return { valid: true, moveType: 'tứ quý' };
    default:
      return validateSingle(cards, lastMove);
  }
};

const detectMoveType = (cards) => {
  if (cards.length === 1) return 'single';
  if (cards.length === 2 && cards[0].rank === cards[1].rank) return 'đôi';
  if (cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) return 'ba';
  if (cards.length >= 3 && isSequence(cards)) return 'sảnh';
  if (cards.length === 4 && cards.every(c => c.rank === cards[0].rank)) return 'tứ quý';
  return 'invalid';
};

const isSequence = (cards) => {
  const sorted = [...cards].sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
  for (let i = 1; i < sorted.length; i++) {
    if (rankOrder.indexOf(sorted[i].rank) !== rankOrder.indexOf(sorted[i-1].rank) + 1) {
      return false;
    }
  }
  return true;
};

const validatePair = (cards, lastMove) => {
  if (cards[0].rank !== cards[1].rank) {
    return { valid: false, reason: 'Không phải đôi bài', moveType: 'đôi' };
  }

  // Kiểm tra đôi thông (3 đôi liên tiếp)
  if (lastMove.moveType === 'đôi thông') {
    return {
      valid: false,
      reason: 'Phải dùng đôi thông hoặc tứ quý để chặt',
      moveType: 'đôi'
    };
  }

  const currentRank = rankOrder.indexOf(cards[0].rank);
  const lastRank = rankOrder.indexOf(lastMove.cards[0].rank);

  // Xử lý trường hợp đặc biệt: đôi thông chặt heo
  if (lastMove.cards[0].rank === '2' && currentRank >= 10) { // Đôi 10, J, Q, K, A có thể chặt heo
    return { valid: true, moveType: 'đôi thông' };
  }

  if (currentRank <= lastRank) {
    return { 
      valid: false, 
      reason: `Đôi bài phải lớn hơn đôi ${lastMove.cards[0].rank}`, 
      moveType: 'đôi' 
    };
  }

  // Kiểm tra đôi thông (3 đôi liên tiếp)
  if (currentRank === lastRank + 1 && lastRank === rankOrder.indexOf(lastMove.cards[0].rank) + 1) {
    return { valid: true, moveType: 'đôi thông' };
  }

  return { valid: true, moveType: 'đôi' };
};

const validateThree = (cards, lastMove) => {
  if (!cards.every(c => c.rank === cards[0].rank)) {
    return { valid: false, reason: 'Không phải ba lá bài giống nhau', moveType: 'ba' };
  }

  const currentRank = rankOrder.indexOf(cards[0].rank);
  const lastRank = rankOrder.indexOf(lastMove.cards[0].rank);

  if (currentRank <= lastRank) {
    return { 
      valid: false, 
      reason: `Ba lá bài phải lớn hơn ${lastMove.cards[0].rank}`, 
      moveType: 'ba' 
    };
  }

  return { valid: true, moveType: 'ba' };
};

const validateSequence = (cards, lastMove) => {
  if (!isSequence(cards)) {
    return { valid: false, reason: 'Không phải sảnh hợp lệ', moveType: 'sảnh' };
  }

  if (cards.length !== lastMove.cards.length) {
    return { 
      valid: false, 
      reason: 'Sảnh phải cùng số lượng bài với sảnh trước', 
      moveType: 'sảnh' 
    };
  }

  const currentHighest = rankOrder.indexOf(cards[cards.length-1].rank);
  const lastHighest = rankOrder.indexOf(lastMove.cards[lastMove.cards.length-1].rank);

  if (currentHighest <= lastHighest) {
    return { 
      valid: false, 
      reason: 'Sảnh phải lớn hơn sảnh trước', 
      moveType: 'sảnh' 
    };
  }

  return { valid: true, moveType: 'sảnh' };
};

const validateSingle = (cards, lastMove) => {
  const currentCard = cards[0];
  const lastCard = lastMove.cards[0];

  const currentRank = rankOrder.indexOf(currentCard.rank);
  const lastRank = rankOrder.indexOf(lastCard.rank);

  // Xử lý trường hợp đặc biệt: heo (2)
  if (lastCard.rank === '2' && currentCard.rank !== '2') {
    return { 
      valid: false, 
      reason: 'Chỉ có heo (2) mới đánh được sau heo', 
      moveType: 'single' 
    };
  }

  if (currentRank < lastRank || 
      (currentRank === lastRank && suitOrder.indexOf(currentCard.suit) <= suitOrder.indexOf(lastCard.suit))) {
    return { 
      valid: false, 
      reason: `Bài phải lớn hơn ${lastCard.rank} ${lastCard.suit}`, 
      moveType: 'single' 
    };
  }

  return { valid: true, moveType: 'single' };
};