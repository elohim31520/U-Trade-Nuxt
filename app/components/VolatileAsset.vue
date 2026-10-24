<template>
	<section class="py-1">
		<header class="mb-4 flex items-baseline justify-between px-1">
			<h2 class="text-sm font-bold uppercase tracking-widest">
				{{ $t('volatile_asset.hv') }}
			</h2>
		</header>

		<!-- 分段切換：滑動的底板跟著 active 項目走，顏色依漲／跌換 -->
		<div role="tablist"
			class="relative mb-4 grid grid-cols-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
			<span aria-hidden="true" class="seg-thumb absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg border"
				:class="activeTab === 0
					? 'translate-x-0 border-emerald-500/30 bg-emerald-50'
					: 'translate-x-full border-red-500/30 bg-red-50'" />

			<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
			<button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="activeTab === tab.value"
				class="seg-tab relative z-1 rounded-lg py-2" @click="activeTab = tab.value">
				<span class="seg-label inline-flex items-center justify-center gap-1.5 text-sm font-medium tracking-wide"
					:class="activeTab === tab.value ? tab.activeClass : 'text-gray-400'">
					<svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
						<path :d="tab.value === 0 ? 'M5 1.5 9 8.5H1z' : 'M5 8.5 1 1.5h8z'" />
					</svg>
					{{ tab.label }}
				</span>
			</button>
		</div>

		<!-- 列表：以 activeTab 當 key，切換時整份重播進場動畫 -->
		<ul :key="activeTab" class="flex flex-col gap-2">
			<li v-for="(stock, index) in list" :key="stock.symbol" class="row-in" :style="{ '--i': index }">
				<NuxtLink :to="localePath(`/company-metrics/${stock.symbol}`)"
					class="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card py-3 pl-4 pr-3.5 outline-hidden transition duration-200 hover:border-gray-200 hover:shadow-card-primary active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary">
					<!-- 左側漲跌色條 -->
					<span aria-hidden="true" class="absolute inset-y-3.5 left-0 w-[3px] rounded-r-full"
						:class="isUp(stock) ? 'bg-emerald-500/70' : 'bg-red-500/70'" />

					<!-- 公司 logo -->
					<span
						class="logo-tile relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-white">
						<img v-if="!failed[stock.symbol!]" :src="logoUrl(stock.symbol!)" :alt="`${stock.name} logo`"
							loading="lazy" draggable="false"
							class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
							@error="failed[stock.symbol!] = true" />
						<SvgIcon v-else name="icon_ghost" size="1.75rem" class="text-gray-300" />
					</span>

					<!-- 名稱 / 代號 / 價格 -->
					<span class="min-w-0 flex-1">
						<span class="block truncate text-[14px] font-medium leading-tight">{{ stock.name }}</span>
						<span class="mt-1 flex items-center gap-1.5 text-xs leading-none text-gray-400">
							<span class="font-semibold uppercase tracking-wider">{{ stock.symbol }}</span>
							<template v-if="formatPrice(stock.price)">
								<span class="size-[3px] rounded-full bg-gray-200" aria-hidden="true" />
								<span class="tabular-nums">${{ formatPrice(stock.price) }}</span>
							</template>
						</span>
					</span>

					<!-- 漲跌幅 -->
					<span
						class="inline-flex min-w-[4.75rem] shrink-0 items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[15px] font-semibold tabular-nums"
						:class="isUp(stock) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
						:aria-label="`${isUp(stock) ? '+' : '-'}${formatChg(stock.dayChg)}%`">
						<svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
							<path :d="isUp(stock) ? 'M5 1.5 9 8.5H1z' : 'M5 8.5 1 1.5h8z'" />
						</svg>
						{{ formatChg(stock.dayChg) }}%
					</span>
				</NuxtLink>
			</li>
		</ul>
	</section>
</template>

<script lang="ts" setup>
import type { TodayStockPrice } from '@/types/stock'

const localePath = useLocalePath()
const { t } = useI18n()
const { $publicKV } = useNuxtApp()

const activeTab = ref(0)

const tabs = computed(() => [
	{ value: 0, label: t('volatile_asset.strong_stocks'), activeClass: 'text-emerald-600' },
	{ value: 1, label: t('volatile_asset.weak_stocks'), activeClass: 'text-red-500' },
])

const { data: fetchedData } = await useAsyncData('volatile-asset', async () => {
	const res = await $publicKV.getTodayStocks()
	return res.data
})

// 沒有 symbol 的資料既沒有 logo 也無法導頁，直接略過
const stocks = computed(() => (fetchedData.value ?? []).filter((s) => s.symbol))

const winners = computed(() => stocks.value.slice(0, 5))
// 資料由大到小排序，跌幅榜反轉後才會是「跌最多的在最上面」，與漲幅榜對稱
const losers = computed(() => stocks.value.slice(-5).reverse())
const list = computed(() => (activeTab.value === 0 ? winners.value : losers.value))

// logo 載入失敗的 symbol，改顯示預設圖示
const failed = reactive<Record<string, boolean>>({})

const logoUrl = (symbol: string) => `/logo/${symbol.toLowerCase()}.svg`

const isUp = (stock: TodayStockPrice) => Number(stock.dayChg) >= 0
const formatChg = (v: number | string) => Math.abs(Number(v)).toFixed(2)
const formatPrice = (p: string) => {
	const n = Number(p)
	return Number.isFinite(n) && p !== '' ? n.toFixed(2) : null
}
</script>

<style scoped>
/* 分段切換底板 */
.seg-thumb {
	box-shadow: 0 1px 2px rgb(16 24 40 / 0.06);
	transition:
		transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
		background-color 0.3s,
		border-color 0.3s;
}

.seg-tab {
	-webkit-tap-highlight-color: transparent;
}

.seg-label {
	transition: color 0.3s;
}

/* 圖磚：細描邊 + 內側頂部高光 + 分層柔影，各家品牌底色看起來是同一套（與 HotCompanies 一致） */
.logo-tile {
	box-shadow:
		0 1px 2px rgb(16 24 40 / 0.06),
		0 4px 10px -3px rgb(16 24 40 / 0.14);
}

.logo-tile::after {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: inherit;
	pointer-events: none;
	box-shadow:
		inset 0 0 0 1px rgb(0 0 0 / 0.06),
		inset 0 1px 0 rgb(255 255 255 / 0.35);
}

/* 切換 tab 後，列表逐筆淡入上移 */
.row-in {
	animation: row-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	animation-delay: calc(var(--i) * 45ms);
}

@keyframes row-in {
	from {
		opacity: 0;
		transform: translateY(8px);
	}
}

@media (prefers-reduced-motion: reduce) {

	.seg-thumb,
	.seg-label,
	.logo-tile img {
		transition: none;
	}

	.row-in {
		animation: none;
	}
}
</style>
