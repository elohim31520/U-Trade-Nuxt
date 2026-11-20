/**
 * 卡包的音效合成器（Web Audio 即時合成），移植自設計站拆卡包活動的 sound.js。
 * 設計稿有交付音檔的音效（click、move、tear、flip、reveal）優先播音檔（見 composables/useCardPackSound.ts），
 * 這裡是沒有音檔的後備，以及還沒交付音檔的 select、collect、error：
 * click（按鈕）、move（切換卡包）、select（選定一包）、tear（撕封條）、flip（翻卡）、
 * reveal（揭曉，依稀有度 0～3 升調）、collect（收下獎勵）、error（次數不足、尚無獎項）。
 * 沒有背景音樂（設計稿的背景音樂沒有合成版，音檔交付前不播）。每包只開一張卡，
 * 設計稿共用流程裡「全部揭曉」的 reward 音用不到，沒有移植。
 *
 * 這支檔案不碰 window／Vue：吃一個 AudioContext、回傳一組播放函式，所以能用假的 AudioContext 測試。
 * AudioContext 本身要在使用者操作裡建立（瀏覽器自動播放限制），那是 composables/useCardPackSound 的工作。
 */

export interface CardPackSynth {
	click: () => void
	move: () => void
	select: () => void
	tear: () => void
	flip: () => void
	/** rank：稀有度等級 0～3，越高音越高、和弦越豐富 */
	reveal: (rank: number) => void
	collect: () => void
	error: () => void
	/** 停掉所有還在播的音 */
	stopAll: () => void
}

/** 揭曉音的基準音高（C5、D5、E5、G5），依稀有度等級 */
const REVEAL_BASE_HZ = [523.25, 587.33, 659.25, 783.99] as const
/** 揭曉和弦的倍率；稀有度越高，疊的音越多（最少 2 個、最多 4 個） */
const REVEAL_RATIOS = [1, 1.25, 1.5, 2] as const

/** 揭曉的音檔只有一個，依稀有度等級調高播放速度（音高）來區分：每高一級加快 6% */
export function revealPlaybackRate(rank: number): number {
	return 1 + clampRank(rank) * 0.06
}

/** 揭曉的和弦疊幾個音：等級 0 兩個，每高一級多一個，最多 4 個（等級 2 以上另外加一個高八度的長音） */
export function revealVoiceCount(rank: number): number {
	return Math.min(REVEAL_RATIOS.length, 2 + clampRank(rank))
}

function clampRank(rank: number): number {
	return Math.max(0, Math.min(3, Math.floor(rank) || 0))
}

export function createCardPackSynth(ctx: AudioContext): CardPackSynth {
	/** 還在排程或播放中的音源；播完自己移除，靜音或離開頁面時才能一次停掉 */
	const active = new Set<AudioScheduledSourceNode>()
	function track<T extends AudioScheduledSourceNode>(node: T): T {
		active.add(node)
		node.onended = () => active.delete(node)
		return node
	}

	/** 單音：快速起音、指數衰減；slideTo 給了就在 dur 內滑到那個頻率 */
	function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
		const t0 = ctx.currentTime + start
		const osc = track(ctx.createOscillator())
		const gain = ctx.createGain()
		osc.type = type
		osc.frequency.setValueAtTime(freq, t0)
		if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
		gain.gain.setValueAtTime(0.0001, t0)
		gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
		gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
		osc.connect(gain).connect(ctx.destination)
		osc.start(t0)
		osc.stop(t0 + dur + 0.05)
	}

	/** 帶通濾波白雜訊，頻率從 from 掃到 to：撕紙、翻卡的沙沙聲 */
	function noise(start: number, dur: number, vol: number, from: number, to: number) {
		const t0 = ctx.currentTime + start
		const length = Math.ceil(ctx.sampleRate * dur)
		const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
		const data = buffer.getChannelData(0)
		for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
		const src = track(ctx.createBufferSource())
		const filter = ctx.createBiquadFilter()
		const gain = ctx.createGain()
		src.buffer = buffer
		filter.type = 'bandpass'
		filter.Q.value = 1.2
		filter.frequency.setValueAtTime(from, t0)
		filter.frequency.exponentialRampToValueAtTime(to, t0 + dur)
		gain.gain.setValueAtTime(vol, t0)
		gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
		src.connect(filter).connect(gain).connect(ctx.destination)
		src.start(t0)
	}

	return {
		click: () => tone(880, 0, 0.08, 'triangle', 0.25, 520),
		move: () => tone(640, 0, 0.06, 'sine', 0.16, 760),
		select: () => {
			tone(988, 0, 0.12, 'triangle', 0.22)
			tone(1318.5, 0.06, 0.2, 'sine', 0.14)
		},
		tear: () => {
			noise(0, 0.45, 0.55, 900, 4200)
			noise(0.08, 0.3, 0.3, 2400, 6000)
		},
		flip: () => noise(0, 0.16, 0.35, 1600, 5200),
		reveal: (rank) => {
			const level = clampRank(rank)
			const base = REVEAL_BASE_HZ[level]!
			REVEAL_RATIOS.slice(0, revealVoiceCount(level)).forEach((ratio, i) =>
				tone(base * ratio, i * 0.07, 0.5, 'triangle', 0.22)
			)
			if (level >= 2) tone(base * 3, 0.3, 0.9, 'sine', 0.12)
		},
		collect: () => [783.99, 1046.5].forEach((freq, i) => tone(freq, i * 0.08, 0.4, 'triangle', 0.2)),
		// 柔和的低音「噗」往下滑，像星星暗下去；不用蜂鳴或警報聲
		error: () => tone(220, 0, 0.18, 'sine', 0.2, 180),
		stopAll: () => {
			for (const node of active) {
				try {
					node.stop()
				} catch {
					/* 已經停止的節點 */
				}
			}
			active.clear()
		},
	}
}
