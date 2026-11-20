import { useEventListener } from '@vueuse/core'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { showToast } from 'vant'
import type {
	CardPackCard,
	CardPackConfig,
	CardPackDrawOutcome,
	CardPackHistoryEntry,
	CardPackMe,
	CardPackRecordView,
	CardPackToday,
} from '@/types/cardPack'
import {
	cardPackTitleImage,
	companyLogo,
	formatChange,
	formatDrawnAt,
	formatMultiple,
	formatTradingDate,
	pickLocalized,
	pickRules,
} from '@/utils/cardPackContent'

/** 跑馬燈最多放幾家（後端依異動分數由高到低給） */
const TICKER_MAX = 10
/** 成交量超過平常幾倍才在跑馬燈上多標一段量能 */
const TICKER_VOLUME_MIN = 1.5
/** 與後端保留的抽卡紀錄筆數一致 */
const HISTORY_LIMIT = 50

function errorStatus(err: unknown): number | undefined {
	const e = err as { statusCode?: number; status?: number; response?: { status?: number } } | null
	return e?.statusCode ?? e?.status ?? e?.response?.status
}

/**
 * 卡包的資料層：卡池狀態、今日異動、今天還剩幾包、抽卡紀錄，以及「向後端拆一包」。
 * 不管「怎麼演出」——挑選、撕開、揭曉的流程在 useCardPack。各風格的卡包頁用各自的設定（config）。
 *
 * 全部由後端（TradeTracker-drizzle 的 /card-pack/*，經 BFF）決定：
 * - 卡池每個美股交易日由後端產生，沒有好就是「準備中」；
 * - 次數（每天 5 包）、已抽過的卡不重複、抽卡紀錄都記在後端，以登入的使用者為準；
 * - 抽中哪一張由後端決定，前端只拿結果；後端沒給卡（準備中、失敗）就不會扣次數。
 * 頁面本身要登入才進得來（definePageMeta middleware: 'auth'）。
 */
export function useCardPackState(config: CardPackConfig) {
	const { t, locale } = useI18n()
	const { $bffApi } = useNuxtApp()

	const today = shallowRef<CardPackToday | null>(null)
	const me = shallowRef<CardPackMe | null>(null)
	/** 第一次向後端取完資料（成功或失敗都算）才為 true；SSR 與首次渲染先不顯示次數，避免閃一下預設值 */
	const ready = ref(false)
	const loadFailed = ref(false)

	/** 卡池好了才能抽 */
	const isValid = computed(() => today.value?.ready === true)
	const chances = computed(() => me.value?.remaining ?? 0)

	/** 本頁已經套用過幾次抽卡結果：load 取回來時若這期間又抽了一次，取回的次數是舊的，不能蓋掉 */
	let appliedDraws = 0

	async function load() {
		const seenDraws = appliedDraws
		try {
			const [todayRes, meRes] = await Promise.all([$bffApi.getCardPackToday(), $bffApi.getCardPackMe()])
			today.value = todayRes.data
			if (seenDraws === appliedDraws) me.value = meRes.data
			loadFailed.value = false
		} catch {
			// 錯誤提示由 BFF 的 fetch handler 跳出；這裡只記下失敗，讓畫面顯示原因
			loadFailed.value = true
		} finally {
			ready.value = true
		}
	}

	onMounted(load)
	// 分頁放著跨過 UTC 00:00 再回來，次數已經重發：切回分頁時重新取一次（要在 setup 階段註冊，離開頁面才會自動移除）
	if (import.meta.client) {
		useEventListener(document, 'visibilitychange', () => {
			if (document.visibilityState === 'visible' && ready.value) load()
		})
	}

	const titleImage = computed(() => cardPackTitleImage(config, locale.value))
	/** 卡池資料所屬的美東交易日，例如「分析資料：2026/11/19（美東收盤）」；卡池還沒準備好就不顯示 */
	const dataDateText = computed(() =>
		today.value?.date ? t('card_pack.data_date', { d: formatTradingDate(today.value.date) }) : ''
	)
	const rulesTitle = computed(() =>
		config.content.rulesTitle ? pickLocalized(config.content.rulesTitle, locale.value) : t('card_pack.rules_title')
	)
	const rules = computed(() =>
		pickRules(config.content.rules, locale.value, { n: today.value?.dailyOpens ?? me.value?.dailyOpens ?? 5 })
	)

	/** 今日異動：公司名稱、漲跌幅，量能明顯放大的再多標一段 */
	const tickerItems = computed(() =>
		(today.value?.movers ?? []).slice(0, TICKER_MAX).map((mover) => {
			const volume = mover.volumeRatio != null && mover.volumeRatio >= TICKER_VOLUME_MIN
			return t(volume ? 'card_pack.ticker_item_volume' : 'card_pack.ticker_item', {
				name: mover.name,
				chg: formatChange(mover.dayChgPct),
				vol: formatMultiple(mover.volumeRatio),
			})
		})
	)

	/** 後端給的順序就是最新的在最上面 */
	const records = computed<CardPackRecordView[]>(() =>
		(me.value?.history ?? []).map((entry) => ({
			name: entry.name.toUpperCase() === entry.symbol ? entry.symbol : `${entry.name} (${entry.symbol})`,
			headline: (locale.value === 'zh' && entry.headline.zh ? entry.headline.zh : entry.headline.en) ?? '',
			rarity: entry.rarity,
			icon: companyLogo(entry.symbol),
			time: formatDrawnAt(entry.drawnAt),
		}))
	)

	/** 開始抽之前的檢查：卡池好了、還有次數。不行就跳提示 */
	function ensureCanDraw(): boolean {
		if (loadFailed.value) {
			// 上一次取資料失敗：再試一次，這次先提示
			load()
			showToast(t('card_pack.status_error'))
			return false
		}
		if (!isValid.value) {
			showToast(t('card_pack.toast_preparing'))
			return false
		}
		if (chances.value <= 0) {
			showToast(t('card_pack.toast_no_chances'))
			return false
		}
		return true
	}

	/** 抽到之後本地先更新剩餘次數與紀錄，不用再多打一次 /me */
	function applyDraw(card: CardPackCard, remaining: number) {
		appliedDraws++
		const entry: CardPackHistoryEntry = {
			id: card.id,
			date: card.date,
			symbol: card.symbol,
			name: card.name,
			rarity: card.rarity,
			sentiment: card.sentiment,
			headline: { zh: card.zh.headline, en: card.en.headline },
			drawnAt: new Date().toISOString(),
		}
		const base: CardPackMe = me.value ?? {
			date: card.date,
			ready: true,
			dailyOpens: today.value?.dailyOpens ?? 5,
			remaining,
			history: [],
		}
		me.value = { ...base, remaining, history: [entry, ...base.history].slice(0, HISTORY_LIMIT) }
	}

	/**
	 * 向後端拆一包。後端決定抽哪一張與扣次數；沒給卡就回失敗原因（後端不會扣次數）：
	 * 503 卡池準備中、429 今天次數用完、409 上一包還在處理中，其餘（網路、登入過期等）算 error。
	 */
	async function requestDraw(): Promise<CardPackDrawOutcome> {
		try {
			const res = await $bffApi.drawCardPack()
			const result = res.data
			if (!result?.card) throw new Error('Invalid draw result')
			applyDraw(result.card, result.remaining)
			return { ok: true, card: result.card }
		} catch (err) {
			const status = errorStatus(err)
			if (status === 503) {
				today.value = today.value ? { ...today.value, ready: false } : null
				return { ok: false, reason: 'preparing' }
			}
			if (status === 429) {
				if (me.value) me.value = { ...me.value, remaining: 0 }
				return { ok: false, reason: 'no_chances' }
			}
			if (status === 409) return { ok: false, reason: 'busy' }
			return { ok: false, reason: 'error' }
		}
	}

	/** 本機測試用：把自己的次數與紀錄重設（只有開發環境的 BFF 與後端有這支） */
	async function resetChances() {
		try {
			await $bffApi.resetCardPack()
		} catch {
			/* 錯誤提示由 fetch handler 跳出 */
		}
		await load()
	}

	return {
		// 狀態
		isValid,
		ready,
		loadFailed,
		chances,
		// 顯示用（已依語系挑好文字）
		titleImage,
		dataDateText,
		rulesTitle,
		rules,
		tickerItems,
		records,
		// 動作
		requestDraw,
		ensureCanDraw,
		resetChances,
	}
}
