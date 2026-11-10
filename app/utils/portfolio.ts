/** 單一持股的成本、市值與未實現損益。 */
export interface HoldingMetrics {
	/** 成本 = 數量 × 均價 */
	cost: number
	/** 現價；查不到報價時為 null */
	price: number | null
	/** 市值 = 數量 × 現價；查不到報價時退回成本，讓佔比與總市值仍有意義 */
	marketValue: number
	/** 未實現損益 = 市值 − 成本；沒有現價時為 null */
	unrealizedProfitLoss: number | null
	/** 未實現報酬率（%）= 未實現損益 ÷ 成本；沒有現價或成本為 0 時為 null */
	unrealizedProfitLossPercent: number | null
}

export interface PortfolioSummary {
	/** 總市值（沒有報價的持股以成本計入） */
	totalMarketValue: number
	/** 總成本 */
	totalCost: number
	/** 未實現損益：只計入有報價的持股；全部都沒報價時為 null */
	unrealizedProfitLoss: number | null
	/** 未實現報酬率（%）：分母同樣只取有報價持股的成本 */
	unrealizedProfitLossPercent: number | null
	/** 沒有報價的持股檔數 */
	unpricedHoldingCount: number
}

/** 後端的數字可能是 string（PostgreSQL numeric），統一轉成有限的 number。 */
const toNumber = (input: unknown): number => {
	const n = Number(input)
	return Number.isFinite(n) ? n : 0
}

export function calcHolding(
	quantity: unknown,
	averagePrice: unknown,
	price: number | null | undefined
): HoldingMetrics {
	const numericQuantity = toNumber(quantity)
	const cost = numericQuantity * toNumber(averagePrice)

	if (price == null || !Number.isFinite(price) || price <= 0) {
		return {
			cost,
			price: null,
			marketValue: cost,
			unrealizedProfitLoss: null,
			unrealizedProfitLossPercent: null,
		}
	}

	const marketValue = numericQuantity * price
	const unrealizedProfitLoss = marketValue - cost
	return {
		cost,
		price,
		marketValue,
		unrealizedProfitLoss,
		unrealizedProfitLossPercent: cost > 0 ? (unrealizedProfitLoss / cost) * 100 : null,
	}
}

export function calcSummary(holdings: HoldingMetrics[]): PortfolioSummary {
	let totalMarketValue = 0
	let totalCost = 0
	// 只統計有報價的持股，損益與報酬率才不會被沒報價的成本稀釋
	let pricedMarketValue = 0
	let pricedCost = 0
	let unpricedHoldingCount = 0

	for (const holding of holdings) {
		totalMarketValue += holding.marketValue
		totalCost += holding.cost
		if (holding.unrealizedProfitLoss === null) {
			unpricedHoldingCount++
		} else {
			pricedMarketValue += holding.marketValue
			pricedCost += holding.cost
		}
	}

	const hasPricedHolding = unpricedHoldingCount < holdings.length
	const unrealizedProfitLoss = hasPricedHolding ? pricedMarketValue - pricedCost : null

	return {
		totalMarketValue,
		totalCost,
		unrealizedProfitLoss,
		unrealizedProfitLossPercent:
			unrealizedProfitLoss !== null && pricedCost > 0 ? (unrealizedProfitLoss / pricedCost) * 100 : null,
		unpricedHoldingCount,
	}
}
