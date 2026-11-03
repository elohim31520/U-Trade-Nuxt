<template>
	<div class="px-4 pb-6 pt-4">
		<header class="mb-5 px-1">
			<h1 class="text-[26px] font-bold leading-tight tracking-tight text-gray-900">{{ $t('volatile_stock.title') }}</h1>
			<p class="mt-1.5 text-[13px] leading-snug text-gray-500">{{ $t('volatile_stock.subtitle') }}</p>
		</header>

		<!-- 漲跌分布：一眼看出今天偏多還是偏空 -->
		<section
			v-if="stocks.length"
			class="mb-4 rounded-2xl border border-gray-100 bg-surface-card p-4 shadow-card-soft motion-safe:animate-row-in"
		>
			<div class="flex items-end justify-between gap-3">
				<div>
					<div class="flex items-center gap-1.5 text-xs font-medium text-gray-500">
						<SvgIcon name="icon_triangle" size="8px" class="text-emerald-500" />
						{{ $t('volatile_stock.up') }}
					</div>
					<div class="mt-1 text-[28px] font-bold leading-none tabular-nums tracking-tight text-emerald-600">
						{{ upCount }}
					</div>
				</div>

				<div class="text-right">
					<div class="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-500">
						{{ $t('volatile_stock.down') }}
						<SvgIcon name="icon_triangle" size="8px" class="rotate-180 text-red-500" />
					</div>
					<div class="mt-1 text-[28px] font-bold leading-none tabular-nums tracking-tight text-red-500">
						{{ downCount }}
					</div>
				</div>
			</div>

			<div class="mt-3.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
				<span
					v-if="upCount"
					class="rounded-full bg-emerald-500/80 transition-[width] duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
					:style="{ width: `${upPct}%` }"
				/>
				<span
					v-if="downCount"
					class="rounded-full bg-red-500/80 transition-[width] duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
					:style="{ width: `${100 - upPct}%` }"
				/>
			</div>
		</section>

		<!-- 過濾 + 排序：貼在 header 底下，滑動時一直在 -->
		<div class="sticky top-12 z-10 -mx-4 mb-2 flex items-center gap-2 bg-surface/90 px-4 py-2 backdrop-blur-md">
			<!-- 分段切換：底板跟著 active 項目滑動，顏色依漲／跌換 -->
			<div
				role="tablist"
				class="relative grid min-w-0 flex-1 grid-cols-3 rounded-xl border border-gray-100 bg-gray-50 p-1"
			>
				<span
					aria-hidden="true"
					class="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-lg border shadow-[0_1px_2px_rgb(16_24_40/0.06)] transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
					:class="activeFilter.thumbClass"
					:style="{ transform: `translateX(${activeIndex * 100}%)` }"
				/>

				<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
				<button
					v-for="item in filters"
					:key="item.value"
					type="button"
					role="tab"
					:aria-selected="filter === item.value"
					class="relative z-1 rounded-lg py-1.5 [-webkit-tap-highlight-color:transparent]"
					@click="filter = item.value"
				>
					<span
						class="inline-flex items-center justify-center gap-1 text-[13px] font-medium tracking-wide transition-colors duration-300 motion-reduce:transition-none"
						:class="filter === item.value ? item.activeClass : 'text-gray-400'"
					>
						{{ item.label }}
					</span>
				</button>
			</div>

			<button
				type="button"
				class="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-100 bg-surface-card px-3 py-2 outline-hidden transition duration-200 [-webkit-tap-highlight-color:transparent] hover:border-gray-200 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				@click="toggleSort"
			>
				<span class="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
					{{ sortOrder === 'asc' ? $t('volatile_stock.sort.asc') : $t('volatile_stock.sort.desc') }}
					<SvgIcon
						name="icon_chevron_right"
						size="0.75rem"
						class="transition-transform duration-300 motion-reduce:transition-none"
						:class="sortOrder === 'asc' ? '-rotate-90' : 'rotate-90'"
					/>
				</span>
			</button>
		</div>

		<!-- 股票列表：切換過濾／排序時整份重播進場動畫 -->
		<ul v-if="displayedData.length" :key="`${filter}-${sortOrder}`" class="flex flex-col gap-2">
			<li
				v-for="(stock, index) in displayedData"
				:key="stock.symbol!"
				class="motion-safe:animate-row-in"
				:style="{ animationDelay: `${Math.min(index, 8) * 40}ms` }"
			>
				<NuxtLink
					:to="localePath(`/company-metrics/${stock.symbol}`)"
					class="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card py-3 pl-4 pr-3.5 outline-hidden transition duration-200 hover:border-gray-200 hover:shadow-card-primary active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				>
					<!-- 左側漲跌色條 -->
					<span
						aria-hidden="true"
						class="absolute inset-y-3.5 left-0 w-[3px] rounded-r-full"
						:class="isUp(stock) ? 'bg-emerald-500/70' : 'bg-red-500/70'"
					/>

					<!-- 公司 logo -->
					<!-- 圖磚：細描邊 + 內側頂部高光 + 分層柔影，各家品牌底色看起來是同一套（與 HotCompanies、VolatileAsset 一致） -->
					<span
						class="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06),0_4px_10px_-3px_rgb(16_24_40/0.14)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.35)]"
					>
						<img
							v-if="!failed[stock.symbol!]"
							:src="logoUrl(stock.symbol!)"
							:alt="`${stock.name} logo`"
							loading="lazy"
							draggable="false"
							class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
							@error="failed[stock.symbol!] = true"
						/>
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
						:aria-label="`${isUp(stock) ? '+' : '-'}${formatChg(stock.dayChg)}%`"
					>
						<SvgIcon name="icon_triangle" size="8px" :class="{ 'rotate-180': !isUp(stock) }" />
						{{ formatChg(stock.dayChg) }}%
					</span>
				</NuxtLink>
			</li>
		</ul>

		<!-- 空狀態 -->
		<div v-else class="flex flex-col items-center gap-3 py-20 text-gray-400">
			<SvgIcon name="icon_ghost" size="2.5rem" class="text-gray-300" />
			<p class="text-sm">{{ $t('volatile_stock.empty') }}</p>
		</div>

		<van-back-top right="1rem" bottom="3.5rem" />
	</div>
</template>

<script lang="ts" setup>
	import type { TodayStockPrice } from '@/types/stock'

	type Filter = 'all' | 'positive' | 'negative'

	const { $publicKV } = useNuxtApp()
	const localePath = useLocalePath()
	const { t } = useI18n()

	const { data: fetchedData } = await useAsyncData('volatile-stock', async () => {
		const res = await $publicKV.getTodayStocks()
		return res.data
	})

	// 排序方向：'asc' | 'desc'
	const sortOrder = ref<'asc' | 'desc'>('desc')

	// 過濾模式
	const filter = ref<Filter>('all')

	const filters = computed(() => [
		{
			value: 'all' as const,
			label: t('volatile_stock.filter.all'),
			activeClass: 'text-gray-900',
			thumbClass: 'border-gray-200 bg-surface-card',
		},
		{
			value: 'positive' as const,
			label: t('volatile_stock.filter.positive'),
			activeClass: 'text-emerald-600',
			thumbClass: 'border-emerald-500/30 bg-emerald-50',
		},
		{
			value: 'negative' as const,
			label: t('volatile_stock.filter.negative'),
			activeClass: 'text-red-500',
			thumbClass: 'border-red-500/30 bg-red-50',
		},
	])

	const activeIndex = computed(() => filters.value.findIndex((f) => f.value === filter.value))
	const activeFilter = computed(() => filters.value[activeIndex.value]!)

	const toggleSort = () => {
		sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
	}

	// 沒有 symbol 的資料既沒有 logo 也無法導頁，直接略過
	const stocks = computed(() => (fetchedData.value ?? []).filter((s) => s.symbol))

	// 漲跌分布永遠以全部資料計算，不受過濾影響
	const upCount = computed(() => stocks.value.filter((s) => +s.dayChg > 0).length)
	const downCount = computed(() => stocks.value.filter((s) => +s.dayChg < 0).length)
	const upPct = computed(() => {
		const total = upCount.value + downCount.value
		return total ? (upCount.value / total) * 100 : 0
	})

	const displayedData = computed(() => {
		let result = [...stocks.value]

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

	// logo 載入失敗的 symbol，改顯示預設圖示
	const failed = reactive<Record<string, boolean>>({})

	const logoUrl = (symbol: string) => `/logo/${symbol.toLowerCase()}.svg`

	const isUp = (stock: TodayStockPrice) => Number(stock.dayChg) >= 0
	const formatChg = (v: number | string) => Math.abs(Number(v)).toFixed(2)
	const formatPrice = (p: string) => {
		const n = Number(p)
		return Number.isFinite(n) && p !== '' ? n.toFixed(2) : null
	}

	usePageSeo(
		computed(() => ({
			title: t('volatile_stock.meta_title'),
			description: t('volatile_stock.meta_description'),
		}))
	)
</script>
