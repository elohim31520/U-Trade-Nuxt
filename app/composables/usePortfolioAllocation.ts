import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import type { PortfolioItem } from '@/types/portfolio'
import { calcHolding, calcSummary, type HoldingMetrics } from '~/utils/portfolio'
import { useTheme, type ThemeName } from './useTheme'

type GradientPair = [from: string, to: string]

/**
 * 每檔持股的配色 [起, 終]，依持倉價值排名輪流取用。
 * canvas 吃不到 CSS 變數，所以依主題名稱查表（與 MarketBreadth 的 RING_COLOR 同做法）；
 * 列表色點、佔比條與圓環共用同一份，同一檔持股在三處是同一個顏色。
 */
const ALLOCATION_COLOR: Record<ThemeName, GradientPair[]> = {
	default: [
		['#fda59d', '#f4584b'],
		['#c4a1ff', '#8b5cf6'],
		['#7dd3fc', '#0ea5e9'],
		['#fcd34d', '#f59e0b'],
		['#6ee7b7', '#10b981'],
		['#f9a8d4', '#ec4899'],
		['#cbd5e1', '#64748b'],
	],
	'arctic-cyan': [
		['#a3e2ea', '#62c8d8'],
		['#c4b5fd', '#8b7cf0'],
		['#ffd98a', '#e6bd61'],
		['#9be8c8', '#65d4a5'],
		['#ffa3aa', '#ff6d78'],
		['#f5b3e0', '#d86fb8'],
		['#9fb4c0', '#6f8a99'],
	],
}

export interface AllocationRow extends HoldingMetrics {
	item: PortfolioItem
	symbol: string
	/** 佔整體市值的百分比（0–100）；沒有報價的持股以成本計 */
	share: number
	colors: GradientPair
	/** 給 CSS background 用的斜向漸層 */
	gradient: string
}

/** 把持股依市值由大到小排序，並算出損益、佔比與配色。 */
export function usePortfolioAllocation() {
	const portfolioStore = usePortfolioStore()
	const { themeName } = useTheme()

	const holdings = computed(() =>
		portfolioStore.portfolioData.map((item) => ({
			item,
			...calcHolding(item.quantity, item.averagePrice, portfolioStore.prices[item.stockSymbol.toUpperCase()]),
		})),
	)

	const summary = computed(() => calcSummary(holdings.value))
	const total = computed(() => summary.value.totalMarketValue)

	const rows = computed<AllocationRow[]>(() => {
		const palette = ALLOCATION_COLOR[themeName.value]
		return [...holdings.value]
			.sort((a, b) => b.marketValue - a.marketValue)
			.map((holding, index) => {
				const colors = palette[index % palette.length]!
				return {
					...holding,
					symbol: holding.item.stockSymbol,
					share: total.value > 0 ? (holding.marketValue / total.value) * 100 : 0,
					colors,
					gradient: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
				}
			})
	})

	return { rows, total, summary }
}
