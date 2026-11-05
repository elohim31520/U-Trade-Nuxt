<template>
	<div class="px-4 pb-6 pt-4">
		<header class="mb-5 px-1 motion-safe:animate-row-in">
			<h1 class="text-[26px] font-bold leading-tight tracking-tight text-gray-900">{{ $t('monte-sim.title') }}</h1>
			<p class="mt-1.5 text-[13px] leading-snug text-gray-500">{{ $t('monte-sim.subtitle') }}</p>
		</header>

		<!-- 參數：選股、初始股價、波動率。背景一團柔光讓白底不是一片平面 -->
		<section
			class="relative mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-surface-card p-4 shadow-card-soft motion-safe:animate-row-in"
			style="animation-delay: 60ms"
		>
			<span
				aria-hidden="true"
				class="pointer-events-none absolute -right-12 -top-14 size-48 rounded-full bg-primary/20 opacity-70 blur-3xl"
			/>

			<div class="relative">
				<!-- 選股：點開底部選單。文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
				<button
					type="button"
					class="group flex w-full items-center gap-3.5 rounded-2xl border border-gray-100 bg-gray-50 py-2.5 pl-2.5 pr-3.5 text-left outline-hidden transition duration-200 [-webkit-tap-highlight-color:transparent] hover:border-gray-200 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
					:aria-label="$t('monte-sim.selectStock')"
					aria-haspopup="dialog"
					@click="pickerOpen = true"
				>
					<template v-if="selectedStock">
						<StockLogoTile :symbol="selectedStock.symbol!" :name="selectedStock.name" class="size-11" />
						<span class="min-w-0 flex-1">
							<span class="block truncate text-[15px] font-medium leading-tight text-gray-900">
								{{ selectedStock.name }}
							</span>
							<span class="mt-1.5 flex items-center gap-1.5 text-xs leading-none text-gray-400">
								<span class="font-semibold uppercase tracking-wider">{{ selectedStock.symbol }}</span>
								<span class="size-[3px] rounded-full bg-gray-300" aria-hidden="true" />
								<span class="tabular-nums">${{ formatMoney(Number(selectedStock.price)) }}</span>
							</span>
						</span>
					</template>

					<!-- 股票清單還沒回來：骨架 -->
					<template v-else>
						<span class="size-11 shrink-0 animate-gray rounded-[22%]" />
						<span class="min-w-0 flex-1">
							<span class="block h-3.5 w-28 animate-gray rounded-md" />
							<span class="mt-2 block h-3 w-20 animate-gray rounded-md" />
						</span>
					</template>

					<SvgIcon
						name="icon_chevron_right"
						size="1rem"
						class="shrink-0 rotate-90 text-gray-400 transition-transform duration-200 group-hover:translate-y-px motion-reduce:transition-none"
					/>
				</button>

				<!-- 初始股價 -->
				<label
					class="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 motion-reduce:transition-none"
				>
					<span class="shrink-0 whitespace-nowrap text-[13px] font-medium text-gray-500">
						{{ $t('monte-sim.initialPrice') }}
					</span>
					<span class="flex min-w-0 items-center gap-1 text-[17px] font-semibold tabular-nums text-gray-900">
						<span class="text-gray-400">$</span>
						<!-- 輸入框寬度跟著內容走（隱形的 span 撐開同一格），這樣 $ 才會貼著數字，不用 field-sizing（Safari 支援度不夠） -->
						<span class="inline-grid min-w-[3ch]">
							<span aria-hidden="true" class="invisible col-start-1 row-start-1 whitespace-pre">
								{{ params.s0 === '' ? '0' : params.s0 }}
							</span>
							<input
								v-model.number="params.s0"
								type="number"
								inputmode="decimal"
								min="0"
								step="any"
								class="col-start-1 row-start-1 w-0 min-w-full appearance-none bg-transparent text-right outline-hidden [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								@change="runSimulation"
							/>
						</span>
					</span>
				</label>

				<!-- 波動率 -->
				<div class="mt-5 px-1">
					<div class="flex items-center justify-between gap-3">
						<span class="text-[13px] font-medium text-gray-500">{{ $t('monte-sim.volatility') }}</span>
						<span
							class="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-semibold leading-none tabular-nums text-primary-600"
						>
							{{ (params.sigma * 100).toFixed(0) }}%
						</span>
					</div>

					<div class="px-2.5 pb-1 pt-4">
						<van-slider
							v-model="params.sigma"
							:min="0.01"
							:max="1"
							:step="0.01"
							bar-height="6px"
							active-color="var(--color-primary)"
							@change="runSimulation"
						>
							<template #button>
								<span
									class="block size-[22px] rounded-full border-[3px] border-primary bg-surface-card shadow-[0_2px_6px_rgb(16_24_40/0.22)]"
								/>
							</template>
						</van-slider>
					</div>

					<div class="flex justify-between text-[11px] leading-none text-gray-400">
						<span>{{ $t('monte-sim.volatilityLow') }}</span>
						<span>{{ $t('monte-sim.volatilityHigh') }}</span>
					</div>
				</div>

				<!-- 送出：計算中顯示轉圈，不用 disabled 樣式閃一下 -->
				<button
					type="button"
					:disabled="isCalculating || !canRun"
					class="relative mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary shadow-[0_8px_20px_-8px_var(--color-primary)] outline-hidden transition duration-200 [-webkit-tap-highlight-color:transparent] hover:-translate-y-px active:translate-y-0 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card disabled:cursor-wait disabled:hover:translate-y-0 motion-reduce:transition-none"
					:class="{ 'opacity-50': !canRun }"
					@click="runSimulation"
				>
					<span class="inline-flex items-center gap-2 text-[15px] font-semibold tracking-wide text-on-primary">
						<SvgIcon
							:name="isCalculating ? 'icon_spinner' : 'icon_trend_up'"
							size="1.125rem"
							:class="{ 'animate-spin': isCalculating }"
						/>
						{{ isCalculating ? $t('monte-sim.calculating') : $t('monte-sim.runSimulation') }}
					</span>
				</button>
			</div>
		</section>

		<!-- 模擬結果：預期最終價 + 預期報酬、獲利／虧損機率分布條 -->
		<SectionHeader
			:title="$t('monte-sim.sectionResult')"
			:subtitle="snapshot ? $t('monte-sim.resultSub', { times: snapshot.nSims.toLocaleString('en-US') }) : undefined"
		/>

		<section
			v-if="summary"
			class="relative mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-surface-card p-4 shadow-card-soft motion-safe:animate-row-in"
			style="animation-delay: 120ms"
		>
			<span
				aria-hidden="true"
				class="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full opacity-70 blur-3xl transition-colors duration-700 motion-reduce:transition-none"
				:class="summary.isUp ? 'bg-emerald-500/20' : 'bg-red-500/20'"
			/>

			<div class="relative flex items-end justify-between gap-3">
				<div class="min-w-0">
					<div class="text-xs font-medium text-gray-500">{{ $t('monte-sim.meanFinalPrice') }}</div>
					<div class="mt-2 text-[34px] font-bold leading-none tracking-tight tabular-nums text-gray-900">
						${{ formatMoney(summary.mean) }}
					</div>
				</div>

				<div class="shrink-0 text-right">
					<div class="text-[11px] leading-none text-gray-400">{{ $t('monte-sim.expectedReturn') }}</div>
					<span
						class="mt-1.5 inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[15px] font-semibold tabular-nums"
						:class="summary.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
						:aria-label="`${summary.isUp ? '+' : '-'}${Math.abs(summary.ret).toFixed(2)}%`"
					>
						<SvgIcon name="icon_triangle" size="8px" :class="{ 'rotate-180': !summary.isUp }" />
						{{ Math.abs(summary.ret).toFixed(2) }}%
					</span>
				</div>
			</div>

			<div class="relative mt-4 border-t border-gray-100 pt-4">
				<div class="flex items-end justify-between gap-3">
					<div>
						<div class="text-xs font-medium text-gray-500">{{ $t('monte-sim.profitProbability') }}</div>
						<div class="mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums text-emerald-600">
							{{ summary.win.toFixed(2) }}%
						</div>
					</div>
					<div class="text-right">
						<div class="text-xs font-medium text-gray-500">{{ $t('monte-sim.lossProbability') }}</div>
						<div class="mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums text-red-500">
							{{ summary.lose.toFixed(2) }}%
						</div>
					</div>
				</div>

				<div class="mt-3.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
					<span
						v-if="summary.win > 0"
						class="rounded-full bg-emerald-500/80 transition-[width] duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
						:style="{ width: `${summary.win}%` }"
					/>
					<span
						v-if="summary.lose > 0"
						class="rounded-full bg-red-500/80 transition-[width] duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
						:style="{ width: `${summary.lose}%` }"
					/>
				</div>

				<!-- 警語直接貼在機率下方、不收合：這個數字最容易被誤讀成「實際會賺的機率」 -->
				<p class="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-gray-500">
					<SvgIcon name="icon_info" size="0.875rem" class="mt-px shrink-0" />
					<span>{{ $t('monte-sim.probabilityWarning') }}</span>
				</p>
			</div>
		</section>
		<div v-else class="mb-6 h-[208px] animate-gray rounded-2xl" />

		<!-- 路徑圖：卡片外觀沿用公司指標頁；圖例顏色跟圖上的線一致 -->
		<CompanyMetricsCard
			:title="$t('monte-sim.chartTitle')"
			:subtitle="$t('monte-sim.chartSub', { n: pathCount })"
			:info="
				$t('monte-sim.chartInfo', {
					n: pathCount,
					times: (snapshot?.nSims ?? params.n_simulations).toLocaleString('en-US'),
				})
			"
			:legend="legend"
			style="animation-delay: 180ms"
		>
			<ClientOnly>
				<div class="h-[300px] w-full">
					<v-chart v-if="chartOption" class="size-full" :option="chartOption" autoresize />
					<div v-else class="mx-2 h-full animate-gray rounded-xl" />
				</div>
				<template #fallback>
					<div class="mx-2 h-[300px] animate-gray rounded-xl" />
				</template>
			</ClientOnly>
		</CompanyMetricsCard>

		<p class="mt-4 px-2 text-center text-[11px] leading-relaxed text-gray-400">
			{{ $t('monte-sim.disclaimer', { mu: Math.round(params.mu * 100) }) }}
		</p>

		<!-- 選股底部選單 -->
		<van-popup
			v-model:show="pickerOpen"
			position="bottom"
			round
			safe-area-inset-bottom
			class="inset-x-0! mx-auto max-w-480px bg-surface-card! [--van-popup-round-radius:1.75rem]"
			@opened="scrollToSelected"
			@closed="keyword = ''"
		>
			<div class="relative px-5 pb-3 pt-3">
				<span aria-hidden="true" class="relative mx-auto mb-4 block h-1 w-9 rounded-full bg-gray-200" />

				<header class="relative flex items-center justify-between gap-3">
					<h2 class="text-xl font-semibold leading-tight text-gray-900">{{ $t('monte-sim.selectStock') }}</h2>
					<button
						type="button"
						:aria-label="$t('common.close')"
						class="grid size-8 shrink-0 place-items-center rounded-full bg-gray-100 transition active:scale-90"
						@click="pickerOpen = false"
					>
						<SvgIcon name="icon_close" size="12px" class="text-gray-500" />
					</button>
				</header>

				<label
					class="mt-4 flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 transition duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 motion-reduce:transition-none"
				>
					<SvgIcon name="icon_search" size="1rem" class="shrink-0 text-gray-400" />
					<!-- 字級 16px：iOS Safari 小於 16px 的輸入框一聚焦就會被放大 -->
					<input
						v-model="keyword"
						type="search"
						enterkeyhint="search"
						autocomplete="off"
						:placeholder="$t('monte-sim.searchPlaceholder')"
						class="min-w-0 flex-1 bg-transparent text-[16px] text-gray-900 outline-hidden placeholder:text-gray-400"
					/>
				</label>
			</div>

			<ul v-if="filteredStocks.length" ref="listEl" class="max-h-[50vh] overflow-y-auto overscroll-contain px-3 pb-4">
				<li v-for="stock in filteredStocks" :key="stock.symbol!">
					<button
						type="button"
						class="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left outline-hidden transition duration-150 [-webkit-tap-highlight-color:transparent] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
						:class="stock.symbol === selectedSymbol ? 'bg-primary/10' : 'hover:bg-gray-50'"
						:aria-pressed="stock.symbol === selectedSymbol"
						@click="pickStock(stock.symbol!)"
					>
						<StockLogoTile :symbol="stock.symbol!" :name="stock.name" class="size-10" />
						<span class="min-w-0 flex-1">
							<span class="block truncate text-[14px] font-medium leading-tight text-gray-900">
								{{ stock.name }}
							</span>
							<span class="mt-1 flex items-center gap-1.5 text-xs leading-none text-gray-400">
								<span class="font-semibold uppercase tracking-wider">{{ stock.symbol }}</span>
								<span class="size-[3px] rounded-full bg-gray-300" aria-hidden="true" />
								<span class="tabular-nums">${{ formatMoney(Number(stock.price)) }}</span>
							</span>
						</span>
						<SvgIcon
							v-if="stock.symbol === selectedSymbol"
							name="icon_check"
							size="1.125rem"
							class="shrink-0 text-primary-600"
						/>
					</button>
				</li>
			</ul>

			<div v-else class="flex flex-col items-center gap-3 px-5 pb-10 pt-6 text-gray-400">
				<SvgIcon name="icon_ghost" size="2.5rem" class="text-gray-300" />
				<p class="text-sm">{{ $t('monte-sim.noMatch') }}</p>
			</div>
		</van-popup>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
	import type { EChartsOption } from 'echarts'
	import type { TodayStockPrice } from '~/types/stock'
	import type { SimulationParams, SimulationResult } from '~/workers/simulation.worker'

	/** 跑這一輪模擬當下的參數。結果要拿這份對照，不然使用者改了輸入框，基準線與報酬率會跟著錯位 */
	interface RunSnapshot {
		s0: number
		t: number
		nSteps: number
		nSims: number
	}

	const { $publicKV } = useNuxtApp()
	const { t } = useI18n()
	const palette = useChartPalette()

	const isCalculating = ref(false)
	const simResult = shallowRef<SimulationResult | null>(null)
	const snapshot = shallowRef<RunSnapshot | null>(null)

	const stocks = ref<TodayStockPrice[]>([])
	const selectedSymbol = ref('')
	const pickerOpen = ref(false)
	const keyword = ref('')

	const params = ref<SimulationParams>({
		s0: 100,
		mu: 0.1,
		sigma: 0.25,
		t: 1,
		n_steps: 252,
		n_simulations: 10000,
	})

	let worker: Worker | null = null
	// 模擬進行中又有人拉滑桿／按按鈕：記下來，這一輪結束後馬上用最新參數再跑一次，而不是直接吞掉
	let rerunQueued = false

	const canRun = computed(() => Number(params.value.s0) > 0)

	// ---- 股票清單 ----
	// 沒有 symbol 的資料既沒有 logo 也無法選取，直接略過
	// 來源的順序是亂的，選單裡依名稱字母排序才找得到
	const selectableStocks = computed(() =>
		stocks.value.filter((s) => s.symbol).sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
	)
	const selectedStock = computed(() => selectableStocks.value.find((s) => s.symbol === selectedSymbol.value))

	const filteredStocks = computed(() => {
		const q = keyword.value.trim().toLowerCase()
		if (!q) return selectableStocks.value
		return selectableStocks.value.filter((s) => s.name.toLowerCase().includes(q) || s.symbol!.toLowerCase().includes(q))
	})

	// 選單滑入完成後，把目前選的那檔捲到中間，清單很長，不然每次都要從頭找
	const listEl = ref<HTMLElement | null>(null)
	const scrollToSelected = () => {
		const list = listEl.value
		const item = list?.querySelector<HTMLElement>('[aria-pressed="true"]')
		if (!list || !item) return
		const offset = item.getBoundingClientRect().top - list.getBoundingClientRect().top
		list.scrollTop += offset - (list.clientHeight - item.clientHeight) / 2
	}

	const pickStock = (symbol: string) => {
		pickerOpen.value = false
		selectStock(symbol)
	}

	const selectStock = (symbol: string) => {
		const stock = selectableStocks.value.find((s) => s.symbol === symbol)
		const price = Number(stock?.price)
		if (!stock || !(price > 0)) return
		selectedSymbol.value = symbol
		params.value.s0 = price
		runSimulation()
	}

	// ---- 模擬 ----
	let pendingSnapshot: RunSnapshot | null = null

	const runSimulation = () => {
		if (!worker || !canRun.value) return
		if (isCalculating.value) {
			rerunQueued = true
			return
		}
		isCalculating.value = true
		const p = params.value
		pendingSnapshot = { s0: Number(p.s0), t: p.t, nSteps: p.n_steps, nSims: p.n_simulations }
		worker.postMessage(JSON.parse(JSON.stringify({ ...p, s0: Number(p.s0) })))
	}

	onMounted(async () => {
		// 確保只在客戶端初始化 Worker
		worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), { type: 'module' })

		worker.onmessage = (e: MessageEvent<SimulationResult>) => {
			simResult.value = e.data
			snapshot.value = pendingSnapshot
			isCalculating.value = false

			if (rerunQueued) {
				rerunQueued = false
				runSimulation()
			}
		}

		try {
			const res = await $publicKV.getTodayStocks()
			stocks.value = res.data
			const first = selectableStocks.value.find((s) => s.symbol === 'TSLA') ?? selectableStocks.value[0]
			if (first) selectStock(first.symbol!)
		} catch {
			// 錯誤訊息由 publicKv plugin 負責顯示；股價清單抓不到時，仍用預設的初始股價跑一次，圖表不致空白
		}
		if (!simResult.value && !isCalculating.value) runSimulation()
	})

	onUnmounted(() => {
		worker?.terminate()
	})

	// ---- 結果摘要 ----
	const summary = computed(() => {
		const r = simResult.value
		const s = snapshot.value
		if (!r || !s) return null
		const ret = (r.meanFinalPrice / s.s0 - 1) * 100
		const win = r.profitProbability * 100
		return { mean: r.meanFinalPrice, ret, isUp: ret >= 0, win, lose: 100 - win }
	})

	// ---- 圖表 ----
	const pathCount = computed(() => simResult.value?.samplePaths.length ?? 50)

	const legend = computed(() => [
		{ label: t('monte-sim.legendUp'), color: palette.value.up },
		{ label: t('monte-sim.legendDown'), color: palette.value.down },
		{ label: t('monte-sim.legendMedian'), color: palette.value.tooltipText },
		{ label: t('monte-sim.legendBase'), color: palette.value.muted },
	])

	/** 每個時間點上，抽樣路徑的最高／中位數／最低。tooltip 與中位數路徑共用，只在結果更新時算一次 */
	const pathStats = computed(() => {
		const r = simResult.value
		if (!r || !r.samplePaths.length) return null
		const len = r.samplePaths[0]!.length
		const high: number[] = []
		const median: number[] = []
		const low: number[] = []
		for (let i = 0; i < len; i++) {
			const col = r.samplePaths.map((path) => path[i]!).sort((a, b) => a - b)
			low.push(col[0]!)
			high.push(col[col.length - 1]!)
			median.push((col[(col.length - 1) >> 1]! + col[col.length >> 1]!) / 2)
		}
		return { high, median, low }
	})

	/** 價格座標軸刻度：高價股不需要小數，低價股才需要 */
	const formatAxisPrice = (v: number) => `$${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)}`

	const chartOption = computed<EChartsOption | null>(() => {
		const r = simResult.value
		const s = snapshot.value
		const stats = pathStats.value
		if (!r || !s || !stats) return null

		const p = palette.value
		const last = s.nSteps
		const stepsPerLabel = Math.max(1, Math.round(s.nSteps / 4))

		// 第幾個交易日 -> 座標軸文字（現在、3個月、6個月、…、1年）
		const dayLabel = (step: number) => {
			const months = Math.round((step / s.nSteps) * s.t * 12)
			if (months === 0) return t('monte-sim.axisNow')
			if (months % 12 === 0) return t('monte-sim.axisYears', { n: months / 12 })
			return t('monte-sim.axisMonths', { n: months })
		}

		// 一年後高於起始價畫漲色、低於畫跌色；半透明疊起來，密集的地方自然變深，看得出分布
		const pathSeries = r.samplePaths.map((path) => ({
			type: 'line' as const,
			data: path,
			showSymbol: false,
			lineStyle: { width: 1.1, opacity: 0.3, color: path[path.length - 1]! >= s.s0 ? p.up : p.down },
			emphasis: { disabled: true },
			z: 2,
		}))

		return {
			animationDuration: 700,
			animationDurationUpdate: 500,
			// ECharts 6 的 containLabel 要另外註冊 feature，改用 outerBounds：座標軸文字也算在 grid 範圍內
			grid: { top: 14, left: 6, right: 14, bottom: 2, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
			tooltip: {
				...chartTooltip(p),
				trigger: 'axis',
				axisPointer: { type: 'line', lineStyle: { color: p.muted, width: 1, type: 'dashed' } },
				// 預設的 axis tooltip 會一次列出 50 條線；改成這個時間點的最高／中位數／最低
				formatter: (params: any) => {
					const i = (Array.isArray(params) ? params[0] : params)?.dataIndex ?? 0
					const title = i === 0 ? t('monte-sim.axisNow') : t('monte-sim.tipDay', { n: i })
					const price = (v: number | undefined) => `$${formatMoney(v ?? 0)}`
					return (
						`<div style="font-size:11px;opacity:.6">${title}</div>` +
						tooltipRow(p.up, t('monte-sim.tipHigh'), price(stats.high[i])) +
						tooltipRow(p.tooltipText, t('monte-sim.tipMedian'), price(stats.median[i])) +
						tooltipRow(p.down, t('monte-sim.tipLow'), price(stats.low[i]))
					)
				},
			},
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: Array.from({ length: s.nSteps + 1 }, (_, i) => i),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: p.muted,
					fontSize: 11,
					margin: 10,
					interval: stepsPerLabel - 1,
					alignMinLabel: 'left',
					alignMaxLabel: 'right',
					formatter: (value: string) => dayLabel(Number(value)),
				},
			},
			yAxis: {
				type: 'value',
				scale: true,
				splitNumber: 4,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: p.muted, fontSize: 11, formatter: formatAxisPrice },
				splitLine: { lineStyle: { color: p.grid, type: 'dashed' } },
			},
			series: [
				...pathSeries,
				// 中位數路徑：整團半透明線裡唯一的實線，眼睛有個落點；終點加一顆圓點
				{
					type: 'line',
					data: stats.median,
					smooth: 0.2,
					showSymbol: true,
					symbol: 'circle',
					symbolSize: (_v: unknown, point: { dataIndex: number }) => (point.dataIndex === last ? 8 : 0),
					lineStyle: { width: 2.25, color: p.tooltipText },
					itemStyle: { color: p.tooltipText, borderColor: p.tooltipBg, borderWidth: 2 },
					emphasis: { disabled: true },
					z: 5,
					// 起始價基準線
					markLine: {
						silent: true,
						symbol: 'none',
						label: { show: false },
						lineStyle: { color: p.muted, width: 1.25, type: 'dashed' },
						data: [{ yAxis: s.s0 }],
					},
				},
			],
		}
	})

	usePageSeo(
		computed(() => ({
			title: t('monte-sim.meta_title'),
			description: t('monte-sim.meta_description'),
		}))
	)
</script>
