<template>
	<section>
		<SectionHeader :title="$t('momentum_chart.title', { days: selectedDays })" />

		<div class="rounded-2xl border border-gray-100 bg-surface-card p-4 shadow-card-primary">
			<!-- 分段切換：滑動的底板跟著 active 項目走（與 VolatileAsset 同一套） -->
			<div role="tablist" class="relative grid grid-cols-4 rounded-xl border border-gray-100 bg-gray-50 p-1">
				<span
					aria-hidden="true"
					class="seg-thumb absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-lg border border-primary/25 bg-primary/10"
					:style="{ transform: `translateX(${activeIndex * 100}%)` }"
				/>

				<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
				<button
					v-for="day in timeRanges"
					:key="day"
					type="button"
					role="tab"
					:aria-selected="selectedDays === day"
					class="seg-tab relative z-1 rounded-lg py-2"
					@click="refreshData(day)"
				>
					<span
						class="seg-label text-sm font-medium tabular-nums tracking-wide"
						:class="selectedDays === day ? 'text-primary-600' : 'text-gray-400'"
					>
						{{ $t('momentum_chart.days_unit', { count: day }) }}
					</span>
				</button>
			</div>

			<ClientOnly>
				<div class="mt-4 h-[300px]">
					<v-chart class="size-full" :option="option" autoresize />
				</div>
				<template #fallback>
					<div class="mt-4 h-[300px] animate-gray rounded-xl" />
				</template>
			</ClientOnly>

			<p class="mt-3 flex gap-2 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
				<SvgIcon name="icon_info" size="12px" class="mt-[3px] shrink-0 text-gray-400" />
				<span>{{ $t('momentum_chart.tips') }}</span>
			</p>
		</div>
	</section>
</template>

<script lang="ts" setup>
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { EChartsOption } from 'echarts'
	import { useUserStore } from '@/stores/user'
	import type { ThemeName } from '~/composables/useTheme'

	const { t } = useI18n()
	const chartColor = useChartColor()
	const { themeName } = useTheme()
	const { open: openAuthModal } = useAuthModal()
	const userStore = useUserStore()
	const { $publicKV, $bffApi } = useNuxtApp()

	const timeRanges = [1, 3, 7, 30]
	const selectedDays = ref<number>(1)
	const activeIndex = computed(() => timeRanges.indexOf(selectedDays.value))

	interface chartData {
		ct: string
		v: number
	}
	const momentumData = ref<chartData[]>([])

	const DELAY_CONFIG: Record<number, number> = {
		1: 50,
		3: 0,
		7: 0,
		30: 0,
	}

	/**
	 * 軸字、基準線與 tooltip 文字色。canvas 吃不到 CSS 變數，依主題名稱查表；
	 * 數值對應 gray-400 / gray-800 / line（arctic-cyan 為 --c-text-dim / --c-text / --c-line-hi）。
	 */
	const PALETTE: Record<ThemeName, { label: string; text: string; baseline: string }> = {
		default: { label: '#9ca3af', text: '#1f2937', baseline: '#d1d5db' },
		'arctic-cyan': { label: 'rgba(237, 249, 251, 0.45)', text: '#edf9fb', baseline: 'rgba(106, 210, 224, 0.26)' },
	}

	/** 各區間 x 軸標籤的間隔（小時）：1 日每 6 小時一個，之後以日期為主，避免擠在一起 */
	const LABEL_STEP_HOURS: Record<number, number> = { 1: 6, 3: 24, 7: 48, 30: 120 }

	const pad = (n: number) => String(n).padStart(2, '0')

	// ct 是 'YYYY-MM-DD HH'（小時資料）或 'YYYY-MM-DD'（日資料）
	const parseCt = (ct: string) => {
		const [date = '', hour] = ct.split(' ')
		const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
		return { y, m, d, hour: hour === undefined ? null : Number(hour) }
	}

	const toHours = (ct: string) => {
		const { y, m, d, hour } = parseCt(ct)
		return Date.UTC(y, m - 1, d, hour ?? 0) / 3_600_000
	}

	// 整點顯示 HH:00，跨日的 00 點改顯示 MM/DD
	const formatAxisLabel = (ct: string) => {
		const { m, d, hour } = parseCt(ct)
		return hour === null || hour === 0 ? `${pad(m)}/${pad(d)}` : `${pad(hour)}:00`
	}

	const option = computed<EChartsOption>(() => {
		const dates = momentumData.value.map((item) => item.ct)
		const color = chartColor.value
		const palette = PALETTE[themeName.value]
		const baseDelay = DELAY_CONFIG[selectedDays.value] || 0
		const stepHours = LABEL_STEP_HOURS[selectedDays.value] ?? 24

		// 色柱由「遠離 0 軸的柱頭」往 0 軸淡出，所以負值柱的漸層要上下反過來
		const fade = `${color}33`
		const barStyle = (v: number) => ({
			color: {
				type: 'linear' as const,
				x: 0,
				y: 0,
				x2: 0,
				y2: 1,
				colorStops:
					v >= 0
						? [
								{ offset: 0, color },
								{ offset: 1, color: fade },
							]
						: [
								{ offset: 0, color: fade },
								{ offset: 1, color },
							],
			},
			borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
		})

		return {
			tooltip: {
				trigger: 'axis',
				confine: true,
				padding: [8, 12],
				textStyle: { color: palette.text, fontSize: 12 },
				extraCssText: 'border-radius: 12px; box-shadow: 0 8px 24px rgba(16, 24, 40, 0.14);',
				axisPointer: {
					type: 'shadow',
					shadowStyle: { color: color, opacity: 0.08 },
				},
				formatter: (raw: unknown) => {
					const [point] = raw as { dataIndex: number; value: number }[]
					if (!point) return ''
					const ct = dates[point.dataIndex] ?? ''
					const label = parseCt(ct).hour === null ? ct : `${ct}:00`
					const value = `${point.value > 0 ? '+' : ''}${Number(point.value).toFixed(2)}%`
					return (
						`<div style="font-size:11px;opacity:.55;margin-bottom:4px">${label}</div>` +
						`<div style="display:flex;align-items:center;gap:6px">` +
						`<span style="width:8px;height:8px;border-radius:50%;background:${color}"></span>` +
						`<span style="font-size:15px;font-weight:600;font-variant-numeric:tabular-nums">${value}</span>` +
						`</div>`
					)
				},
			},
			grid: {
				top: 12,
				left: 0,
				right: 4,
				bottom: 0,
				containLabel: true,
			},
			xAxis: {
				type: 'category',
				data: dates,
				// 基準線交給 markLine 畫，軸線與刻度都不要
				// onZero: false：負值柱會長到 0 軸下方，標籤改貼在圖底，不要壓在柱子上
				axisLine: { show: false, onZero: false },
				axisTick: { show: false },
				axisLabel: {
					color: palette.label,
					fontSize: 11,
					margin: 12,
					interval: (_index: number, value: string) => toHours(value) % stepHours === 0,
					formatter: formatAxisLabel,
				},
			},
			yAxis: {
				type: 'value',
				splitNumber: 4,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: palette.label,
					fontSize: 11,
					formatter: (value: number) => `${value}%`,
				},
				splitLine: { lineStyle: { type: 'dashed' } },
			},
			series: [
				{
					type: 'bar',
					data: momentumData.value.map((item) => ({ value: item.v, itemStyle: barStyle(item.v) })),
					barMaxWidth: 14,
					barCategoryGap: '35%',
					markLine: {
						silent: true,
						symbol: 'none',
						label: { show: false },
						lineStyle: { color: palette.baseline, width: 1, type: 'solid' },
						data: [{ yAxis: 0 }],
						animation: false,
					},
					animationDelay: (idx: number) => idx * baseDelay,
					animationDelayUpdate: (idx: number) => idx * baseDelay,
				},
			],
			animation: true,
			animationDuration: 1000,
			animationEasing: 'cubicOut',
		}
	})

	const BFF_DAYS = new Set([7, 30])

	const fetchData = async (days: number): Promise<chartData[]> => {
		try {
			const res = BFF_DAYS.has(days) ? await $bffApi.getMomentumByRange(days) : await $publicKV.getMomentumByRange(days)
			return res.data
		} catch (error) {
			console.error(`Failed to fetch ${days}-day momentum data:`, error)
			return []
		}
	}

	const refreshData = async (days: number): Promise<void> => {
		// 1. 權限檢查：如果沒登入 且 選的是 7 或 30 天
		if (!userStore.isLogin && ![1, 3].includes(days)) {
			openAuthModal('login')
			return
		}

		// 2. 通過檢查後，才更新 UI 狀態
		selectedDays.value = days

		// 3. 抓取資料並「確實賦值」
		const data = await fetchData(days)
		momentumData.value = data
	}

	const { data: fetchedData } = await useAsyncData(
		'market-momentum-data',
		() => fetchData(1), // 初始預設抓 1 天，這是不需要登入的
		{
			lazy: true,
		}
	)

	watch(
		fetchedData,
		(newData) => {
			if (newData) momentumData.value = newData
		},
		{ immediate: true }
	)
</script>

<style scoped>
	/* 分段切換底板 */
	.seg-thumb {
		transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.seg-tab {
		-webkit-tap-highlight-color: transparent;
	}

	.seg-label {
		transition: color 0.3s;
	}

	@media (prefers-reduced-motion: reduce) {
		.seg-thumb,
		.seg-label {
			transition: none;
		}
	}
</style>
