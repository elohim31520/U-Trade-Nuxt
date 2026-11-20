import { describe, expect, it } from 'vitest'
import {
	PACK_COUNT,
	PACK_LID_Y,
	PACK_STEP,
	packIdleSway,
	packLidPose,
	packShake,
	selectedPackIndex,
	shortestPackTurn,
} from '../../app/utils/cardPack'

describe('selectedPackIndex', () => {
	it('每往左翻一包（目標角度 -STEP），正前方就換成下一包', () => {
		expect(selectedPackIndex(0)).toBe(0)
		expect(selectedPackIndex(-PACK_STEP)).toBe(1)
		expect(selectedPackIndex(-PACK_STEP * 5)).toBe(5)
	})
	it('往右翻或轉超過一圈都繞回 0～5', () => {
		expect(selectedPackIndex(PACK_STEP)).toBe(5)
		expect(selectedPackIndex(-PACK_STEP * PACK_COUNT)).toBe(0)
		expect(selectedPackIndex(-PACK_STEP * (PACK_COUNT + 2))).toBe(2)
		expect(selectedPackIndex(PACK_STEP * (PACK_COUNT * 3 + 1))).toBe(5)
	})
	it('拖曳到一半（還沒超過半格）仍算原本那一包', () => {
		expect(selectedPackIndex(-PACK_STEP * 0.4)).toBe(0)
		expect(selectedPackIndex(-PACK_STEP * 1.4)).toBe(1)
	})
})

describe('shortestPackTurn', () => {
	it('已經在正前方回 0', () => {
		expect(shortestPackTurn(3, 3)).toBe(0)
	})
	it('走最短的一邊：右邊近就正、左邊近就負', () => {
		expect(shortestPackTurn(0, 1)).toBe(1)
		expect(shortestPackTurn(0, 2)).toBe(2)
		expect(shortestPackTurn(0, 5)).toBe(-1)
		expect(shortestPackTurn(0, 4)).toBe(-2)
		expect(shortestPackTurn(5, 0)).toBe(1)
	})
	it('剛好在對面（相隔 3 包）取正方向', () => {
		expect(shortestPackTurn(0, 3)).toBe(3)
		expect(shortestPackTurn(4, 1)).toBe(3)
	})
	it('任何起訖點，轉過去之後正前方就是目標', () => {
		for (let from = 0; from < PACK_COUNT; from++) {
			for (let to = 0; to < PACK_COUNT; to++) {
				const turn = shortestPackTurn(from, to)
				expect(Math.abs(turn)).toBeLessThanOrEqual(PACK_COUNT / 2)
				// 目前正前方是 from（目標角度 -from × STEP）；goTo 翻 turn 包＝目標角度再減 turn × STEP
				expect(selectedPackIndex(-(from + turn) * PACK_STEP)).toBe(to)
			}
		}
	})
})

describe('撕開動畫', () => {
	it('蓄力段（前 20%）抖動、封條不動；之後不抖', () => {
		expect(packLidPose(0)).toEqual({ x: 0, y: PACK_LID_Y, rotationZ: -0 })
		expect(packLidPose(0.2)).toEqual({ x: 0, y: PACK_LID_Y, rotationZ: -0 })
		expect(packShake(0.1, 1000)).not.toBe(0)
		expect(packShake(0.2, 1000)).toBe(0)
		expect(packShake(0.9, 1000)).toBe(0)
	})
	it('抖動幅度不超過 0.04 弧度', () => {
		for (let now = 0; now < 500; now += 7) {
			expect(Math.abs(packShake(0.1, now))).toBeLessThanOrEqual(0.04)
		}
	})
	it('進度到 1 封條飛到終點，超過 1 也停在終點；中途單調往上', () => {
		expect(packLidPose(1)).toEqual({ x: 1.5, y: PACK_LID_Y + 2, rotationZ: -1 })
		expect(packLidPose(3)).toEqual(packLidPose(1))
		const ys = [0.2, 0.4, 0.6, 0.8, 1].map((p) => packLidPose(p).y)
		expect([...ys].sort((a, b) => a - b)).toEqual(ys)
		// ease-out：前半段飛得比後半段多
		expect(packLidPose(0.6).y - packLidPose(0.2).y).toBeGreaterThan(packLidPose(1).y - packLidPose(0.6).y)
	})
	it('待機搖晃很輕微，六包的相位錯開', () => {
		for (let k = 0; k < PACK_COUNT; k++) {
			expect(Math.abs(packIdleSway(12345, k))).toBeLessThanOrEqual(0.025)
		}
		expect(packIdleSway(0, 0)).not.toBe(packIdleSway(0, 1))
	})
})
