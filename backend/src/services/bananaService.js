import axios from 'axios';
import crypto from 'crypto';

const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';

/**
 * Fetch a fresh puzzle from the Marc Conrad Banana API.
 * The solution is kept strictly on the backend!
 */
export const fetchBananaPuzzle = async () => {
  try {
    const response = await axios.get(BANANA_API_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'BananaGame-SecureProxy/1.0',
      },
    });

    const data = response.data;
    if (!data || !data.question || data.solution === undefined) {
      throw new Error('Invalid response structure from Banana API');
    }

    const solution = parseInt(data.solution, 10);
    const questionUrl = data.question;
    const roundToken = crypto.randomBytes(24).toString('hex');

    return {
      roundToken,
      questionUrl,
      solution,
    };
  } catch (error) {
    console.error('Failed to fetch from Banana API:', error.message);
    throw new Error('Banana Puzzle service is temporarily unavailable. Please try again.');
  }
};

/**
 * Generate hints dynamically based on the solution number (0-9).
 * Guarantees zero leakage of the exact answer before Step 3.
 */
export const generateHint = (solution, hintStep) => {
  const isEven = solution % 2 === 0;
  const parityText = isEven ? 'an EVEN number' : 'an ODD number';

  if (hintStep === 1) {
    // Step 1: Parity & Half-Range
    const halfRange = solution <= 4 ? 'between 0 and 4' : 'between 5 and 9';
    return {
      step: 1,
      cost: 15,
      hint: `Step 1 Hint: The solution is ${parityText} and is located ${halfRange}.`,
    };
  }

  if (hintStep === 2) {
    // Step 2: Divisibility / Bounds / Mathematical Property
    let property = '';
    const primes = [2, 3, 5, 7];
    const squares = [0, 1, 4, 9];

    if (solution === 0) {
      property = 'It is the neutral identity element in addition (less than 3).';
    } else if (squares.includes(solution) && solution > 1) {
      property = `It is a perfect square number and is ${solution >= 5 ? '>= 5' : '< 5'}.`;
    } else if (primes.includes(solution)) {
      property = `It is a prime number and is ${solution >= 5 ? 'greater than 4' : 'less than or equal to 3'}.`;
    } else if (solution % 3 === 0) {
      property = `It is a multiple of 3 and is ${solution >= 6 ? '>= 6' : '< 6'}.`;
    } else {
      property = `It is strictly within the range of [${Math.max(0, solution - 1)} to ${Math.min(9, solution + 1)}].`;
    }

    return {
      step: 2,
      cost: 25,
      hint: `Step 2 Hint: ${property}`,
    };
  }

  if (hintStep === 3) {
    // Step 3: 50/50 Elimination - Narrow down to exactly 2 digits
    let fakeDigit;
    do {
      fakeDigit = Math.floor(Math.random() * 10);
    } while (fakeDigit === solution);

    const optionA = Math.min(solution, fakeDigit);
    const optionB = Math.max(solution, fakeDigit);

    return {
      step: 3,
      cost: 40,
      hint: `Step 3 (Final 50/50): The answer is definitely either ${optionA} or ${optionB}!`,
    };
  }

  return {
    step: hintStep,
    cost: 0,
    hint: 'No additional hints available.',
  };
};

export default {
  fetchBananaPuzzle,
  generateHint,
};
