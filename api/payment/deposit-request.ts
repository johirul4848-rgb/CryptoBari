// Vercel Serverless Function for Payment Deposit Request
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
      method = 'BINANCE_PAY',
      senderBinanceId,
      binanceId,
      promoCode,
      userEmail = 'trader@cryptobari.com',
      userName = 'Trader',
    } = req.body || {};

    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid deposit amount required' });
    }
    if (numAmount < 5) {
      return res.status(400).json({ success: false, error: 'Minimum deposit amount is $5.00 USD.' });
    }

    let bonusPercent = 0;
    let bonusAmount = 0;
    let totalCredited = numAmount;

    if (promoCode && typeof promoCode === 'string' && numAmount >= 30) {
      if (numAmount >= 70) {
        bonusPercent = 60;
      } else if (numAmount >= 50) {
        bonusPercent = 40;
      } else {
        bonusPercent = 30;
      }
      bonusAmount = parseFloat((numAmount * (bonusPercent / 100)).toFixed(2));
      totalCredited = parseFloat((numAmount + bonusAmount).toFixed(2));
    }

    const resolvedBinanceId = senderBinanceId || binanceId || 'Unspecified';
    const depId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
    const newDeposit = {
      id: depId,
      userId: userEmail,
      userName,
      userEmail,
      amount: numAmount,
      currency: 'USD',
      method: method || 'Binance Pay',
      txHash: 'BPAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      binanceId: String(resolvedBinanceId).trim(),
      senderBinanceId: String(resolvedBinanceId).trim(),
      receiverBinanceId: '794380283',
      promoCode: promoCode ? String(promoCode).trim().toUpperCase() : undefined,
      bonusPercent: bonusPercent > 0 ? bonusPercent : undefined,
      bonusAmount: bonusAmount > 0 ? bonusAmount : undefined,
      totalCredited,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    return res.status(200).json({
      success: true,
      message: 'Deposit request submitted successfully. Awaiting Admin Approval.',
      deposit: newDeposit,
      depositId: newDeposit.id,
      bonusAmount,
      totalCredited,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
}
