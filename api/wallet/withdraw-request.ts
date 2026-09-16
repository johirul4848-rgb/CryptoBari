// Vercel Serverless Function for Wallet Withdraw Request
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      amount,
      method = 'Binance Pay',
      address,
      receiverBinanceId,
      binanceId,
      network = 'Binance Pay UID Transfer',
      userId = 'usr_trader',
      userName = 'Trader',
      userEmail = 'trader@cryptobari.com',
    } = req.body || {};

    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid withdrawal amount required' });
    }
    if (numAmount < 10) {
      return res.status(400).json({ success: false, error: 'Minimum withdrawal amount is $10.00 USD.' });
    }

    const targetBinanceId = (receiverBinanceId || binanceId || address || '').toString().trim() || '794380283';
    const withdrawalId = 'WTH-' + Math.floor(10000 + Math.random() * 90000);

    const newWithdrawal = {
      id: withdrawalId,
      userId,
      userName,
      userEmail,
      amount: numAmount,
      currency: 'USD',
      method: method || 'Binance Pay',
      address: targetBinanceId,
      receiverBinanceId: targetBinanceId,
      binanceId: targetBinanceId,
      network,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully for verification.',
      withdrawal: newWithdrawal,
      withdrawalId: newWithdrawal.id,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
}
