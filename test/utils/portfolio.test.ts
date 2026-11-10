import { describe, expect, it } from 'vitest'
import { calcHolding, calcSummary } from '../../app/utils/portfolio'

describe('calcHolding', () => {
	it('有現價時算出市值、損益與報酬率', () => {
		const holding = calcHolding(10, 100, 120)
		expect(holding).toEqual({
			cost: 1000,
			price: 120,
			marketValue: 1200,
			unrealizedProfitLoss: 200,
			unrealizedProfitLossPercent: 20,
		})
	})

	it('虧損時損益與報酬率為負', () => {
		const holding = calcHolding(10, 100, 80)
		expect(holding.unrealizedProfitLoss).toBe(-200)
		expect(holding.unrealizedProfitLossPercent).toBe(-20)
	})

	it('後端回傳字串（PostgreSQL numeric）也能算', () => {
		const holding = calcHolding('1000', '2500.00', 4123.77)
		expect(holding.cost).toBe(2_500_000)
		expect(holding.marketValue).toBeCloseTo(4_123_770)
		expect(holding.unrealizedProfitLoss).toBeCloseTo(1_623_770)
	})

	it.each([null, undefined, 0, -1, NaN, Infinity])('現價為 %s 時沒有損益，市值退回成本', (price) => {
		const holding = calcHolding(10, 100, price as number | null | undefined)
		expect(holding).toEqual({
			cost: 1000,
			price: null,
			marketValue: 1000,
			unrealizedProfitLoss: null,
			unrealizedProfitLossPercent: null,
		})
	})

	it('成本為 0（例如贈股）時有損益但沒有報酬率', () => {
		const holding = calcHolding(10, 0, 50)
		expect(holding.unrealizedProfitLoss).toBe(500)
		expect(holding.unrealizedProfitLossPercent).toBeNull()
	})

	it('數量或均價缺漏時當成 0，不產生 NaN', () => {
		const holding = calcHolding(undefined, 'abc', 10)
		expect(holding.cost).toBe(0)
		expect(holding.marketValue).toBe(0)
		expect(holding.unrealizedProfitLoss).toBe(0)
	})
})

describe('calcSummary', () => {
	it('合計市值、成本與損益', () => {
		const summary = calcSummary([calcHolding(10, 100, 120), calcHolding(5, 200, 180)])
		expect(summary.totalMarketValue).toBe(1200 + 900)
		expect(summary.totalCost).toBe(1000 + 1000)
		expect(summary.unrealizedProfitLoss).toBe(100)
		expect(summary.unrealizedProfitLossPercent).toBe(5)
		expect(summary.unpricedHoldingCount).toBe(0)
	})

	it('沒有報價的持股以成本計入市值，但不影響損益與報酬率', () => {
		const summary = calcSummary([calcHolding(10, 100, 120), calcHolding(5, 200, null)])
		expect(summary.totalMarketValue).toBe(1200 + 1000)
		expect(summary.totalCost).toBe(2000)
		expect(summary.unrealizedProfitLoss).toBe(200)
		expect(summary.unrealizedProfitLossPercent).toBe(20) // 分母只取有報價持股的成本（1000），不是總成本
		expect(summary.unpricedHoldingCount).toBe(1)
	})

	it('全部都沒有報價時損益為 null', () => {
		const summary = calcSummary([calcHolding(10, 100, null)])
		expect(summary.unrealizedProfitLoss).toBeNull()
		expect(summary.unrealizedProfitLossPercent).toBeNull()
		expect(summary.unpricedHoldingCount).toBe(1)
	})

	it('空清單', () => {
		expect(calcSummary([])).toEqual({
			totalMarketValue: 0,
			totalCost: 0,
			unrealizedProfitLoss: null,
			unrealizedProfitLossPercent: null,
			unpricedHoldingCount: 0,
		})
	})
})
