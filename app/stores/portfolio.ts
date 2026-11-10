import { defineStore } from 'pinia'
import type { PortfolioItem } from '@/types/portfolio'

export const usePortfolioStore = defineStore('portfolio', {
	state: () => ({
		portfolioData: [] as PortfolioItem[],
		/** 代號（大寫）→ 現價。股票來自 /stock/today，BTC、黃金等來自 /market/quotes */
		prices: {} as Record<string, number>,
	}),
	actions: {
		async fetchPrices() {
			const { $publicKV } = useNuxtApp()
			const [quotes, stocks] = await Promise.allSettled([$publicKV.getQuotes(), $publicKV.getTodayStocks()])

			const next: Record<string, number> = {}
			const collect = (list: { symbol?: string | null; price: string }[] | undefined) => {
				for (const entry of list ?? []) {
					const price = Number(entry.price)
					if (entry.symbol && Number.isFinite(price) && price > 0) next[entry.symbol.toUpperCase()] = price
				}
			}
			if (stocks.status === 'fulfilled') collect(_get(stocks.value, 'data'))
			if (quotes.status === 'fulfilled') collect(_get(quotes.value, 'data'))

			// 兩邊都失敗就保留上一次的報價，免得整頁損益瞬間消失
			if (Object.keys(next).length) this.prices = next
		},
		async fetchMyPortfolio() {
			try {
				const { isAuthenticated } = useAuth()
				if (!isAuthenticated.value) return
				const res = await useNuxtApp().$bffApi.getPortfolios()
				if (_isArray(_get(res, 'data'))) {
					this.portfolioData = _get(res, 'data')
				} else {
					console.error('Portfolio data 必須是陣列:', res.data)
					this.portfolioData = []
				}
			} catch (error) {
				console.error('Failed to fetch portfolio data:', error)
				this.portfolioData = []
			}
		},
		async fetchMockPortfolio() {
			fetch('/mock/portfolio.json')
				.then((res) => res.json())
				.then((data) => {
					this.portfolioData = _get(data, 'data')
				})
				.catch((error) => {
					console.error('Failed to fetch mock portfolio data:', error)
					this.portfolioData = []
				})
		},
	},
})
