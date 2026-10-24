<template>
	<div class="min-h-screen bg-gray-50">
		<!-- 過濾工具列 -->
		<div class="sticky top-0 z-10 bg-surface-card/90 backdrop-blur-xs border-b border-gray-100 px-3 py-2.5">
			<van-row gutter="8">
				<van-col span="8">
					<van-button size="small" block hairline round class="text-xs! font-semibold!" @click="toggleSort">
						{{ sortOrder === 'asc' ? $t('volatile_stock.sort.asc') : $t('volatile_stock.sort.desc') }}
					</van-button>
				</van-col>

				<van-col span="8">
					<van-button size="small" block hairline round :type="filter === 'positive' ? 'success' : 'default'"
						@click="setFilter('positive')">
						▲ {{ $t('volatile_stock.filter.positive') }}
					</van-button>
				</van-col>

				<van-col span="8">
					<van-button size="small" block hairline round :type="filter === 'negative' ? 'danger' : 'default'"
						@click="setFilter('negative')">
						▼ {{ $t('volatile_stock.filter.negative') }}
					</van-button>
				</van-col>
			</van-row>
		</div>

		<!-- 股票列表 -->
		<ul class="px-3 pt-3 pb-24 space-y-1.5">
			<li v-for="(stock, index) in displayedData" :key="index"
				class="group flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-card border border-gray-100 cursor-pointer active:scale-[0.98] transition-all duration-150 hover:border-gray-200 hover:shadow-card-primary"
				@click="handleRoute(stock)">
				<div class="shrink-0">
					<CompanyIcon :symbol="stock.symbol || ''" />
				</div>

				<div class="flex-1 min-w-0">
					<div class="text-xs font-bold text-primary tracking-wide">{{ stock.symbol }}</div>
					<div class="text-sm text-gray-500 truncate leading-snug mt-0.5">{{ stock.name }}</div>
				</div>

				<div class="shrink-0 min-w-[4.5rem] text-right px-2.5 py-1.5 rounded-lg text-sm font-bold tabular-nums"
					:class="+stock.dayChg >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'">
					{{ +stock.dayChg >= 0 ? '+' : '' }}{{ stock.dayChg }}%
				</div>
			</li>
		</ul>

		<van-back-top right="1rem" bottom="3.5rem" />
	</div>
</template>

<script lang="ts" setup>
const { $publicKV } = useNuxtApp()
import type { TodayStockPrice } from '@/types/stock'

const { data: fetchedData } = await useAsyncData('volatile-stock', async () => {
	const res = await $publicKV.getTodayStocks()
	return res.data
})

// 排序方向：'asc' | 'desc'
const sortOrder = ref<'asc' | 'desc'>('desc')

// 過濾模式：'all' | 'positive' | 'negative'
const filter = ref<'all' | 'positive' | 'negative'>('all')

const toggleSort = () => {
	sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const setFilter = (type: 'positive' | 'negative') => {
	// 再次點選同一個按鈕則取消過濾
	filter.value = filter.value === type ? 'all' : type
}

const displayedData = computed(() => {
	if (!fetchedData.value) return []

	let result = [...fetchedData.value]

	// 過濾
	if (filter.value === 'positive') {
		result = result.filter((s) => +s.dayChg > 0)
	} else if (filter.value === 'negative') {
		result = result.filter((s) => +s.dayChg < 0)
	}

	// 排序
	result.sort((a, b) => {
		const diff = +a.dayChg - +b.dayChg
		return sortOrder.value === 'asc' ? diff : -diff
	})

	return result
})

const handleRoute = (stock: TodayStockPrice) => {
	if (stock.symbol) {
		navigateTo(`/company-metrics/${stock.symbol}`)
	}
}

const { t } = useI18n()

usePageSeo(computed(() => ({
	title: t('volatile_stock.meta_title'),
	description: t('volatile_stock.meta_description'),
})))
</script>