<template>
	<div class="px-4 py-5 space-y-4">
		<header class="px-1">
			<h1 class="text-xl font-bold tracking-tight text-gray-900">{{ $t('sidemenu.m7') }}</h1>
			<p class="mt-1 text-sm text-gray-400">{{ $t('m7.subtitle', { days: DAYS }) }}</p>
		</header>

		<nav
			class="no-scrollbar sticky top-12 z-40 -mx-4 flex gap-2 overflow-x-auto bg-surface/90 px-4 py-2 backdrop-blur-sm">
			<button v-for="symbol in allSymbols" :key="symbol" type="button"
				class="flex-y-center shrink-0 gap-1.5 rounded-full border border-gray-100 bg-surface-card py-1 pl-1.5 pr-3 text-[13px] font-[500] transition active:scale-95"
				@click="scrollToCard(symbol)">
				<img :src="STOCKS[symbol].logo" alt="" class="h-5 w-5 rounded-full object-cover" />
				{{ symbol }}
			</button>
		</nav>

		<section v-for="symbol in allSymbols" :id="`m7-${symbol}`" :key="symbol" :ref="(el) => setChartRef(el, symbol)"
			class="shadow-card-primary scroll-mt-28 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card">
			<div class="flex-y-center gap-3 px-4 pt-4">
				<img :src="STOCKS[symbol].logo" :alt="`${symbol} logo`"
					class="h-10 w-10 shrink-0 rounded-xl border border-gray-100 object-cover" />
				<div class="min-w-0 flex-1">
					<div class="text-[15px] font-[600] leading-tight">{{ symbol }}</div>
					<div class="truncate text-sm text-gray-400">{{ STOCKS[symbol].name }}</div>
				</div>
				<div v-if="stats[symbol]" class="shrink-0 text-right">
					<div class="text-xl font-bold leading-tight tabular-nums">
						{{ stats[symbol].latest.toFixed(1) }}<span
							class="ml-0.5 text-xs font-[500] text-gray-400">x</span>
					</div>
					<div :class="[
						'mt-0.5 inline-block rounded-md px-1.5 text-xs font-semibold tabular-nums',
						stats[symbol].change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
					]">
						{{ stats[symbol].change >= 0 ? '+' : '' }}{{ stats[symbol].change.toFixed(1) }}%
					</div>
				</div>
			</div>

			<div class="px-2 pb-3 pt-2">
				<LazyLineChart v-if="metrics[symbol].length"
					:title="`${symbol} ${$t('company_metrics.pe_forwards_title')}`" :chart-data="metrics[symbol]"
					x-axis-key="ct" series-key="fpe" height="220px" compact />
				<button v-else-if="failed[symbol]" type="button"
					class="flex-center h-[220px] w-full rounded-xl bg-gray-50 text-sm text-gray-400"
					@click="getMetrics(symbol)">
					{{ $t('m7.load_failed') }}
				</button>
				<div v-else class="animate-gray mx-2 h-[220px] rounded-xl bg-gray-100" />
			</div>
		</section>

		<div class="shadow-card-primary rounded-2xl border border-gray-100 bg-surface-card px-4 py-5">
			<HotCompanies />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import HotCompanies from '@/components/HotCompanies.vue'
import type { StockMetrics } from '@/types/stockMetrics'

const { $publicKV } = useNuxtApp()

const DAYS = 60

const metrics = reactive({
	TSLA: [] as StockMetrics[],
	NVDA: [] as StockMetrics[],
	MSFT: [] as StockMetrics[],
	GOOG: [] as StockMetrics[],
	AMZN: [] as StockMetrics[],
	AAPL: [] as StockMetrics[],
	META: [] as StockMetrics[],
})

type M7Symbol = keyof typeof metrics

const allSymbols = Object.keys(metrics) as M7Symbol[]

const STOCKS: Record<M7Symbol, { name: string; logo: string }> = {
	TSLA: { name: 'Tesla', logo: '/hot/tsla.webp' },
	NVDA: { name: 'NVIDIA', logo: '/logo/nvda.svg' },
	MSFT: { name: 'Microsoft', logo: '/logo/msft.svg' },
	GOOG: { name: 'Alphabet', logo: '/hot/goog.webp' },
	AMZN: { name: 'Amazon', logo: '/hot/amzn.webp' },
	AAPL: { name: 'Apple', logo: '/logo/aapl.svg' },
	META: { name: 'Meta Platforms', logo: '/logo/meta.svg' },
}

const failed = reactive<Partial<Record<M7Symbol, boolean>>>({})

const getMetrics = async (symbol: M7Symbol, days: number = DAYS) => {
	if (metrics[symbol].length > 0) return
	failed[symbol] = false
	try {
		const response = await $publicKV.getStatementBySymbol(symbol, days)
		metrics[symbol] = _reverse(_get(response, 'data', []))
	} catch {
		failed[symbol] = true
	}
}

// 最新前瞻本益比，以及相較區間起點的漲跌幅
const stats = computed(() => {
	const result = {} as Record<M7Symbol, { latest: number; change: number } | null>
	for (const symbol of allSymbols) {
		const values = metrics[symbol].map((item) => parseFloat(item.fpe)).filter(Number.isFinite)
		if (values.length < 2) {
			result[symbol] = null
			continue
		}
		const first = values[0]!
		const latest = values[values.length - 1]!
		result[symbol] = { latest, change: ((latest - first) / first) * 100 }
	}
	return result
})

const chartRefs = ref<Record<string, HTMLElement | null>>({})
const setChartRef = (el: Element | ComponentPublicInstance | null, symbol: M7Symbol) => {
	if (el instanceof HTMLElement) {
		chartRefs.value[symbol] = el
	}
}

const scrollToCard = (symbol: M7Symbol) => {
	chartRefs.value[symbol]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
	allSymbols.forEach((symbol) => {
		const target = chartRefs.value[symbol]
		if (!target) return

		const { stop } = useIntersectionObserver(target, ([{ isIntersecting }]) => {
			if (isIntersecting) {
				getMetrics(symbol)
				stop()
			}
		})
	})
})
</script>

<style scoped>
.no-scrollbar {
	scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
	display: none;
}
</style>
