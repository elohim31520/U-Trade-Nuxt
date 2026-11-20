import { computed, onBeforeUnmount, ref, type Ref } from 'vue'
import { showToast } from 'vant'
import type { CardPackCard, CardPackConfig, CardPackPhase, CardPackSceneApi } from '@/types/cardPack'
import { companyLogo, normalizeRarity, pickCardText, rarityRank } from '@/utils/cardPackContent'

/** 點選的包不在正前方時，先轉過來，轉完再進入「已選定」（毫秒） */
const TURN_BEFORE_CHOOSE_MS = 350
/** 翻卡到揭曉音的間隔：翻到一半才響（毫秒） */
const FLIP_TO_REVEAL_MS = 180

/**
 * 卡包（PC / 手機共用）：挑選卡包 → 已選定 → 向後台取結果 → 撕開動畫 → 揭曉的流程。
 * 卡池、次數、紀錄與抽出哪一張卡在 useCardPackState（都由後端決定）。
 * 這裡只管流程與要顯示的文字；各風格的卡包頁傳入各自的設定（config）。
 *
 * scene 是 3D 場景元件（CardPack/Scene.vue）對外提供的操作；3D 不能用時場景元件仍然提供，
 * 只是撕開動畫改成短暫等待，所以這裡不用另外處理沒有 3D 的情況。
 */
export function useCardPack(scene: Ref<CardPackSceneApi | null>, config: CardPackConfig) {
	const { t, locale } = useI18n()
	const base = useCardPackState(config)
	const sound = useCardPackSound(config)

	const phase = ref<CardPackPhase>('select')
	/** 環上目前在正前方的是第幾包（0 起算），顯示 PACK 01 用 */
	const selectedPack = ref(0)
	/** 蓋掉階段預設提示的狀態文字（開包失敗） */
	const statusOverride = ref<string | null>(null)
	/** 這次開出的卡 */
	const reward = ref<CardPackCard | null>(null)
	const flipped = ref(false)

	let turnTimer: ReturnType<typeof setTimeout> | undefined
	let flipTimer: ReturnType<typeof setTimeout> | undefined
	let unmounted = false

	onBeforeUnmount(() => {
		unmounted = true
		clearTimeout(turnTimer)
		clearTimeout(flipTimer)
	})

	// ---------- 要顯示的文字 ----------
	const packLabel = computed(() => t('card_pack.pack_label', { n: String(selectedPack.value + 1).padStart(2, '0') }))
	/** 挑選階段沒有主按鈕，點 3D 區的任一包就是選擇；取資料失敗、卡池沒準備好或次數用完時，這個位置改顯示原因 */
	const emptyText = computed(() => {
		if (base.loadFailed.value) return t('card_pack.status_error')
		if (base.ready.value && !base.isValid.value) return t('card_pack.toast_preparing')
		return base.ready.value && base.chances.value <= 0 ? t('card_pack.toast_no_chances') : ''
	})
	const pickHint = computed(() => emptyText.value || t('card_pack.hint_pick'))
	const STATUS_KEYS: Partial<Record<CardPackPhase, string>> = {
		select: 'card_pack.status_select',
		ready: 'card_pack.status_ready',
		loading: 'card_pack.status_loading',
		opening: 'card_pack.status_opening',
	}
	/** 後端沒給卡、留在「已選定」時的提示（後端都不會扣次數） */
	const FAILURE_STATUS = {
		busy: 'card_pack.status_busy',
		error: 'card_pack.status_error',
	} as const
	const status = computed(() => {
		// 挑選階段有原因時（取資料失敗、準備中、次數用完），原因已經顯示在挑選提示的位置，這裡不重複
		if (phase.value === 'select' && emptyText.value) return ''
		const key = statusOverride.value ?? STATUS_KEYS[phase.value]
		return key ? t(key) : ''
	})

	const rewardName = computed(() => reward.value?.name ?? '')
	const rewardRarity = computed(() => normalizeRarity(reward.value?.rarity))
	const rewardLogo = computed(() => (reward.value ? companyLogo(reward.value.symbol) : ''))
	/** 揭曉後顯示的分析文字（依語系挑好） */
	const rewardText = computed(() => (reward.value ? pickCardText(reward.value, locale.value) : null))

	// ---------- 3D 場景回報 ----------
	function onSelectPack(index: number) {
		selectedPack.value = index
		sound.move()
	}

	// ---------- 流程 ----------
	/** 開始抽之前的檢查；卡池沒準備好或沒次數時跳提示（base 負責）並播錯誤音 */
	function canDraw() {
		if (base.ensureCanDraw()) return true
		sound.error()
		return false
	}

	/** 選定這一包（點選 3D 區的任一包，或 3D 不能用時點 2D 圖片） */
	function choose() {
		if (phase.value !== 'select' || !canDraw()) return
		sound.select()
		scene.value?.setMode('ready')
		statusOverride.value = null
		phase.value = 'ready'
	}

	/** 點選環上第 index 包：不在正前方就先轉過來，轉完再選定 */
	function pickPack(index: number) {
		if (phase.value !== 'select' || turnTimer) return
		if (!canDraw()) return
		const turned = scene.value?.goTo(index) ?? false
		turnTimer = setTimeout(
			() => {
				turnTimer = undefined
				choose()
			},
			turned ? TURN_BEFORE_CHOOSE_MS : 0
		)
	}

	/** 撕開卡包：向後台取結果（後端決定抽哪一張與扣次數）、播放撕開動畫、進入揭曉 */
	async function open() {
		if (phase.value !== 'ready' || !base.ensureCanDraw()) return
		sound.click()
		phase.value = 'loading'
		statusOverride.value = null

		const outcome = await base.requestDraw()
		if (unmounted) return
		if (!outcome.ok) {
			// 後端沒給卡，也沒扣次數
			sound.error()
			if (outcome.reason === 'no_chances' || outcome.reason === 'preparing') {
				// 次數用完、卡池沒準備好：回到挑選，挑選區會顯示原因
				if (outcome.reason === 'no_chances') showToast(t('card_pack.toast_no_chances'))
				scene.value?.setMode('select')
				phase.value = 'select'
				return
			}
			// 上一包還在處理、暫時失敗：留在「已選定」，使用者可以再試一次
			statusOverride.value = FAILURE_STATUS[outcome.reason]
			phase.value = 'ready'
			return
		}
		reward.value = outcome.card

		phase.value = 'opening'
		sound.tear()
		await (scene.value?.open(config.scene.openMs) ?? Promise.resolve())
		if (unmounted) return
		flipped.value = false
		phase.value = 'reveal'
	}

	function skip() {
		if (phase.value === 'opening') scene.value?.skip()
	}

	/** 已選定後反悔，回去挑別包 */
	function backToSelect() {
		if (phase.value !== 'ready') return
		sound.move()
		scene.value?.setMode('select')
		statusOverride.value = null
		phase.value = 'select'
	}

	// ---------- 揭曉 ----------
	function flip() {
		if (phase.value !== 'reveal' || flipped.value) return
		flipped.value = true
		sound.flip()
		const rank = rarityRank(rewardRarity.value)
		flipTimer = setTimeout(() => sound.reveal(rank), FLIP_TO_REVEAL_MS)
	}

	function closeReveal() {
		if (phase.value !== 'reveal') return
		reward.value = null
		flipped.value = false
		sound.collect()
		scene.value?.setMode('select')
		phase.value = 'select'
	}

	/** 揭曉層的主按鈕：還沒翻就翻，翻了就收下（關閉） */
	function revealStep() {
		if (flipped.value) closeReveal()
		else flip()
	}

	/** 本機測試用：重設自己的次數與紀錄（只有開發環境有；開包中不處理） */
	function resetPacks() {
		if (phase.value !== 'select' && phase.value !== 'ready') return
		base.resetChances()
	}

	return {
		// 狀態
		phase,
		ready: base.ready,
		chances: base.chances,
		flipped,
		reward,
		soundEnabled: sound.enabled,
		// 顯示用（已依語系挑好文字）
		titleImage: base.titleImage,
		dataDateText: base.dataDateText,
		rulesTitle: base.rulesTitle,
		rules: base.rules,
		tickerItems: base.tickerItems,
		records: base.records,
		packLabel,
		pickHint,
		pickHintEmpty: computed(() => !!emptyText.value),
		status,
		rewardName,
		rewardRarity,
		rewardLogo,
		rewardText,
		// 3D 場景回報
		onSelectPack,
		// 動作
		choose,
		pickPack,
		open,
		skip,
		backToSelect,
		flip,
		revealStep,
		resetPacks,
		toggleSound: sound.toggle,
	}
}
