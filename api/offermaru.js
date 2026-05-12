import crypto from 'crypto';

export default async function handler(req, res) {
  const SECRET = '7b6fca138f864e56e331100688e9e244ad61742d743e4d6a8234d98aee92ed28';
  const { user_id, user_reward, transaction_id, offer_id, publisher_payout, timestamp } = req.query;
  const signature = req.headers['x-offermaru-signature'] || '';
  
  // verify Offermaru signature
  const params = { transaction_id, user_id, offer_id, user_reward, publisher_payout, timestamp };
  const baseString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const expected = crypto.createHmac('sha256', SECRET).update(baseString).digest('hex');
  
  if (signature !== expected) return res.status(403).send('bad');
  
  // credit coins to Firebase
  const coins = parseInt(user_reward) || 0;
  const dbUrl = `https://apple-green-ded09-default-rtdb.firebaseio.com/leaderboard_all/${user_id}.json`;
  
  try {
    const current = await fetch(dbUrl).then(r => r.json()).catch(() => ({}));
    const newCoins = (current?.coins || 0) + coins;
    const newTotal = (current?.totalEarned || 0) + coins;
    
    await fetch(dbUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        coins: newCoins, 
        score: newCoins, 
        totalEarned: newTotal,
        lastPlayed: Date.now()
      })
    });
  } catch(e) {}
  
  res.status(200).send('OK');
}
