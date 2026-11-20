import type { CardPackConfig, CardPackContent, CardPackSceneConfig } from '@/types/cardPack'

const IMG_DIR = '/card-pack'

/**
 * 卡包頁的玩法說明（兩個風格共用）。卡片本身不在這裡：每個交易日由後端產生熱門公司的走勢分析卡，
 * 前端只向 /card-pack/* 取。規則裡的 {n} 會換成每天可拆的包數（後端的 dailyOpens）。
 */
export const CARD_PACK_CONTENT: CardPackContent = {
	rulesTitle: { en: 'How It Works', zh: '玩法說明' },
	rules: {
		en: [
			'A new card pool is built every US trading day: one trend-analysis card for each popular company, based on its latest close.',
			'Signed-in members can open {n} packs per day (resets at 00:00 UTC). Each pack holds 1 card.',
			'Every card has the same chance. Cards you have already drawn from the current pool will not repeat until you have drawn them all.',
			'A card’s rarity shows how unusual that company’s day was (its price move and trading volume compared with its own normal). It does not mean bullish or bearish.',
			'Card content is compiled by AI from recent market data and public information. It is for reference only and is not investment advice. Investing involves risk.',
		],
		zh: [
			'卡池每個美股交易日更新一次：熱門公司各一張走勢分析卡，內容取自最近一個收盤日。',
			'登入會員每天可拆 {n} 包，每包 1 張卡，每天 UTC 00:00（台北時間 08:00）重新計算。',
			'每張卡的機率相同；目前卡池裡已經抽過的卡不會重複，全部抽過一輪後才會重新輪過。',
			'卡片稀有度代表「該公司當天的異動程度」（漲跌幅與成交量相對它平常的幅度），與走勢偏多或偏空無關。',
			'卡片內容由 AI 依近期行情與公開資訊整理，僅供參考，不構成任何投資建議；投資有風險，請自行評估。',
		],
	},
}

/** 3D 場景（對應設計稿 config.js 的 material／sceneScale 與 theme.css 的 --ev-3d-*） */
const scene: CardPackSceneConfig = {
	fronts: ['pack-front-1.svg', 'pack-front-2.svg', 'pack-front-3.svg'],
	back: 'pack-back.svg',
	crimp: 'pack-crimp.svg',
	material: { metalness: 0.2, roughness: 0.35 },
	scale: 1.5,
	openMs: 1800,
	itemColors: ['#a5b8ff', '#c9a5ef', '#8ed6c5', '#f2c18f', '#b8b4f3', '#9ecce9'],
	accent: '#d4aaff',
	ground: '#8589af',
	shadow: '#27364a',
}

/**
 * 珍珠薰衣草版卡包（/card-pack）的設定：素材資料夾、色票、3D 場景、玩法說明。
 * 色票（colors）原樣成為最外層 .cp-theme 的 CSS 變數（取自設計稿 theme.css），
 * 不跟站台主題的語意 token，所以換站台主題時卡包維持自己的配色。
 * 另一個風格（宇宙魔幻版）見 constants/cardPackCosmic.ts。
 */
export const CARD_PACK: CardPackConfig = {
	/** 頁面路由，也是側邊欄入口的連結 */
	path: '/card-pack',
	/** 素材資料夾（public/card-pack） */
	imgDir: IMG_DIR,
	/** 圖示、卡面這些平面圖的副檔名（目前是設計稿交付的 SVG 示意圖，正式圖到了換 webp 即可） */
	imgExt: 'svg',
	titles: { en: 'title-en.svg', zh: 'title-zh.svg' },
	themeImages: {
		'stage-bg': 'stage-bg.svg',
		'period-badge': 'period-badge.svg',
		'chances-badge': 'chances-badge.svg',
		'ticker-bar': 'ticker-bar.svg',
		'info-bg': 'info-bg.svg',
		'footer-deco': 'footer-deco.svg',
		'btn-primary': 'btn-primary.svg',
		'card-title': 'card-title.svg',
		'card-frame': 'card-frame.svg',
	},
	/** localStorage：音效開關 */
	soundKey: 'card-pack:sound',
	colors: {
		'--cp-bg': '#eef1f8',
		'--cp-surface': '#ffffff',
		'--cp-surface-2': '#e2e1fb',
		'--cp-border': '#d3d9e8',
		'--cp-text': '#27364a',
		'--cp-text-2': '#6f7c92',
		'--cp-primary': '#29394f',
		'--cp-accent': '#7765bb',
		'--cp-on-primary': '#ffffff',
		'--cp-scrim': 'rgb(24 30 46 / 0.78)',
		'--cp-shadow-btn': '0 0.5rem 1.25rem rgb(52 67 94 / 0.18)',
		'--cp-card-shadow': 'rgb(61 76 122 / 0.16)',
		'--cp-ticker-label': '#ffffff',
		'--cp-reveal-bg': 'rgb(20 26 40 / 0.94)',
		'--cp-shadow-prize': '0 0.9375rem 1.875rem rgb(61 76 122 / 0.2)',
		'--cp-rarity-common': '#8490a2',
		'--cp-rarity-rare': '#4f8fd8',
		'--cp-rarity-epic': '#8d5fd3',
		'--cp-rarity-legendary': '#e0a23a',
	},
	scene,
	content: CARD_PACK_CONTENT,
}
