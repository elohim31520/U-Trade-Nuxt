import { describe, expect, it, vi } from 'vitest'
import { createCardPackSynth, revealPlaybackRate, revealVoiceCount } from '../../app/utils/cardPackSound'

/** 最小的假 AudioContext：只記錄「誰被建立、被啟動、被停止」，不真的出聲 */
class FakeParam {
	value = 1
	setValueAtTime = vi.fn()
	exponentialRampToValueAtTime = vi.fn()
}

class FakeNode {
	type = ''
	buffer: unknown = null
	onended: (() => void) | null = null
	frequency = new FakeParam()
	gain = new FakeParam()
	Q = new FakeParam()
	stopped = 0
	connect(next: unknown) {
		return next
	}
	start() {}
	stop() {
		this.stopped += 1
	}
}

class FakeAudioContext {
	currentTime = 0
	sampleRate = 8000
	destination = new FakeNode()
	oscillators: FakeNode[] = []
	sources: FakeNode[] = []
	createOscillator() {
		const node = new FakeNode()
		this.oscillators.push(node)
		return node
	}
	createBufferSource() {
		const node = new FakeNode()
		this.sources.push(node)
		return node
	}
	createGain() {
		return new FakeNode()
	}
	createBiquadFilter() {
		return new FakeNode()
	}
	createBuffer(_channels: number, length: number) {
		return { getChannelData: () => new Float32Array(length) }
	}
}

function setup() {
	const ctx = new FakeAudioContext()
	const synth = createCardPackSynth(ctx as unknown as AudioContext)
	const started = () => ctx.oscillators.length + ctx.sources.length
	return { ctx, synth, started }
}

describe('卡包音效', () => {
	it('每一種音效都能播', () => {
		for (const name of ['click', 'move', 'select', 'tear', 'flip', 'collect', 'error'] as const) {
			const { synth, started } = setup()
			synth[name]()
			expect(started(), name).toBeGreaterThan(0)
		}
	})

	it('揭曉：稀有度越高，疊的音越多；等級 2 以上另外加一個高八度的長音', () => {
		const counts = [0, 1, 2, 3].map((rank) => {
			const { synth, started } = setup()
			synth.reveal(rank)
			return started()
		})
		expect(counts).toEqual([2, 3, 5, 5])
		expect([0, 1, 2, 3].map(revealVoiceCount)).toEqual([2, 3, 4, 4])
	})

	it('音檔版的揭曉依稀有度加快播放速度，等級超出範圍時夾回 0～3', () => {
		const rates = [0, 1, 2, 3].map(revealPlaybackRate)
		rates.forEach((rate, i) => expect(rate).toBeCloseTo(1 + i * 0.06, 10))
		expect(revealPlaybackRate(-5)).toBe(1)
		expect(revealPlaybackRate(99)).toBeCloseTo(1.18, 10)
		expect(revealPlaybackRate(Number.NaN)).toBe(1)
	})

	it('揭曉的等級超出範圍時夾回 0～3，不會出錯', () => {
		const { synth, started } = setup()
		expect(() => synth.reveal(-1)).not.toThrow()
		expect(() => synth.reveal(9)).not.toThrow()
		expect(() => synth.reveal(Number.NaN)).not.toThrow()
		expect(started()).toBeGreaterThan(0)
	})

	it('撕封條是兩層雜訊（沒有音高）', () => {
		const { synth, ctx } = setup()
		synth.tear()
		expect(ctx.sources).toHaveLength(2)
		expect(ctx.oscillators).toHaveLength(0)
	})

	it('stopAll 停掉所有還沒播完的音，播完的不會再被停', () => {
		const { synth, ctx } = setup()
		synth.reveal(1)
		// 排程時合成器自己會呼叫一次 stop(結束時間)，所以以 stopAll 前後的差來判斷
		const before = ctx.oscillators.map((node) => node.stopped)
		ctx.oscillators[0]!.onended?.()
		synth.stopAll()
		const delta = ctx.oscillators.map((node, i) => node.stopped - before[i]!)
		expect(delta).toEqual([0, 1, 1])
	})
})
