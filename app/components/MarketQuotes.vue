<template>
	<section>
		<SectionHeader :title="$t('market_quotes.title')">
			<template #aside>
				<span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
					{{ fetchedData.length }}
				</span>
			</template>
		</SectionHeader>

		<!-- 單張卡片 + 分隔線：比逐列各自一張卡片安靜，與最新資訊同一種容器 -->
		<ul class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card shadow-card-soft">
			<li v-for="item in fetchedData" :key="item.symbol">
				<NuxtLink
					:to="localePath(`/asset-price-chart/${item.symbol.toLowerCase()}`)"
					class="group flex items-center gap-3.5 px-4 py-3 outline-hidden transition-colors duration-200 hover:bg-gray-50 active:bg-gray-50 focus-visible:bg-gray-50 motion-reduce:transition-none"
				>
					<!-- 縮寫磚 -->
					<span
						class="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-[11px] font-semibold tracking-wide text-primary-600"
					>
						{{ getBadge(item.symbol) }}
					</span>

					<!-- 名稱 / 代號 -->
					<span class="min-w-0 flex-1">
						<span class="block truncate text-[14px] font-medium leading-tight">{{ getSymbolName(item.symbol) }}</span>
						<span class="mt-1 block text-xs uppercase leading-none tracking-wider text-gray-400">
							{{ item.symbol }}
						</span>
					</span>

					<!-- 價格 -->
					<span class="shrink-0 text-[15px] font-semibold tabular-nums">${{ parseFloat(item.price).toFixed(2) }}</span>

					<SvgIcon
						name="icon_chevron_right"
						size="1rem"
						class="-mr-1 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
					/>
				</NuxtLink>
			</li>
		</ul>
	</section>
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

	// 縮寫磚的字樣：取前兩碼會讓 USOIL / US10Y 都變成 US，所以逐檔指定
	const symbolBadgeMap: Record<string, string> = {
		BTCUSD: 'BTC',
		DXY: 'DXY',
		USOIL: 'OIL',
		US10Y: '10Y',
		XAUUSD: 'XAU',
	}

	const getSymbolName = (symbol: string): string => {
		return symbolNameMap[symbol] || symbol
	}

	const getBadge = (symbol: string): string => {
		return symbolBadgeMap[symbol] || symbol.slice(0, 3)
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
