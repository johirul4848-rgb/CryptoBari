// Vercel Serverless Function for 3-Stage Admin Authentication
export default async function handler(req: any, res: any) {
  // CORS & Options handling
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
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Parse credentials from process.env (Vercel env vars or Vite env vars or standard fallback)
  const ADMIN_ACCESS_CODE = (
    process.env.ADMIN_ACCESS_CODE ||
    process.env.VITE_ADMIN_ACCESS_CODE ||
    '@53595'
  ).trim();

  const ADMIN_PASSWORD = (
    process.env.ADMIN_PASSWORD ||
    process.env.VITE_ADMIN_PASSWORD ||
    'Jahid@5359'
  ).trim();

  const ADMIN_ACCESS_PIN = (
    process.env.ADMIN_ACCESS_PIN ||
    process.env.VITE_ADMIN_ACCESS_PIN ||
    '479057'
  ).trim();

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { stage, accessCode, password, accessPin, bornDay } = body;

  if (stage === 1) {
    const inputCode = (accessCode || '').trim();
    if (!inputCode || (inputCode !== ADMIN_ACCESS_CODE && inputCode !== '@53595')) {
      return res.status(401).json({ success: false, message: 'Invalid Access Code. Access Denied.' });
    }
    return res.json({ success: true, stage: 1, message: 'Stage 1 Passed. Proceed to Password.' });
  }

  if (stage === 2) {
    const inputPass = (password || '').trim();
    if (!inputPass || (inputPass !== ADMIN_PASSWORD && inputPass !== 'Jahid@5359')) {
      return res.status(401).json({ success: false, message: 'Incorrect Password. Security Alert Logged.' });
    }
    return res.json({ success: true, stage: 2, message: 'Stage 2 Passed. Access PIN Required.' });
  }

  if (stage === 3) {
    const inputPass = (password || '').trim();
    if (!inputPass || (inputPass !== ADMIN_PASSWORD && inputPass !== 'Jahid@5359')) {
      return res.status(401).json({ success: false, message: 'Password invalid.' });
    }

    const providedPin = (accessPin || bornDay || '').trim();
    if (!providedPin || (providedPin !== ADMIN_ACCESS_PIN && providedPin !== '479057')) {
      return res.status(401).json({ success: false, message: 'Access PIN verification failed. Access Denied.' });
    }

    // Generate verified admin session
    const adminToken = 'adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    return res.json({
      success: true,
      stage: 3,
      message: 'Broker Admin Authenticated Successfully',
      adminToken,
      admin: {
        role: 'SUPER_ADMIN',
        name: 'Jahid Chowdhury',
        email: 'johirul4848@gmail.com',
        loginTime: new Date().toISOString(),
      },
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid verification stage' });
}
