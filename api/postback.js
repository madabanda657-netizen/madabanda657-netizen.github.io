export default async function handler(req, res) {
  const subid = req.query.subid || req.query.sid || req.query.var || '';
  const reward = parseInt(req.query.reward || req.query.payout || req.query.amount || '500');

  if (!subid) {
    return res.status(400).send('Missing subid');
  }

  const firebaseUrl = 'https://apple-green-ded09-default-rtdb.firebaseio.com/leaderboard_all/' + subid + '/coins.json';

  try {
    const getResponse = await fetch(firebaseUrl);
    let currentCoins = await getResponse.json();
    if (typeof currentCoins !== 'number') currentCoins = 0;

    const newCoins = currentCoins + reward;

    await fetch(firebaseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoins)
    });

    const updateUrl = 'https://apple-green-ded09-default-rtdb.firebaseio.com/leaderboard_all/' + subid + '.json';
    await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: newCoins,
        lastPlayed: Date.now()
      })
    });

    console.log('Postback success: ' + subid + ' +' + reward + ' coins');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Postback error:', error);
    res.status(500).send('Error');
  }
}
