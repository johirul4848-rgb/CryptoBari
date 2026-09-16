// Vercel Serverless Function for Binance Payment Gateway Settings
let memorySettings = {
  binanceId: '794380283',
  merchantName: 'CryptoBari Global Liquidity',
  qrImage: '',
  instructions: 'Please transfer USDT via Binance Pay UID. Use your Binance ID as the transaction reference. Once transferred, submit the form with your Binance ID for instant verification.',
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { binanceId, merchantName, qrImage, instructions } = req.body || {};
    if (binanceId) memorySettings.binanceId = binanceId;
    if (merchantName) memorySettings.merchantName = merchantName;
    if (qrImage !== undefined) memorySettings.qrImage = qrImage;
    if (instructions) memorySettings.instructions = instructions;
    return res.status(200).json({ success: true, settings: memorySettings });
  }

  return res.status(200).json(memorySettings);
}
