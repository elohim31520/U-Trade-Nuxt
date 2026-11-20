import { describe, expect, it } from 'vitest'
import type { CardPackCard } from '../../app/types/cardPack'
import {
	buildShareLinks,
	cardPackThemeStyle,
	cardPackTitleImage,
	companyLogo,
	formatChange,
	formatDrawnAt,
	formatMultiple,
	formatTradingDate,
	normalizeRarity,
	pickCardText,
	pickLocalized,
	pickRules,
	rarityRank,
} from '../../app/utils/cardPackContent'

const text = (headline: string) => ({ headline, summary: 's', points: ['a', 'b'], watch: 'w' })

describe('pickLocalized', () => {
	it('取目前語系，沒填就退回 en', () => {
		const t = { en: 'Cash', zh: '現金' }
		expect(pickLocalized(t, 'zh')).toBe('現金')
		expect(pickLocalized({ en: 'Cash', zh: '' }, 'zh')).toBe('Cash')
		expect(pickLocalized(t, 'fr')).toBe('Cash')
	})
})

describe('pickRules', () => {
	it('語系沒填（空陣列）退回 en，並濾掉空白規則', () => {
		expect(pickRules({ en: ['A', '  ', 'B'], zh: [] }, 'zh')).toEqual(['A', 'B'])
		expect(pickRules({ en: ['A'], zh: ['甲'] }, 'zh')).toEqual(['甲'])
	})
	it('規則裡的 {n} 換成傳入的值，沒傳的變數原樣留著', () => {
		const rules = { en: ['Open {n} packs a day', 'Limit {max}'], zh: ['每天可拆 {n} 包'] }
		expect(pickRules(rules, 'zh', { n: 5 })).toEqual(['每天可拆 5 包'])
		expect(pickRules(rules, 'en', { n: 5 })).toEqual(['Open 5 packs a day', 'Limit {max}'])
	})
})

describe('pickCardText', () => {
	const card = { zh: text('中文標題'), en: text('English headline') } as Pick<CardPackCard, 'zh' | 'en'>
	it('中文站用中文分析，其餘語系用英文', () => {
		expect(pickCardText(card, 'zh').headline).toBe('中文標題')
		expect(pickCardText(card, 'en').headline).toBe('English headline')
		expect(pickCardText(card, 'ko').headline).toBe('English headline')
	})
	it('中文標題是空的就退回英文', () => {
		expect(pickCardText({ ...card, zh: text('  ') }, 'zh').headline).toBe('English headline')
	})
})

describe('normalizeRarity / rarityRank', () => {
	it('沒給或不認得的稀有度視為 common', () => {
		expect(normalizeRarity(undefined)).toBe('common')
		expect(normalizeRarity('mythic')).toBe('common')
		expect(normalizeRarity('epic')).toBe('epic')
	})
	it('等級由低到高 0～3', () => {
		expect(['common', 'rare', 'epic', 'legendary'].map((r) => rarityRank(r as never))).toEqual([0, 1, 2, 3])
	})
})

describe('formatChange', () => {
	it('正的帶 +、負的帶 -，固定小數兩位', () => {
		expect(formatChange(1.234)).toBe('+1.23%')
		expect(formatChange(-7.72)).toBe('-7.72%')
		expect(formatChange(3)).toBe('+3.00%')
	})
	it('四捨五入後是 0 就不帶正負號，也不會出現 -0.00%', () => {
		expect(formatChange(0)).toBe('0.00%')
		expect(formatChange(0.004)).toBe('0.00%')
		expect(formatChange(-0.004)).toBe('0.00%')
	})
	it('沒有資料顯示 --', () => {
		expect(formatChange(null)).toBe('--')
		expect(formatChange(undefined)).toBe('--')
		expect(formatChange(Number.NaN)).toBe('--')
	})
})

describe('formatMultiple', () => {
	it('一位小數加 x；沒有資料回空字串', () => {
		expect(formatMultiple(1.89)).toBe('1.9x')
		expect(formatMultiple(12)).toBe('12.0x')
		expect(formatMultiple(null)).toBe('')
	})
})

describe('companyLogo', () => {
	it('熱門名單裡標了 useLogoPath 的走 /logo，沒標的走 /hot（webp）', () => {
		expect(companyLogo('NVDA')).toBe('/hot/nvda.webp')
		expect(companyLogo('AMD')).toBe('/logo/amd.svg')
		expect(companyLogo('aapl')).toBe('/logo/aapl.svg')
	})
	it('不在熱門名單裡就用站台通用的 /logo/{代號}.svg', () => {
		expect(companyLogo('ZZZZ')).toBe('/logo/zzzz.svg')
	})
})

describe('日期格式', () => {
	it('交易日 yyyy-MM-dd 轉成 yyyy/MM/dd', () => {
		expect(formatTradingDate('2026-11-19')).toBe('2026/11/19')
	})
	it('抽卡時間是 ISO，轉成使用者時區的 yyyy/MM/dd HH:mm；壞掉的回空字串', () => {
		const iso = '2026-11-20T02:05:00.000Z'
		const d = new Date(iso)
		const pad = (n: number) => String(n).padStart(2, '0')
		expect(formatDrawnAt(iso)).toBe(
			`${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
		)
		expect(formatDrawnAt('not a date')).toBe('')
	})
})

describe('cardPackThemeStyle', () => {
	const style = cardPackThemeStyle({
		imgDir: '/card-pack',
		colors: { '--cp-primary': '#29394f' },
		themeImages: { 'stage-bg': 'stage-bg.svg', 'folio-header': 'folio-header.webp' },
	})
	it('色票原樣帶入', () => {
		expect(style['--cp-primary']).toBe('#29394f')
	})
	it('背景圖由素材資料夾與各自的檔名組出 url()，副檔名不必一致', () => {
		expect(style['--cp-img-stage-bg']).toBe("url('/card-pack/stage-bg.svg')")
		expect(style['--cp-img-folio-header']).toBe("url('/card-pack/folio-header.webp')")
	})
	it('沒列在 themeImages 的圖不會多帶', () => {
		expect(Object.keys(style).filter((key) => key.startsWith('--cp-img-'))).toEqual([
			'--cp-img-stage-bg',
			'--cp-img-folio-header',
		])
	})
})

describe('cardPackTitleImage', () => {
	const skin = { imgDir: '/pack', titles: { en: 'title-en.webp', zh: 'title-main.webp' } }
	it('依語系挑標題圖', () => {
		expect(cardPackTitleImage(skin, 'en')).toBe('/pack/title-en.webp')
		expect(cardPackTitleImage(skin, 'zh')).toBe('/pack/title-main.webp')
	})
	it('沒有這個語系的圖就用英文版', () => {
		expect(cardPackTitleImage(skin, 'ko')).toBe('/pack/title-en.webp')
	})
})

describe('buildShareLinks', () => {
	const url = 'https://example.com/card-pack'
	const shareText = 'Open & collect!'
	const links = buildShareLinks(url, shareText)
	const hrefOf = (id: string) => links.find((link) => link.id === id)?.href

	it('依序是 LINE、Facebook、X、WhatsApp、Telegram', () => {
		expect(links.map((link) => link.id)).toEqual(['line', 'facebook', 'x', 'whatsapp', 'telegram'])
	})
	it('網址與文案都做 URL 編碼，不會被文案裡的 & 截斷參數', () => {
		expect(hrefOf('x')).toBe(
			'https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com%2Fcard-pack&text=Open%20%26%20collect!'
		)
		expect(hrefOf('line')).toBe('https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fexample.com%2Fcard-pack')
	})
	it('WhatsApp 是文案在前、網址在後，中間隔一個空白', () => {
		expect(hrefOf('whatsapp')).toBe('https://wa.me/?text=Open%20%26%20collect!%20https%3A%2F%2Fexample.com%2Fcard-pack')
	})
})
