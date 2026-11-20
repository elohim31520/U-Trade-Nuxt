import { format } from 'date-fns'
import { HOT_COMPANY_LIST } from '../constants/hotCompanies'
import type { CardPackCard, CardPackConfig, CardPackContent, CardRarity, CardText, LocalizedText } from '@/types/cardPack'

/** 稀有度由低到高：順序就是等級（0～3），揭曉音效升調與光暈強度都用這個等級 */
export const RARITIES: readonly CardRarity[] = ['common', 'rare', 'epic', 'legendary']

/** 稀有度；沒給或給了不認得的值視為 common */
export function normalizeRarity(value: string | undefined): CardRarity {
	return RARITIES.includes(value as CardRarity) ? (value as CardRarity) : 'common'
}

/** 稀有度等級 0～3 */
export function rarityRank(rarity: CardRarity): number {
	return RARITIES.indexOf(rarity)
}

type Locale = 'en' | 'zh'

function isBlank(value: string | string[] | undefined) {
	return Array.isArray(value) ? !value.length : !value || !value.trim()
}

/** 多語文字取目前語系，沒填就退回 en */
export function pickLocalized(text: LocalizedText, locale: string): string {
	const value = text[locale as Locale]
	return isBlank(value) ? text.en : (value as string)
}

/**
 * 玩法說明取目前語系（沒填退回 en），濾掉空白規則；
 * vars 會把規則裡的 {名稱} 換成對應的值，例如 { n: 5 } 把 {n} 換成 5
 */
export function pickRules(
	rules: CardPackContent['rules'],
	locale: string,
	vars: Record<string, string | number> = {}
): string[] {
	const value = rules[locale as Locale]
	const list = isBlank(value) ? rules.en : (value as string[])
	return list
		.filter((rule) => rule.trim())
		.map((rule) => rule.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match)))
}

/** 卡片的分析文字取目前語系，沒有該語系的標題就用英文版 */
export function pickCardText(card: Pick<CardPackCard, 'zh' | 'en'>, locale: string): CardText {
	return locale === 'zh' && !isBlank(card.zh?.headline) ? card.zh : card.en
}

/** 漲跌幅文字：+1.23% / -7.72% / 0.00%（四捨五入到小數兩位後是 0 就不帶正負號） */
export function formatChange(pct: number | null | undefined): string {
	if (pct == null || !Number.isFinite(pct)) return '--'
	const text = pct.toFixed(2)
	return `${Number(text) > 0 ? '+' : ''}${Number(text) === 0 ? '0.00' : text}%`
}

/** 量能倍數：2.3x；沒有資料回空字串 */
export function formatMultiple(value: number | null | undefined): string {
	return value == null || !Number.isFinite(value) ? '' : `${value.toFixed(1)}x`
}

/** 公司 logo：熱門名單裡有就用它的路徑規則，沒有就用站台通用的 /logo/{代號}.svg */
export function companyLogo(symbol: string): string {
	const id = symbol.toLowerCase()
	const company = HOT_COMPANY_LIST.find((c) => c.id === id)
	return company && !company.useLogoPath ? `/hot/${id}.webp` : `/logo/${id}.svg`
}

/** 'yyyy-MM-dd' → 'yyyy/MM/dd' */
export function formatTradingDate(date: string): string {
	return date.replaceAll('-', '/')
}

/** ISO 時間 → 'yyyy/MM/dd HH:mm'（使用者的時區） */
export function formatDrawnAt(iso: string): string {
	const date = new Date(iso)
	return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy/MM/dd HH:mm')
}

export type SharePlatformId = 'line' | 'facebook' | 'x' | 'whatsapp' | 'telegram'

/** 分享面板的社群平台（順序即顯示順序）；href 收到的網址與文案都已經 URL 編碼 */
const SHARE_PLATFORMS: Array<{
	id: SharePlatformId
	name: string
	href: (url: string, text: string) => string
}> = [
	{
		id: 'line',
		name: 'LINE',
		href: (url) => `https://social-plugins.line.me/lineit/share?url=${url}`,
	},
	{
		id: 'facebook',
		name: 'Facebook',
		href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
	},
	{
		id: 'x',
		name: 'X',
		href: (url, text) => `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
	},
	{ id: 'whatsapp', name: 'WhatsApp', href: (url, text) => `https://wa.me/?text=${text}%20${url}` },
	{
		id: 'telegram',
		name: 'Telegram',
		href: (url, text) => `https://t.me/share/url?url=${url}&text=${text}`,
	},
]

/** 各平台的分享連結。網址與文案在這裡統一編碼，呼叫端給原文即可 */
export function buildShareLinks(url: string, text: string) {
	const encodedUrl = encodeURIComponent(url)
	const encodedText = encodeURIComponent(text)
	return SHARE_PLATFORMS.map(({ id, name, href }) => ({
		id,
		name,
		href: href(encodedUrl, encodedText),
	}))
}

/**
 * 皮膚轉成 CSS 變數，綁在最外層 .cp-theme 的 style 上：色票（--cp-*）原樣帶入，
 * 背景圖（Tailwind 的 bg-(image:--cp-img-xxx) 與 border-image 取用）由素材資料夾與 themeImages 組出。
 */
export function cardPackThemeStyle(
	skin: Pick<CardPackConfig, 'imgDir' | 'colors' | 'themeImages'>
): Record<string, string> {
	const style: Record<string, string> = { ...skin.colors }
	for (const [name, file] of Object.entries(skin.themeImages)) {
		style[`--cp-img-${name}`] = `url('${skin.imgDir}/${file}')`
	}
	return style
}

/** 標題圖網址：依站台語系挑，沒有這個語系的圖就用英文版 */
export function cardPackTitleImage(skin: Pick<CardPackConfig, 'imgDir' | 'titles'>, locale: string): string {
	return `${skin.imgDir}/${skin.titles[locale] ?? skin.titles.en}`
}
