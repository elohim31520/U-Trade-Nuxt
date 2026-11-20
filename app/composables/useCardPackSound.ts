import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { CardPackConfig, CardPackSoundName } from '@/types/cardPack'
import { createCardPackSynth, revealPlaybackRate, type CardPackSynth } from '@/utils/cardPackSound'

/** 一小段無聲 WAV：iOS 的靜音鍵會把 Web Audio 一起靜音，先播一次 <audio> 把音訊工作階段切成「播放」類別 */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

/**
 * 卡包音效（各風格的卡包頁共用同一個音效開關，存 config.soundKey）。設計稿交付的音檔（config.audio.files）優先播，沒有音檔的（或音檔還沒載好時）用 utils/cardPackSound.ts
 * 的合成器頂替，所以音檔缺一個、載入失敗都不會讓流程卡住。沒有背景音樂（設計稿還沒交付）。
 *
 * 瀏覽器端的生命週期：
 * - 瀏覽器規定音訊要使用者操作後才能出聲，所以 AudioContext 等第一次要播的時候才建立；
 *   音檔在頁面載入後先下載（很小，全部加起來十幾 KB），AudioContext 建好才解碼。
 * - 分頁切到背景時暫停整個音訊，回來再繼續。
 * - 開關存在 localStorage，預設開啟；關掉會立刻停掉所有還在播的音。
 * - 音效只是加分項：瀏覽器擋住或不支援 Web Audio 時丟出的錯誤一律吞掉，
 *   不然開包流程會卡在音效那一行（次數已扣、動畫不播、揭曉不出現）。
 */
export function useCardPackSound(config: CardPackConfig) {
	const audio = config.audio
	const enabled = ref(true)
	let ctx: AudioContext | null = null
	let synth: CardPackSynth | null = null
	let iosUnlocked = false
	/** 下載好、還沒解碼的音檔 */
	const raw = new Map<CardPackSoundName, ArrayBuffer>()
	const buffers = new Map<CardPackSoundName, AudioBuffer>()
	const playing = new Set<AudioBufferSourceNode>()

	function unlockIOS() {
		if (iosUnlocked) return
		iosUnlocked = true
		try {
			const silent = new Audio(SILENT_WAV)
			silent.setAttribute('playsinline', '')
			void silent.play().catch(() => {
				/* 不支援或被擋住時略過 */
			})
		} catch {
			/* 同上 */
		}
	}

	/** 頁面載入後先把音檔抓下來；失敗的那個之後就用合成音（沒有設定音檔的風格全部用合成音） */
	function downloadFiles() {
		if (!audio) return
		for (const name of audio.files) {
			fetch(`${audio.dir}/${name}.mp3`)
				.then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
				.then((data) => {
					raw.set(name, data)
					if (ctx) decode(name)
				})
				.catch(() => {
					/* 沒有這個音檔就用合成音 */
				})
		}
	}

	function decode(name: CardPackSoundName) {
		const data = raw.get(name)
		if (!data || !ctx) return
		raw.delete(name)
		ctx
			.decodeAudioData(data)
			.then((buffer) => buffers.set(name, buffer))
			.catch(() => {
				/* 解碼失敗就用合成音 */
			})
	}

	/** 第一次呼叫時建立 AudioContext 與合成器；不支援 Web Audio 回 null */
	function ensure(): CardPackSynth | null {
		unlockIOS()
		if (!synth) {
			const Ctor: typeof AudioContext | undefined =
				window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
			if (!Ctor) return null
			ctx = new Ctor()
			synth = createCardPackSynth(ctx)
			for (const name of [...raw.keys()]) decode(name)
		}
		if (ctx?.state === 'suspended') void ctx.resume()
		return synth
	}

	/** 播音檔；還沒有音檔（沒交付、沒載好、沒解碼完）回 false，由呼叫端改用合成音 */
	function playFile(name: CardPackSoundName, rate: number): boolean {
		const buffer = buffers.get(name)
		if (!buffer || !ctx) return false
		const source = ctx.createBufferSource()
		const gain = ctx.createGain()
		source.buffer = buffer
		source.playbackRate.value = rate
		gain.gain.value = audio?.levels[name] ?? 1
		source.connect(gain).connect(ctx.destination)
		playing.add(source)
		source.onended = () => playing.delete(source)
		source.start()
		return true
	}

	function stopAll() {
		synth?.stopAll()
		for (const source of playing) {
			try {
				source.stop()
			} catch {
				/* 已經停止的節點 */
			}
		}
		playing.clear()
	}

	function play(name: CardPackSoundName, fallback: (synth: CardPackSynth) => void, rate = 1) {
		if (!enabled.value) return
		try {
			const current = ensure()
			if (!current) return
			if (!playFile(name, rate)) fallback(current)
		} catch {
			/* 沒聲音就沒聲音 */
		}
	}

	function toggle() {
		enabled.value = !enabled.value
		try {
			localStorage.setItem(config.soundKey, enabled.value ? 'on' : 'off')
		} catch {
			/* 只在本次頁面生效 */
		}
		if (!enabled.value) stopAll()
	}

	// 分頁切到背景時暫停整個音訊
	function onVisibilityChange() {
		if (!ctx) return
		if (document.hidden) void ctx.suspend()
		else if (enabled.value) void ctx.resume()
	}

	onMounted(() => {
		try {
			enabled.value = localStorage.getItem(config.soundKey) !== 'off'
		} catch {
			/* localStorage 不可用時用預設值 */
		}
		document.addEventListener('visibilitychange', onVisibilityChange)
		downloadFiles()
	})

	onBeforeUnmount(() => {
		document.removeEventListener('visibilitychange', onVisibilityChange)
		stopAll()
		void ctx?.close()
		ctx = null
		synth = null
	})

	return {
		enabled,
		toggle,
		/** 按鈕 */
		click: () => play('click', (s) => s.click()),
		/** 切換卡包 */
		move: () => play('move', (s) => s.move()),
		/** 點選一包（選定） */
		select: () => play('select', (s) => s.select()),
		/** 撕開封條 */
		tear: () => play('tear', (s) => s.tear()),
		/** 翻卡 */
		flip: () => play('flip', (s) => s.flip()),
		/** 揭曉，依稀有度等級 0～3 升調 */
		reveal: (rank: number) => play('reveal', (s) => s.reveal(rank), revealPlaybackRate(rank)),
		/** 收下獎勵（關閉揭曉） */
		collect: () => play('collect', (s) => s.collect()),
		/** 次數不足、尚無獎項、開包失敗 */
		error: () => play('error', (s) => s.error()),
	}
}
