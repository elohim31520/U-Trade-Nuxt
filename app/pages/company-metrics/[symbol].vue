<template>
	<div class="px-4 pb-6 pt-4">
		<!-- 公司抬頭：logo、代號、最新收盤價與單日漲跌。背景的光暈跟著漲跌換色 -->
		<section
			class="relative mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-surface-card p-4 shadow-card-soft motion-safe:animate-row-in"
		>
			<span
				aria-hidden="true"
				class="pointer-events-none absolute -right-12 -top-14 size-48 rounded-full opacity-70 blur-3xl transition-colors duration-700 motion-reduce:transition-none"
				:class="latest ? (isUp ? 'bg-emerald-500/20' : 'bg-red-500/20') : 'bg-primary/20'"
			/>

			<div class="relative flex items-center gap-3.5">
				<!-- 圖磚樣式與公司列表、今日股價變動頁一致 -->
				<span
					class="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06),0_4px_10px_-3px_rgb(16_24_40/0.14)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.35)]"
				>
					<img
						v-if="!logoFailed"
						:src="`/logo/${symbol.toLowerCase()}.svg`"
						:alt="`${bigSymbol} logo`"
						draggable="false"
						class="size-full object-cover"
						@error="logoFailed = true"
					/>
					<SvgIcon v-else name="icon_ghost" size="2rem" class="text-gray-300" />
				</span>

				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h1 class="text-[26px] font-bold leading-none tracking-tight text-gray-900">{{ bigSymbol }}</h1>
						<span
							class="rounded-md bg-gray-100 px-1.5 py-1 text-[10px] font-semibold leading-none tracking-wider text-gray-500"
						>
							{{ symbolPrefix }}
						</span>
					</div>
					<p v-if="companyName" class="mt-2 truncate text-[13px] leading-none text-gray-500">{{ companyName }}</p>
				</div>
			</div>

			<div v-if="latest" class="relative mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
				<div class="min-w-0">
					<div class="text-[34px] font-bold leading-none tracking-tight tabular-nums text-gray-900">
						${{ formatMoney(Number(latest.pr)) }}
					</div>
					<div class="mt-2.5 text-xs leading-none text-gray-400">{{ $t('company_metrics.as_of', { date: asOf }) }}</div>
				</div>

				<span
					v-if="dayChange !== null"
					class="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-[15px] font-semibold tabular-nums"
					:class="isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
					:aria-label="`${isUp ? '+' : '-'}${Math.abs(dayChange).toFixed(2)}%`"
				>
					<SvgIcon name="icon_triangle" size="8px" :class="{ 'rotate-180': !isUp }" />
					{{ Math.abs(dayChange).toFixed(2) }}%
				</span>
			</div>
		</section>

		<!-- K 線：外框跟其他卡片同一套。TradingView 的版權連結會溢出元件底部，所以卡片留 pb-7 把它收進來並調淡；
			 它注入的樣式全是 !important，所以這裡的覆蓋也要加 ! -->
		<SectionHeader :title="$t('company_metrics.section_price')" />
		<div
			class="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card pb-7 shadow-card-soft motion-safe:animate-row-in [&_.tradingview-widget-copyright]:mt-1 [&_.tradingview-widget-copyright]:text-[11px]! [&_.tradingview-widget-copyright_.blue-text]:text-gray-400!"
			style="animation-delay: 60ms"
		>
			<TradingviewGadget :symbol="tvSymbol" :symbol-prefix="symbolPrefix" :disabled="uiStore.isMenuShown" />
		</div>

		<!-- 非熱門公司且未登入：只留上面的 K 線，指標區改成登入提示。後面糊掉的假圖表只是示意，不是真資料 -->
		<button
			v-if="!canViewMetrics"
			type="button"
			class="group relative block w-full overflow-hidden rounded-2xl border border-gray-100 bg-surface-card text-left shadow-card-soft outline-hidden transition duration-200 [-webkit-tap-highlight-color:transparent] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none motion-safe:animate-row-in"
			style="animation-delay: 120ms"
			@click="openAuthModal('login')"
		>
			<div class="h-48 w-full">
				<SvgIcon name="icon_chart_placeholder" size="100%" class="block text-primary blur-[3px]" />
			</div>

			<span
				class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-linear-to-t from-surface-card via-surface-card/80 to-surface-card/30 px-6 text-center"
			>
				<span class="mb-1 grid size-12 place-items-center rounded-full bg-primary/12 shadow-card-soft">
					<SvgIcon name="my_lock" size="1.5rem" class="text-primary-600" />
				</span>
				<span class="text-[16px] font-semibold leading-tight tracking-tight text-gray-900">
					{{ $t('company_metrics.locked_title', { symbol: bigSymbol }) }}
				</span>
				<span class="text-xs leading-snug text-gray-500">{{ $t('company_metrics.locked_desc') }}</span>
				<span
					class="mt-2.5 inline-flex items-center rounded-full bg-primary px-4 py-2 text-[13px] font-semibold leading-none text-on-primary shadow-[0_6px_16px_-6px_var(--color-primary)] transition-transform duration-200 group-hover:-translate-y-px motion-reduce:transition-none"
				>
					{{ $t('company_metrics.login_to_see_data') }}
				</span>
			</span>
		</button>

		<template v-else>
			<SectionHeader
				:title="$t('company_metrics.section_metrics')"
				:subtitle="metrics.length ? $t('company_metrics.section_metrics_sub', { n: metrics.length }) : undefined"
			/>

			<!-- 載入失敗：點一下重試（錯誤訊息本身由 fetch handler 負責） -->
			<button
				v-if="status === 'error'"
				type="button"
				class="mb-6 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-gray-400 outline-hidden transition duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				@click="getMetrics(symbol)"
			>
				<SvgIcon name="icon_ghost" size="2rem" class="text-gray-300" />
				<span class="text-sm">{{ $t('company_metrics.load_failed') }}</span>
			</button>

			<template v-else-if="metrics.length">
				<!-- 關鍵指標：最新數值 + 迷你走勢 -->
				<div class="mb-6 grid grid-cols-2 gap-3">
					<CompanyMetricsStatTile
						v-for="(tile, i) in tiles"
						:key="tile.label"
						:label="tile.label"
						:value="tile.value"
						:color="tile.color"
						:points="tile.points"
						:style="{ animationDelay: `${i * 50}ms` }"
					/>
				</div>

				<SectionHeader :title="$t('company_metrics.section_trends')" />
				<div class="space-y-3">
					<CompanyMetricsCard
						:title="$t('company_metrics.pe_card_title')"
						:info="$t('company_metrics.pe_forwards_notice')"
						:legend="peLegend"
						style="animation-delay: 0ms"
					>
						<LazyMultiLineChart
							:chart-data="metrics"
							x-axis-key="ct"
							:series="peSeries"
							:value-formatter="(v: number) => v.toFixed(2)"
							:axis-formatter="trimZeros"
						/>
					</CompanyMetricsCard>

					<!-- 前瞻與歷史 EPS 差約兩倍，共用一條軸線會壓扁，所以左右各一條軸、文字跟著系列上色。
						EPS 是一階一階跳的，不平滑才不會在轉折處過衝 -->
					<CompanyMetricsCard
						:title="$t('company_metrics.eps_comparison')"
						:info="$t('company_metrics.eps_notice')"
						:legend="epsLegend"
						style="animation-delay: 60ms"
					>
						<LazyMultiLineChart
							:chart-data="metrics"
							x-axis-key="ct"
							:series="epsSeries"
							:smooth="false"
							:value-formatter="(v: number) => `$${v.toFixed(2)}`"
							:axis-formatter="(v: number) => v.toFixed(2)"
						/>
					</CompanyMetricsCard>

					<CompanyMetricsCard
						:title="$t('company_metrics.volume_title')"
						:legend="volumeLegend"
						style="animation-delay: 120ms"
					>
						<LazyBarChart
							:chart-data="metrics"
							x-axis-key="ct"
							series-key="v"
							:series-name="$t('company_metrics.label_volume')"
							:colors="volumeColors"
							:axis-formatter="formatCompact"
						/>
					</CompanyMetricsCard>
				</div>
			</template>

			<!-- 載入中：骨架屏，版面跟載入後一致，內容出現時不會跳 -->
			<template v-else>
				<div class="mb-6 grid grid-cols-2 gap-3" aria-hidden="true">
					<div v-for="n in 6" :key="n" class="h-[7.25rem] animate-gray rounded-2xl" />
				</div>
				<SectionHeader :title="$t('company_metrics.section_trends')" />
				<div class="h-72 animate-gray rounded-2xl" aria-hidden="true" />
			</template>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from 'vue'
	import { useRoute } from 'vue-router'
	import { useUIStore } from '@/stores/ui'
	import { HOT_COMPANIES, HOT_COMPANY_LIST } from '@/constants/hotCompanies'
	import { NYSE, PREFIX_OVERRIDE } from '@/constants/symbolPrefix'
	import { useUserStore } from '@/stores/user'
	import { formatMoney, formatCompact } from '@/utils/util'
	import { toUpper as _toUpper, reverse as _reverse, get as _get } from 'lodash-es'
	import type { StockMetrics } from '@/types/stockMetrics'
	import type { Company } from '@/types/api'

	const uiStore = useUIStore()
	const { open: openAuthModal } = useAuthModal()
	const route = useRoute()
	const userStore = useUserStore()
	const { $publicKV, $bffApi } = useNuxtApp()
	const { t } = useI18n()
	const palette = useChartPalette()

	const symbol = computed(() => {
		return route.params.symbol as string
	})

	const bigSymbol = computed(() => {
		return symbol.value?.toUpperCase()
	})

	// TradingView 的代號：全大寫，股別用點（API 給 BRK-B，TradingView 要 BRK.B）
	const tvSymbol = computed(() => symbol.value.toUpperCase().replace(/-/g, '.'))

	// TradingView 的 K 線要帶交易所前綴：特例 > NYSE 名單 > 其餘一律當 NASDAQ
	const symbolPrefix = computed(
		() => PREFIX_OVERRIDE[tvSymbol.value] ?? (NYSE.includes(tvSymbol.value) ? 'NYSE' : 'NASDAQ')
	)

	const metrics = ref<StockMetrics[]>([])
	const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

	// 熱門公司（探索熱門公司那幾家）免登入可看指標；其餘公司只開放 K 線，指標要登入
	const isHotCompany = computed(() => HOT_COMPANIES.includes(_toUpper(symbol.value)))
	const canViewMetrics = computed(() => isHotCompany.value || userStore.isLogin)

	const getMetrics = async (symbol: string, days: number = 60) => {
		if (!canViewMetrics.value) return
		status.value = 'loading'
		// 熱門公司直接打公開的 KV；其餘走 BFF，由 server 從 httpOnly cookie 帶 token 給 KV worker 驗證
		const client = isHotCompany.value ? $publicKV : $bffApi
		try {
			const response = await client.getStatementBySymbol(symbol, days)
			metrics.value = _reverse(_get(response, 'data', []))
			status.value = 'ready'
		} catch (error) {
			// 錯誤提示由 fetch handler 負責；token 過期的 401 會被當成登出，頁面自然退回鎖定卡
			status.value = 'error'
			console.error(`Failed to fetch ${symbol} metrics:`, error)
		}
	}

	onMounted(() => {
		getMetrics(symbol.value)
	})

	// 彈窗登入後頁面不會重新掛載，補抓非熱門股票的資料；登出則清掉已載入的指標
	watch(canViewMetrics, (canView) => {
		if (canView) getMetrics(symbol.value)
		else {
			metrics.value = []
			status.value = 'idle'
		}
	})

	// ---- 抬頭 ----
	// 公司名稱：熱門公司用自己的清單（顯示穩定、不用等網路），其餘從公司列表找。
	// 只在 client 抓，不拖慢 SSR；key 跟公司列表頁共用
	const { data: companies } = useAsyncData<Company[]>(
		'company-symbols',
		async () => (await $publicKV.getCompanySymbols()).data,
		{ server: false, lazy: true }
	)
	const companyName = computed(
		() =>
			HOT_COMPANY_LIST.find((c) => c.id === symbol.value.toLowerCase())?.name ??
			companies.value?.find((c) => c.symbol.toUpperCase() === bigSymbol.value)?.name ??
			''
	)

	const logoFailed = ref(false)
	watch(symbol, () => (logoFailed.value = false))

	const latest = computed(() => metrics.value.at(-1))
	const previous = computed(() => metrics.value.at(-2))
	const asOf = computed(() => latest.value?.ct.slice(0, 10) ?? '')

	// 單日漲跌幅 = 最新一筆收盤對前一筆
	const dayChange = computed(() => {
		const now = Number(latest.value?.pr)
		const prev = Number(previous.value?.pr)
		return prev ? ((now - prev) / prev) * 100 : null
	})
	const isUp = computed(() => (dayChange.value ?? 0) >= 0)

	// ---- 關鍵指標 ----
	const series = (key: keyof StockMetrics) => metrics.value.map((m) => Number(m[key]))

	// 前瞻類用主色、歷史類用次色，跟下面圖表的線色一致；市值與成交量沒有前瞻／歷史之分，用中性色
	const tiles = computed(() => {
		const m = latest.value
		if (!m) return []
		const p = palette.value
		return [
			{
				label: t('company_metrics.label_fpe'),
				value: Number(m.fpe).toFixed(2),
				color: p.primary,
				points: series('fpe'),
			},
			{
				label: t('company_metrics.label_pe'),
				value: Number(m.pe).toFixed(2),
				color: p.secondary,
				points: series('pe'),
			},
			{
				label: t('company_metrics.label_feps'),
				value: `$${Number(m.feps).toFixed(2)}`,
				color: p.primary,
				points: series('feps'),
			},
			{
				label: t('company_metrics.label_eps'),
				value: `$${Number(m.eps).toFixed(2)}`,
				color: p.secondary,
				points: series('eps'),
			},
			{
				label: t('company_metrics.label_cap'),
				value: `$${formatCompact(Number(m.cap))}`,
				color: p.muted,
				points: series('cap'),
			},
			{ label: t('company_metrics.label_volume'), value: formatCompact(m.v), color: p.muted, points: series('v') },
		]
	})

	// ---- 趨勢圖 ----
	const peSeries = computed(() => [
		{ name: t('company_metrics.label_fpe'), key: 'fpe' as const, color: palette.value.primary },
		{ name: t('company_metrics.label_pe'), key: 'pe' as const, color: palette.value.secondary },
	])
	const peLegend = computed(() => peSeries.value.map((s) => ({ label: s.name, color: s.color })))

	const epsSeries = computed(() => [
		{
			name: t('company_metrics.label_feps'),
			key: 'feps' as const,
			color: palette.value.primary,
			axis: 'left' as const,
		},
		{
			name: t('company_metrics.label_eps'),
			key: 'eps' as const,
			color: palette.value.secondary,
			axis: 'right' as const,
		},
	])
	const epsLegend = computed(() =>
		epsSeries.value.map((s) => ({
			label: `${s.name} · ${t(s.axis === 'left' ? 'company_metrics.axis_left' : 'company_metrics.axis_right')}`,
			color: s.color,
		}))
	)

	// 成交量長條依當日收盤對前一日上色（漲／跌），第一根沒有前一日，算漲
	const volumeColors = computed(() =>
		metrics.value.map((m, i) => {
			const prev = metrics.value[i - 1]
			return prev && Number(m.pr) < Number(prev.pr) ? palette.value.down : palette.value.up
		})
	)
	const volumeLegend = computed(() => [
		{ label: t('company_metrics.label_up_day'), color: palette.value.up },
		{ label: t('company_metrics.label_down_day'), color: palette.value.down },
	])

	// 座標軸刻度：最多兩位小數、去掉尾端 0（12.00 -> 12）
	const trimZeros = (v: number) => String(parseFloat(v.toFixed(2)))

	usePageSeo(
		computed(() => ({
			title: t('company_metrics.meta_title', { symbol: bigSymbol.value }),
			description: t('company_metrics.meta_description', { symbol: bigSymbol.value }),
		}))
	)
</script>
