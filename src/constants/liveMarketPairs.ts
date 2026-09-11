import { MarketSymbol } from '../types';

export interface LivePairConfig {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayPair: string;
  category: 'CRYPTO';
  subCategory: 'MAJOR' | 'MEME' | 'L1_L2' | 'DEFI_AI';
  price: number;
  pricePrecision: number;
  payoutRate: number;
  underlying: string;
  multiplier?: number;
  isFavorite?: boolean;
  description?: string;
}

// Full Quotex & Binance Live Crypto Catalog (40 Top Live Spot Crypto Pairs)
export const LIVE_CRYPTO_PAIRS: LivePairConfig[] = [
  // --- MAJORS ---
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', displayPair: 'BTC/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 79029.70, pricePrecision: 2, payoutRate: 93, underlying: 'BTCUSDT', isFavorite: true, description: 'Bitcoin Live Spot' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', displayPair: 'ETH/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 2618.05, pricePrecision: 2, payoutRate: 92, underlying: 'ETHUSDT', isFavorite: true, description: 'Ethereum Live Spot' },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', displayPair: 'SOL/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 103.82, pricePrecision: 2, payoutRate: 91, underlying: 'SOLUSDT', isFavorite: true, description: 'Solana Live Spot' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', displayPair: 'BNB/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 734.68, pricePrecision: 2, payoutRate: 90, underlying: 'BNBUSDT', isFavorite: true, description: 'Binance Coin Live Spot' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', displayPair: 'XRP/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 1.3989, pricePrecision: 4, payoutRate: 90, underlying: 'XRPUSDT', isFavorite: true, description: 'Ripple Live Spot' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', displayPair: 'ADA/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 0.2130, pricePrecision: 4, payoutRate: 88, underlying: 'ADAUSDT', description: 'Cardano Live Spot' },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', displayPair: 'AVAX/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 7.723, pricePrecision: 3, payoutRate: 88, underlying: 'AVAXUSDT', description: 'Avalanche Live Spot' },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', displayPair: 'LTC/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 53.93, pricePrecision: 2, payoutRate: 88, underlying: 'LTCUSDT', description: 'Litecoin Live Spot' },
  { symbol: 'BCHUSDT', baseAsset: 'BCH', quoteAsset: 'USDT', displayPair: 'BCH/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 324.50, pricePrecision: 2, payoutRate: 89, underlying: 'BCHUSDT', description: 'Bitcoin Cash Live Spot' },
  { symbol: 'ETCUSDT', baseAsset: 'ETC', quoteAsset: 'USDT', displayPair: 'ETC/USDT', category: 'CRYPTO', subCategory: 'MAJOR', price: 14.850, pricePrecision: 3, payoutRate: 87, underlying: 'ETCUSDT', description: 'Ethereum Classic Live Spot' },

  // --- MEME COINS (High Volatility, Quotex Favorites) ---
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', displayPair: 'DOGE/USDT', category: 'CRYPTO', subCategory: 'MEME', price: 0.08653, pricePrecision: 5, payoutRate: 90, underlying: 'DOGEUSDT', isFavorite: true, description: 'Dogecoin Live Spot' },
  { symbol: 'PEPEUSDT', baseAsset: 'PEPE', quoteAsset: 'USDT', displayPair: 'PEPE/USDT', category: 'CRYPTO', subCategory: 'MEME', price: 0.00000347, pricePrecision: 8, payoutRate: 89, underlying: 'PEPEUSDT', isFavorite: true, description: 'Pepe Token Live Spot' },
  { symbol: 'SHIBUSDT', baseAsset: 'SHIB', quoteAsset: 'USDT', displayPair: 'SHIB/USDT', category: 'CRYPTO', subCategory: 'MEME', price: 0.00000535, pricePrecision: 8, payoutRate: 88, underlying: 'SHIBUSDT', description: 'Shiba Inu Live Spot' },
  { symbol: 'WIFUSDT', baseAsset: 'WIF', quoteAsset: 'USDT', displayPair: 'WIF/USDT', category: 'CRYPTO', subCategory: 'MEME', price: 0.6420, pricePrecision: 4, payoutRate: 89, underlying: 'WIFUSDT', description: 'dogwifhat Live Spot' },
  { symbol: 'BONKUSDT', baseAsset: 'BONK', quoteAsset: 'USDT', displayPair: 'BONK/USDT', category: 'CRYPTO', subCategory: 'MEME', price: 0.00000850, pricePrecision: 8, payoutRate: 88, underlying: 'BONKUSDT', description: 'Bonk Live Spot' },
  { symbol: 'FLOKIUSDT', baseAsset: 'FLOKI', quoteAsset: 'USDT', displayPair: 'FLOKI/USDT', category: 'CRYPTO', subCategory: 'MEME', price: 0.0000482, pricePrecision: 7, payoutRate: 88, underlying: 'FLOKIUSDT', description: 'Floki Live Spot' },

  // --- LAYER 1 & LAYER 2 ECOSYSTEM ---
  { symbol: 'SUIUSDT', baseAsset: 'SUI', quoteAsset: 'USDT', displayPair: 'SUI/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.7542, pricePrecision: 4, payoutRate: 91, underlying: 'SUIUSDT', isFavorite: true, description: 'Sui Network Live Spot' },
  { symbol: 'TONUSDT', baseAsset: 'TON', quoteAsset: 'USDT', displayPair: 'TON/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 1.600, pricePrecision: 3, payoutRate: 89, underlying: 'TONUSDT', isFavorite: true, description: 'Toncoin Live Spot' },
  { symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT', displayPair: 'NEAR/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 2.713, pricePrecision: 3, payoutRate: 88, underlying: 'NEARUSDT', description: 'Near Protocol Live Spot' },
  { symbol: 'APTUSDT', baseAsset: 'APT', quoteAsset: 'USDT', displayPair: 'APT/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 5.240, pricePrecision: 3, payoutRate: 88, underlying: 'APTUSDT', description: 'Aptos Live Spot' },
  { symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT', displayPair: 'ARB/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.3850, pricePrecision: 4, payoutRate: 87, underlying: 'ARBUSDT', description: 'Arbitrum One Live Spot' },
  { symbol: 'OPUSDT', baseAsset: 'OP', quoteAsset: 'USDT', displayPair: 'OP/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.8420, pricePrecision: 4, payoutRate: 87, underlying: 'OPUSDT', description: 'Optimism Live Spot' },
  { symbol: 'SEIUSDT', baseAsset: 'SEI', quoteAsset: 'USDT', displayPair: 'SEI/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.2450, pricePrecision: 4, payoutRate: 88, underlying: 'SEIUSDT', description: 'Sei Network Live Spot' },
  { symbol: 'POLUSDT', baseAsset: 'POL', quoteAsset: 'USDT', displayPair: 'POL/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.2240, pricePrecision: 4, payoutRate: 87, underlying: 'POLUSDT', description: 'Polygon Token Live Spot' },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', displayPair: 'DOT/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 1.088, pricePrecision: 3, payoutRate: 87, underlying: 'DOTUSDT', description: 'Polkadot Live Spot' },
  { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT', displayPair: 'TRX/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.3368, pricePrecision: 4, payoutRate: 87, underlying: 'TRXUSDT', description: 'Tron Live Spot' },
  { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', displayPair: 'ATOM/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 3.150, pricePrecision: 3, payoutRate: 86, underlying: 'ATOMUSDT', description: 'Cosmos Hub Live Spot' },
  { symbol: 'FTMUSDT', baseAsset: 'FTM', quoteAsset: 'USDT', displayPair: 'FTM/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.4680, pricePrecision: 4, payoutRate: 87, underlying: 'FTMUSDT', description: 'Fantom Live Spot' },
  { symbol: 'ALGOUSDT', baseAsset: 'ALGO', quoteAsset: 'USDT', displayPair: 'ALGO/USDT', category: 'CRYPTO', subCategory: 'L1_L2', price: 0.1180, pricePrecision: 4, payoutRate: 86, underlying: 'ALGOUSDT', description: 'Algorand Live Spot' },

  // --- DEFI, AI & ORACLES ---
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', displayPair: 'LINK/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 12.002, pricePrecision: 3, payoutRate: 88, underlying: 'LINKUSDT', description: 'Chainlink Live Spot' },
  { symbol: 'INJUSDT', baseAsset: 'INJ', quoteAsset: 'USDT', displayPair: 'INJ/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 11.850, pricePrecision: 3, payoutRate: 88, underlying: 'INJUSDT', description: 'Injective Protocol Live Spot' },
  { symbol: 'TIAUSDT', baseAsset: 'TIA', quoteAsset: 'USDT', displayPair: 'TIA/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 3.140, pricePrecision: 3, payoutRate: 88, underlying: 'TIAUSDT', description: 'Celestia Live Spot' },
  { symbol: 'RENDERUSDT', baseAsset: 'RENDER', quoteAsset: 'USDT', displayPair: 'RENDER/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 3.820, pricePrecision: 3, payoutRate: 88, underlying: 'RENDERUSDT', description: 'Render Token Live Spot' },
  { symbol: 'FETUSDT', baseAsset: 'FET', quoteAsset: 'USDT', displayPair: 'FET/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 0.7240, pricePrecision: 4, payoutRate: 87, underlying: 'FETUSDT', description: 'Artificial Superintelligence Live Spot' },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', displayPair: 'UNI/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 4.350, pricePrecision: 3, payoutRate: 87, underlying: 'UNIUSDT', description: 'Uniswap Live Spot' },
  { symbol: 'AAVEUSDT', baseAsset: 'AAVE', quoteAsset: 'USDT', displayPair: 'AAVE/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 112.40, pricePrecision: 2, payoutRate: 88, underlying: 'AAVEUSDT', description: 'Aave Protocol Live Spot' },
  { symbol: 'ICPUSDT', baseAsset: 'ICP', quoteAsset: 'USDT', displayPair: 'ICP/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 5.650, pricePrecision: 3, payoutRate: 87, underlying: 'ICPUSDT', description: 'Internet Computer Live Spot' },
  { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT', displayPair: 'FIL/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 2.180, pricePrecision: 3, payoutRate: 86, underlying: 'FILUSDT', description: 'Filecoin Live Spot' },
  { symbol: 'CRVUSDT', baseAsset: 'CRV', quoteAsset: 'USDT', displayPair: 'CRV/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 0.3420, pricePrecision: 4, payoutRate: 86, underlying: 'CRVUSDT', description: 'Curve DAO Live Spot' },
  { symbol: 'GALAUSDT', baseAsset: 'GALA', quoteAsset: 'USDT', displayPair: 'GALA/USDT', category: 'CRYPTO', subCategory: 'DEFI_AI', price: 0.01250, pricePrecision: 5, payoutRate: 86, underlying: 'GALAUSDT', description: 'Gala Games Live Spot' },
  { symbol: 'PAXGUSDT', baseAsset: 'PAXG', quoteAsset: 'USDT', displayPair: 'PAXG/USDT (Gold)', category: 'CRYPTO', subCategory: 'MAJOR', price: 4377.40, pricePrecision: 2, payoutRate: 92, underlying: 'PAXGUSDT', isFavorite: true, description: 'Paxos Gold Crypto Token Live Spot' },
];

export const ALL_LIVE_CONFIGS: LivePairConfig[] = LIVE_CRYPTO_PAIRS;

// Map lookup by symbol
export const LIVE_CONFIG_MAP = new Map<string, LivePairConfig>(
  ALL_LIVE_CONFIGS.map(c => [c.symbol.toUpperCase(), c])
);

// Helper to convert configs to MarketSymbol objects
export function generateInitialLiveSymbols(): MarketSymbol[] {
  return ALL_LIVE_CONFIGS.map(c => ({
    symbol: c.symbol,
    baseAsset: c.baseAsset,
    quoteAsset: c.quoteAsset,
    displayPair: c.displayPair,
    price: c.price,
    priceChangePercent: +(Math.random() * 3.5 - 1.2).toFixed(2),
    high24h: +(c.price * 1.025).toFixed(c.pricePrecision),
    low24h: +(c.price * 0.975).toFixed(c.pricePrecision),
    volume24h: 125000,
    quoteVolume24h: 45000000,
    pricePrecision: c.pricePrecision,
    payoutRate: c.payoutRate,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 5000,
    isFavorite: !!c.isFavorite,
    isOtc: false,
    marketType: 'REAL',
    category: 'CRYPTO',
    priceSource: 'BINANCE_SPOT',
  }));
}

// Resolver for underlying Binance symbols and precision
export function resolveLiveMarketSymbol(symbol: string): {
  underlying: string;
  multiplier: number;
  precision: number;
  isDirectBinance: boolean;
  isTrap: boolean;
} {
  const upper = symbol.toUpperCase().replace('_OTC', '');
  const config = LIVE_CONFIG_MAP.get(upper);

  if (config) {
    return {
      underlying: config.underlying,
      multiplier: 1.0,
      precision: config.pricePrecision,
      isDirectBinance: true,
      isTrap: false,
    };
  }

  // Fallback if upper ends with USDT (standard Binance crypto)
  if (upper.endsWith('USDT')) {
    return {
      underlying: upper,
      multiplier: 1.0,
      precision: 2,
      isDirectBinance: true,
      isTrap: false,
    };
  }

  return {
    underlying: upper,
    multiplier: 1.0,
    precision: 2,
    isDirectBinance: true,
    isTrap: false,
  };
}
