<template>
	<div class="py-1">
		<div class="flex items-baseline justify-between mb-5 px-1">
			<span class="text-sm font-bold tracking-widest uppercase">
				{{ $t('volatile_asset.hv') }}
			</span>
		</div>

		<!-- 自訂 tabs，取代 van-tabs -->
		<div class="flex gap-2 mb-4">
			<button class="flex-1 py-2 text-sm font-[500] border rounded-lg transition-all" :class="activeTab === 0
				? 'bg-[#EAF3DE] border-[#97C459] text-[#3B6D11]'
				: 'bg-surface-card border-gray-100 text-gray-400'" @click="activeTab = 0">
				{{ $t('volatile_asset.strong_stocks') }}
			</button>
			<button class="flex-1 py-2 text-sm font-[500] border rounded-lg transition-all" :class="activeTab === 1
				? 'bg-[#FAECE7] border-[#F0997B] text-[#993C1D]'
				: 'bg-surface-card border-gray-100 text-gray-400'" @click="activeTab = 1">
				{{ $t('volatile_asset.weak_stocks') }}
			</button>
		</div>

		<!-- 列表 -->
		<ul class="flex flex-col gap-2">
			<li v-for="(stock, index) in activeTab === 0 ? winners : losers" :key="index"
				class="flex items-center gap-3 px-4 py-3.5 bg-surface-card border border-gray-100 rounded-xl cursor-pointer active:scale-[0.99] transition-all hover:border-gray-200 hover:bg-gray-50"
				@click="handleRoute(stock)">
				<!-- 排名 -->
				<!-- <span class="w-5 text-[12px] text-gray-300 tabular-nums text-center shrink-0">
					{{ index + 1 }}
				</span> -->

				<!-- icon badge -->
				<div class="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-[500] shrink-0"
					:class="activeTab === 0 ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FAECE7] text-[#993C1D]'">
					{{ stock.symbol ?? '??' }}
				</div>

				<!-- 名稱 -->
				<div class="flex-1 min-w-0">
					<div class="text-[14px] font-[500] truncate">{{ stock.name }}</div>
					<div class="text-[12px] text-gray-400 mt-0.5">{{ stock.symbol }}</div>
				</div>

				<!-- 分隔線 -->
				<div class="w-px h-7 bg-gray-100 shrink-0" />

				<!-- 漲跌幅 -->
				<span class="text-[15px] font-[500] tabular-nums shrink-0"
					:class="activeTab === 0 ? 'text-[#3B6D11]' : 'text-[#993C1D]'">
					{{ stock.dayChg }}%
				</span>
			</li>
		</ul>
	</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TodayStockPrice } from '@/types/stock'

const localePath = useLocalePath()

const activeTab = ref(0)
const { $publicKV } = useNuxtApp()

const { data: fetchedData } = await useAsyncData('volatile-asset', async () => {
	const res = await $publicKV.getTodayStocks()
	return res.data
})

const winners = computed(() => {
	return fetchedData.value?.slice(0, 5) || []
})

const losers = computed(() => {
	return fetchedData.value?.slice(-5) || []
})

const handleRoute = (stock: TodayStockPrice) => {
	if (stock.symbol) {
		navigateTo(localePath(`/company-metrics/${stock.symbol}`))
	}
}
</script>
