/** 不在 NYSE / NASDAQ 的特例：代號 → TradingView 前綴 */
export const PREFIX_OVERRIDE: Record<string, string> = {
	CBOE: 'CBOE', // Cboe Global Markets 本身掛在 Cboe BZX
}

/**
 * 在 NYSE 掛牌的代號：TradingView 前綴用 NYSE，不在這份名單的一律當 NASDAQ。
 * 代號用 TradingView 的格式（股別用點：BRK.B，不是 BRK-B）。
 *
 * 2026-11-05 已用 Nasdaq Trader 官方上市清單（otherlisted.txt / nasdaqlisted.txt）
 * 對過站上公司列表與探索熱門公司。公司轉換上市所（例如 PLTR、WMT 轉到 Nasdaq）時要回來更新。
 *
 * 每行放多個代號是刻意的：下面的 prettier-ignore 是為了擋掉 formatOnSave，
 * 否則 Prettier 會把每個代號拆成一行。
 */
// prettier-ignore
export const NYSE = [
	// --- Tech & Cloud (Software/SaaS) ---
	'CRM', 'NOW', 'SNOW', 'ORCL', 'HUBS', 'VEEV', 'IOT', 'AI', 'ASAN',
	'PATH', 'NET', 'SQ', 'TWLO', 'PAYC', 'GDDY', 'LSPD', 'BB',
	'S', 'DOCS', 'PINS', 'SPOT', 'UBER', 'RBLX', 'FVRR', 'BBAI', 'FI',

	// --- Semiconductors & Hardware (Non-Nasdaq) ---
	'TSM', 'ANET', 'VRT', 'HPE', 'IBM', 'SQNS', 'TDY', 'COHR',

	// --- Financials (Banks & Payments) ---
	'V', 'MA', 'JPM', 'BAC', 'GS', 'MS', 'WFC', 'C', 'AXP', 'BLK', 'SCHW',
	'BX', 'ALLY', 'RF', 'CFG', 'COF', 'MSCI', 'RKT',

	// --- Healthcare & BioTech ---
	'LLY', 'UNH', 'JNJ', 'PFE', 'ABBV', 'ABT', 'CVS', 'ELV', 'TDOC', 'HCA',

	// --- Industrials & Aerospace ---
	'LMT', 'BA', 'RTX', 'GD', 'GE', 'CAT', 'DE', 'MMM', 'UPS', 'FDX', 'UNP',
	'URI', 'MTZ', 'HXL', 'ETN',

	// --- Consumer & Retail ---
	'HD', 'TGT', 'LOW', 'KO', 'PG', 'MCD', 'NKE', 'DIS', 'CHWY', 'ADM', 'GM', 'F',

	// --- Energy & Materials ---
	'XOM', 'CVX', 'COP', 'SLB', 'SHEL', 'BP', 'SU', 'NEM', 'VALE', 'AA', 'TECK',

	// --- Utilities & Real Estate ---
	'NEE', 'PCG', 'AMT', 'CCI', 'O', 'WELL', 'EQR', 'SPG', 'WM', 'VST',

	// --- Others / Special ---
	'BRK.B', 'MP', 'CHPT', 'TOL', 'LEN', 'CCL', 'DDD', 'T', 'VZ', 'XYZ', 'GRMN',

	// --- 依官方上市清單補齊（站上公司列表裡在 NYSE 掛牌、但原本漏掉的）---
	'A', 'ACN', 'AEE', 'AES', 'AFL', 'AIG', 'AIZ', 'AJG', 'ALB', 'ALL', 'ALLE', 'AMCR',
	'AME', 'AMP', 'AON', 'AOS', 'APD', 'APH', 'APO', 'APTV', 'ARE', 'ARES', 'ATO', 'AVY',
	'AWK', 'AZO', 'BALL', 'BAX', 'BBY', 'BDX', 'BEN', 'BF.B', 'BG', 'BLDR', 'BMY', 'BR',
	'BRO', 'BSX', 'BXP', 'CAG', 'CAH', 'CARR', 'CB', 'CBRE', 'CF', 'CHD', 'CI', 'CIEN',
	'CL', 'CLX', 'CMG', 'CMI', 'CMS', 'CNC', 'CNP', 'COR', 'CPAY', 'CPT', 'CRH', 'CRL',
	'CTVA', 'CVNA', 'D', 'DAL', 'DD', 'DECK', 'DELL', 'DG', 'DGX', 'DHI', 'DHR', 'DLR',
	'DOC', 'DOCN', 'DOV', 'DOW', 'DRI', 'DT', 'DTE', 'DUK', 'DVA', 'DVN', 'ECL', 'ED',
	'EFX', 'EG', 'EIX', 'EL', 'EME', 'EMR', 'EOG', 'EPAM', 'EQT', 'ES', 'ESS', 'ETR',
	'EW', 'EXPD', 'EXR', 'FCX', 'FDS', 'FE', 'FICO', 'FIS', 'FITB', 'FIX', 'FRT', 'FTV',
	'GEV', 'GIS', 'GL', 'GLW', 'GNRC', 'GOLD', 'GPC', 'GPN', 'GWW', 'HAL', 'HIG', 'HII',
	'HLT', 'HPQ', 'HRL', 'HSY', 'HUBB', 'HUM', 'HWM', 'ICE', 'IEX', 'IFF', 'INVH', 'IP',
	'IQV', 'IR', 'IRM', 'IT', 'ITW', 'IVZ', 'J', 'JBL', 'JCI', 'KEY', 'KEYS', 'KHC',
	'KIM', 'KKR', 'KMI', 'KR', 'L', 'LDOS', 'LH', 'LHX', 'LII', 'LNG', 'LUV', 'LVS',
	'LW', 'LYB', 'LYV', 'MAA', 'MAS', 'MCK', 'MCO', 'MDT', 'MET', 'MGM', 'MKC', 'MLM',
	'MO', 'MOH', 'MOS', 'MPC', 'MRK', 'MRSH', 'MSI', 'MTB', 'MTD', 'MTDR', 'NCLH', 'NI',
	'NOC', 'NRG', 'NSC', 'NUE', 'NVR', 'OKE', 'OKLO', 'OMC', 'OTIS', 'OXY', 'PEG', 'PGR',
	'PH', 'PHM', 'PKG', 'PLD', 'PM', 'PNC', 'PNR', 'PNW', 'PPG', 'PPL', 'PRU', 'PSA',
	'PSX', 'PWR', 'Q', 'RCL', 'RJF', 'RL', 'RMD', 'ROK', 'ROL', 'RSG', 'RVTY', 'SE',
	'SHW', 'SJM', 'SNA', 'SNAP', 'SO', 'SOLV', 'SPGI', 'SRE', 'STE', 'STT', 'STZ', 'SW',
	'SWK', 'SYF', 'SYK', 'SYY', 'TAP', 'TDG', 'TEL', 'TFC', 'TJX', 'TKO', 'TMO', 'TPL',
	'TPR', 'TRGP', 'TRV', 'TSN', 'TT', 'TXT', 'TYL', 'U', 'UDR', 'UHS', 'USB', 'VICI',
	'VLO', 'VLTO', 'VMC', 'VTR', 'WAB', 'WAT', 'WEC', 'WMB', 'WRB', 'WSM', 'WST', 'WY',
	'XYL', 'YUM', 'ZBH', 'ZTS',
];