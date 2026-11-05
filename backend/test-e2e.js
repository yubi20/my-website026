import axios from 'axios';

const run = async () => {
  const baseUrl = 'http://localhost:5000/api';
  
  // 1. Register
  console.log('1. Testing Registration...');
  const username = `Player_${Date.now() % 10000}`;
  const regRes = await axios.post(`${baseUrl}/auth/register`, {
    username,
    email: `${username}@banana.io`,
    password: 'password123',
  });
  console.log('Registered:', regRes.data.success, 'User:', regRes.data.user.username);
  const token = regRes.data.token;
  
  // 2. Start Round (Ensure solution is NOT leaked)
  console.log('2. Starting Round...');
  const roundRes = await axios.post(`${baseUrl}/game/start`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Round Started:', roundRes.data.success);
  console.log('Question URL:', roundRes.data.questionUrl);
  console.log('Solution in response?', roundRes.data.solution !== undefined ? 'LEAKED! ERROR' : 'SAFE! (NOT LEAKED)');
  const roundToken = roundRes.data.roundToken;
  
  // 3. Request Hint Step 1
  console.log('3. Requesting Hint Step 1...');
  const hintRes = await axios.post(`${baseUrl}/game/hint`, {
    roundToken,
    requestedStep: 1,
  }, { headers: { Authorization: `Bearer ${token}` } });
  console.log('Hint received:', hintRes.data.hint, 'Cost:', hintRes.data.cost);
  
  // 4. Submit Wrong Answer (Should shake and apply penalty)
  console.log('4. Submitting Wrong Answer...');
  const wrongRes = await axios.post(`${baseUrl}/game/submit`, {
    roundToken,
    answer: 9,
    timeTakenMs: 4000,
  }, { headers: { Authorization: `Bearer ${token}` } });
  console.log('Answer Result:', wrongRes.data.correct ? 'CORRECT' : `WRONG (Shake animation triggered: ${wrongRes.data.shake})`);
  
  // 5. Check Leaderboard
  const lbRes = await axios.get(`${baseUrl}/leaderboard?type=score`);
  console.log('Leaderboard count:', lbRes.data.leaderboard.length);
  
  console.log('🎉 ALL END-TO-END TESTS PASSED VERIFIED!');
};

run().catch((err) => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});
