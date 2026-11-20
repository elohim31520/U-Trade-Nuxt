/** 多語文字：缺哪個語系就退回 en */
export interface LocalizedText {
	en: string
	zh?: string
}

// ---------- 卡片（後端 TradeTracker-drizzle 的 /card-pack API，欄位與後端的 types/cardPack.d.ts 對應） ----------

/** 卡片稀有度：由低到高。代表「該公司當天的異動程度」，與多空無關；揭曉時的外框、光暈與音效升調都依它而定 */
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary'

/** 走勢偏向：AI 依數據判斷，不是投資建議 */
export type CardSentiment = 'bullish' | 'bearish' | 'neutral'

/** 後端用行情算出的數字（不經過 AI） */
export interface CardSignals {
	/** 收盤價（美元） */
	price: number
	/** 當日漲跌幅（%，-3.53 代表 -3.53%） */
	dayChgPct: number
	volume: number
	/** 當日成交量 ÷ 近 10 日平均量；沒有均量時為 null */
	volumeRatio: number | null
	/** |當日漲跌幅| ÷ 近 20 日平均 |單日漲跌幅|；沒有足夠歷史時為 null */
	moveMultiple: number | null
	/** 近 20 個交易日累計漲跌幅（%）；歷史不足時為 null */
	change20dPct: number | null
	/** 異動分數，稀有度依這個排名 */
	score: number
}

/** 單一語言的卡片文字（AI 產出） */
export interface CardText {
	headline: string
	summary: string
	points: string[]
	/** 後續觀察重點（條件式描述，不是建議） */
	watch: string
}

export interface CardPackCard {
	/** `${date}:${symbol}`，後端用它排除已抽過的卡 */
	id: string
	/** 資料所屬的美東交易日 yyyy-MM-dd */
	date: string
	/** 大寫代號，例如 NVDA */
	symbol: string
	name: string
	rarity: CardRarity
	sentiment: CardSentiment
	signals: CardSignals
	zh: CardText
	en: CardText
}

/** 今日異動（跑馬燈）：只有數字，不含抽卡內容 */
export interface CardPackMover {
	symbol: string
	name: string
	dayChgPct: number
	volumeRatio: number | null
}

/** GET /card-pack/today */
export interface CardPackToday {
	/** 卡池所屬的美東交易日；還沒準備好時為 null */
	date: string | null
	ready: boolean
	dailyOpens: number
	/** 依異動分數由高到低 */
	movers: CardPackMover[]
}

/** 抽卡紀錄的一筆（後端存的精簡版） */
export interface CardPackHistoryEntry {
	id: string
	date: string
	symbol: string
	name: string
	rarity: CardRarity
	sentiment: CardSentiment
	headline: { zh: string; en: string }
	/** ISO 時間 */
	drawnAt: string
}

/** GET /card-pack/me（需登入） */
export interface CardPackMe {
	date: string | null
	ready: boolean
	dailyOpens: number
	/** 今天（UTC 日）還剩幾包 */
	remaining: number
	/** 最新的在前 */
	history: CardPackHistoryEntry[]
}

/** POST /card-pack/draw（需登入） */
export interface CardPackDrawResult {
	card: CardPackCard
	date: string
	remaining: number
}

/** 紀錄清單上的一列（已依語系挑好文字） */
export interface CardPackRecordView {
	/** 公司名稱與代號 */
	name: string
	/** 當時那張卡的標題 */
	headline: string
	rarity: CardRarity
	/** 公司 logo */
	icon: string
	/** yyyy/MM/dd HH:mm */
	time: string
}

/** 開一包的結果：成功給卡；失敗給原因（卡包流程依原因顯示不同提示，且後端不會扣次數） */
export type CardPackDrawOutcome =
	| { ok: true; card: CardPackCard }
	| { ok: false; reason: 'preparing' | 'no_chances' | 'busy' | 'error' }

/**
 * 卡包頁的固定內容（不是後端提供的）：玩法說明。
 * rules 裡的 {n} 會換成每天可拆的包數（後端的 dailyOpens）。
 */
export interface CardPackContent {
	rulesTitle?: LocalizedText
	rules: { en: string[]; zh?: string[] }
}

/**
 * 卡包的流程：挑選（轉環形卡包、點選一包）→ 已選定（撕開前）→ 向後台取結果 → 開包動畫 → 揭曉。
 * 揭曉關閉後回到 select。
 */
export type CardPackPhase = 'select' | 'ready' | 'loading' | 'opening' | 'reveal'

/**
 * 卡包 3D 場景（CardPack/Scene.vue）對外提供的操作；流程由 useCardPack 驅動。
 * 3D 不能用時（沒有 WebGL）場景元件仍然提供這組操作，只是不會真的轉，撕開動畫改成短暫等待。
 */
export interface CardPackSceneApi {
	/** 目前正前方是第幾包 */
	selected: () => number
	/** 往右（正）或左（負）翻 n 包 */
	move: (n: number) => void
	/** 轉到第 index 包（走最短方向）；回傳有沒有需要轉 */
	goTo: (index: number) => boolean
	setMode: (mode: 'select' | 'ready') => void
	/** 播放撕開動畫，結束時 resolve */
	open: (ms: number) => Promise<void>
	/** 跳過撕開動畫 */
	skip: () => void
}

/** 卡包的 3D 場景：包裝貼圖與燈光、配色 */
export interface CardPackSceneConfig {
	/** 卡包正面貼圖（3d/ 底下的檔名），環上六包依序輪流 */
	fronts: string[]
	back: string
	crimp: string
	/** 正面貼圖的材質：金屬感越高顏色越暗 */
	material: { metalness: number; roughness: number }
	/** 整個 3D 環形的縮放倍率 */
	scale: number
	/** 撕開卡包的動畫長度（毫秒） */
	openMs: number
	/** 環上六包的側邊與封條色（依位置） */
	itemColors: readonly string[]
	/** 補光顏色 */
	accent: string
	/** 半球光的地面反射色 */
	ground: string
	/** 接地陰影色 */
	shadow: string
}

/** 卡包的音效名稱：有音檔的播音檔，其餘（或音檔還沒載好時）用程式合成 */
export type CardPackSoundName = 'click' | 'move' | 'select' | 'tear' | 'flip' | 'reveal' | 'collect' | 'error'

/** 卡包的音效檔 */
export interface CardPackAudioConfig {
	/** 音檔資料夾（public 底下），檔名是「音效名稱.mp3」 */
	dir: string
	/** 已經交付音檔的音效；沒列的用程式合成 */
	files: readonly CardPackSoundName[]
	/** 播音檔時的音量 0～1 */
	levels: Record<CardPackSoundName, number>
}

/**
 * 一個卡包頁面的「皮膚設定」：素材、色票、3D 場景、音效與說明文字。
 * 同一套邏輯（useCardPack*）配不同的設定與元件，就是不同風格的卡包頁：
 * 珍珠薰衣草版（constants/cardPack.ts，/card-pack）、宇宙魔幻版（constants/cardPackCosmic.ts，/card-pack-cosmic）。
 */
export interface CardPackConfig {
	/** 頁面路由 */
	path: string
	/** 素材資料夾（public 底下） */
	imgDir: string
	/** 平面圖（圖示、卡面）的副檔名 */
	imgExt: string
	/** 標題圖：站台語系 → 檔名（缺的語系用 en） */
	titles: Record<string, string>
	/** 背景圖：CSS 變數 --cp-img-<名稱> → 檔名，綁在最外層 .cp-theme 上 */
	themeImages: Record<string, string>
	/** localStorage：音效開關，各風格共用同一個 */
	soundKey: string
	/** 色票：原樣成為 .cp-theme 的 CSS 變數 */
	colors: Record<string, string>
	scene: CardPackSceneConfig
	/** 音效檔；沒有就全部用合成音 */
	audio?: CardPackAudioConfig
	content: CardPackContent
}
