<template>
	<div class="py-1">
		<div class="flex items-baseline justify-between mb-5 px-1">
			<span class="text-[13px] font-[500] tracking-widest uppercase text-gray-400">
				{{ $t('market_quotes.title') }}
			</span>
			<span class="text-sm text-gray-300">{{ fetchedData.length }} 檔</span>
		</div>

		<ul class="flex flex-col gap-2">
			<li v-for="(item, index) in fetchedData" :key="index"
				class="flex items-center gap-3 px-4 py-3.5 bg-surface-card border border-gray-100 rounded-xl cursor-pointer active:scale-[0.99] transition-all hover:border-gray-200 hover:bg-gray-50"
				@click="navigateTo(localePath(`/asset-price-chart/${item.symbol.toLowerCase()}`))">
				<!-- 縮寫 icon -->
				<div
					class="w-9 h-9 rounded-lg bg-[#FEF1EF] flex items-center justify-center text-sm font-[500] text-primary-600 shrink-0">
					{{ item.symbol.slice(0, 2) }}
				</div>

				<!-- 名稱 -->
				<div class="flex-1 min-w-0">
					<div class="text-[14px] font-[500] truncate">{{ getSymbolName(item.symbol) }}</div>
					<div class="text-sm text-gray-400 mt-0.5">{{ item.symbol }}</div>
				</div>

				<!-- 分隔線 -->
				<div class="w-px h-7 bg-gray-100 shrink-0" />

				<!-- 價格 -->
				<div class="text-right shrink-0">
					<div class="text-[15px] font-[500] tabular-nums">
						${{ parseFloat(item.price).toFixed(2) }}
					</div>
				</div>
			</li>
		</ul>
	</div>
</template>

<script lang="ts" setup>
const { $publicKV } = useNuxtApp()
const localePath = useLocalePath()

const symbolNameMap: Record<string, string> = {
	BTCUSD: $t('market_quotes.btcusd'),
	DXY: $t('market_quotes.dxy'),
	USOIL: $t('market_quotes.usoil'),
	US10Y: $t('market_quotes.us10y'),
	XAUUSD: $t('market_quotes.xauusd'),
}

const getSymbolName = (symbol: string): string => {
	return symbolNameMap[symbol] || symbol
}

const {
	data: fetchedData,
	pending,
	error,
} = await useAsyncData(
	'market-quotes-data',
	async () => {
		const res = await $publicKV.getQuotes()
		return _get(res, 'data', [])
	},
	{
		default: () => [],
	}
)
</script>