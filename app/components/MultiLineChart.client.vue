<template>
	<div class="w-full" :style="{ height: height || '240px' }">
		<v-chart v-if="chartData.length" style="width: 100%; height: 100%" :option="option" autoresize />
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { EChartsOption, LineSeriesOption } from 'echarts'
	import type { StockMetrics } from '~/types/stockMetrics'

	interface Series {
		name: string
		key: keyof StockMetrics
		color?: string
		/** 掛在哪一側的 Y 軸；只要有任何一條選 right 就會變雙軸，兩側座標軸文字會上對應系列的顏色 */
		axis?: 'left' | 'right'
	}

	// 標題與圖例由外層卡片用 HTML 畫（跟頁面其他文字一起排版），圖裡只留線與座標軸
	const props = withDefaults(
		defineProps<{
			chartData: StockMetrics[]
			height?: string
			smooth?: boolean | number
			/** 線下方鋪漸層面積 */
			area?: boolean
			xAxisKey: keyof StockMetrics
			series: Series[]
			/** tooltip 的數值格式 */
			valueFormatter?: (value: number) => string
			/** Y 軸刻度的數值格式；刻度通常不需要跟 tooltip 一樣精確 */
			axisFormatter?: (value: number) => string
		}>(),
		{
			smooth: 0.25,
			area: true,
			valueFormatter: (value: number) => value.toFixed(2),
			axisFormatter: (value: number) => String(parseFloat(value.toFixed(2))),
		}
	)

	const palette = useChartPalette()
	const primary = useChartColor()

	// X 軸固定只留 4～5 個日期，不然手機寬度會擠成一團
	const labelStep = computed(() => Math.max(1, Math.ceil(props.chartData.length / 4)))

	const isDual = computed(() => props.series.some((s) => s.axis === 'right'))

	const axisBase = computed(() => ({
		type: 'value' as const,
		scale: true,
		splitNumber: 3,
		axisLine: { show: false },
		axisTick: { show: false },
	}))

	const option = computed<EChartsOption>(() => {
		const p = palette.value
		const last = props.chartData.length - 1
		const colorOf = (s: Series) => s.color || primary.value
		const sideColor = (side: 'left' | 'right') => {
			const s = props.series.find((item) => (item.axis ?? 'left') === side)
			return s ? colorOf(s) : p.muted
		}

		const series: LineSeriesOption[] = props.series.map((s) => {
			const color = colorOf(s)
			return {
				name: s.name,
				type: 'line',
				smooth: props.smooth,
				yAxisIndex: s.axis === 'right' ? 1 : 0,
				data: props.chartData.map((item) => parseFloat(String(item[s.key]))),
				// 平常只留最後一筆的圓點，滑過才會出現該筆的點
				showSymbol: true,
				symbol: 'circle',
				symbolSize: (_v: unknown, params: { dataIndex: number }) => (params.dataIndex === last ? 8 : 0),
				lineStyle: { width: 2.25, color },
				itemStyle: { color, borderColor: p.tooltipBg, borderWidth: 2 },
				emphasis: { focus: 'none', scale: 1.4 },
				areaStyle: props.area
					? {
							color: {
								type: 'linear',
								x: 0,
								y: 0,
								x2: 0,
								y2: 1,
								colorStops: [
									{ offset: 0, color: withAlpha(color, props.series.length > 1 ? 0.16 : 0.24) },
									{ offset: 1, color: withAlpha(color, 0) },
								],
							},
						}
					: undefined,
			}
		})

		return {
			animationDuration: 700,
			// ECharts 6 的 containLabel 要另外註冊 feature，改用 outerBounds：座標軸文字也算在 grid 範圍內
			grid: { top: 14, left: 6, right: 10, bottom: 2, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
			tooltip: {
				...chartTooltip(p),
				trigger: 'axis',
				axisPointer: { type: 'line', lineStyle: { color: p.muted, width: 1, type: 'dashed' } },
				formatter: (params: any) => {
					const list = Array.isArray(params) ? params : [params]
					const item = props.chartData[list[0].dataIndex]
					const date = String(item?.[props.xAxisKey] ?? '').slice(0, 10)
					return (
						`<div style="font-size:11px;opacity:.6">${date}</div>` +
						list.map((x: any) => tooltipRow(x.color, x.seriesName, props.valueFormatter(Number(x.value)))).join('')
					)
				},
			},
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: props.chartData.map((item) => toAxisDate(String(item[props.xAxisKey]))),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: p.muted,
					fontSize: 11,
					margin: 10,
					interval: labelStep.value - 1,
					alignMinLabel: 'left',
					alignMaxLabel: 'right',
				},
			},
			yAxis: isDual.value
				? [
						{
							...axisBase.value,
							axisLabel: { color: sideColor('left'), fontSize: 11, formatter: props.axisFormatter },
							splitLine: { lineStyle: { color: p.grid, type: 'dashed' } },
						},
						{
							...axisBase.value,
							axisLabel: { color: sideColor('right'), fontSize: 11, formatter: props.axisFormatter },
							splitLine: { show: false },
						},
					]
				: {
						...axisBase.value,
						axisLabel: { color: p.muted, fontSize: 11, formatter: props.axisFormatter },
						splitLine: { lineStyle: { color: p.grid, type: 'dashed' } },
					},
			series,
		}
	})
</script>
