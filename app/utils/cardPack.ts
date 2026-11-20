/**
 * 卡包 3D 選擇區的純計算（不碰 three.js 與 DOM，所以可以直接測）：
 * 六個卡包排成環形，每包相隔 60 度；轉環形、挑選、撕封條動畫都靠這裡的數字。
 */

/** 環上卡包數量 */
export const PACK_COUNT = 6
/** 相鄰兩包的夾角（弧度） */
export const PACK_STEP = Math.PI / 3
/** 環的半徑（3D 單位） */
export const PACK_RADIUS = 2.65
/** 封條（上緣）離卡包中心的高度 */
export const PACK_LID_Y = 1.2

/** 拖曳超過這個距離（px）才算「翻到下一包」，沒超過就彈回原位 */
export const DRAG_SWITCH_PX = 25
/** 已選定卡包時，橫向滑過這個距離（px）就算「撕開」 */
export const DRAG_TEAR_PX = 55
/** 手指沒動超過這個距離（px）就算點選，不算拖曳 */
export const TAP_MAX_PX = 8
/** 拖曳 1px 轉動的弧度：手指拖著環跟著轉 */
export const DRAG_RADIANS_PER_PX = 0.004

/** 環轉到目標角度（弧度，每往左翻一包 -PACK_STEP）時，正前方是第幾包 */
export function selectedPackIndex(target: number): number {
	return ((Math.round(-target / PACK_STEP) % PACK_COUNT) + PACK_COUNT) % PACK_COUNT
}

/**
 * 從 selected 轉到第 index 包要翻幾包（正負代表方向，走最短的一邊；剛好對面時取正）。
 * 回傳 0 表示已經在正前方。
 */
export function shortestPackTurn(selected: number, index: number): number {
	const turn = (((index - selected) % PACK_COUNT) + PACK_COUNT) % PACK_COUNT
	return turn > PACK_COUNT / 2 ? turn - PACK_COUNT : turn
}

/** 撕開動畫的前段：包裝抖動蓄力佔整段進度的比例，之後封條才飛出 */
const SHAKE_PORTION = 0.2

/** 撕開動畫前段的抖動角度（弧度）；進度超過蓄力段就是 0 */
export function packShake(progress: number, nowMs: number): number {
	return progress < SHAKE_PORTION ? Math.sin(nowMs * 0.08) * 0.04 : 0
}

/** 待機時包裝輕輕搖晃的角度（弧度）；k 是第幾包，讓六包搖晃的相位錯開 */
export function packIdleSway(nowMs: number, k: number): number {
	return Math.sin(nowMs * 0.0008 + k) * 0.025
}

/**
 * 封條飛出的姿態（progress 0～1 是整段撕開動畫的進度）：蓄力段（前 20%）封條不動，
 * 之後以 ease-out 飛向右上方並翻轉。
 */
export function packLidPose(progress: number): { x: number; y: number; rotationZ: number } {
	const fly = Math.max(0, (Math.min(progress, 1) - SHAKE_PORTION) / (1 - SHAKE_PORTION))
	const ease = 1 - Math.pow(1 - fly, 3)
	return { x: ease * 1.5, y: PACK_LID_Y + ease * 2, rotationZ: -ease }
}
