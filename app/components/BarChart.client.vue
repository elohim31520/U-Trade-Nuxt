<template>
	<div class="w-full" :style="{ height }">
		<v-chart v-if="chartData.length" style="width: 100%; height: 100%" :option="option" autoresize />
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { EChartsOption } from 'echarts'
	import type { StockMetrics } from '~/types/stockMetrics'

	// 標題由外層卡片負責，圖裡只留長條與座標軸
	const {
		seriesName = '',
		color,
		colors,
		chartData,
		height = '200px',
		xAxisKey,
		seriesKey,
		valueFormatter = (value: number) => value.toLocaleString('en-US'),
		axisFormatter = (value: number) => String(value),
	} = defineProps<{
		/** tooltip 裡顯示的名稱 */
		seriesName?: string
		/** 全部長條同色；要逐根上色用 colors */
		color?: string
		/** 逐根長條的顏色，長度要跟 chartData 一樣（例如依漲跌上色） */
		colors?: string[]
		chartData: StockMetrics[]
		height?: string
		xAxisKey: keyof StockMetrics
		seriesKey: keyof StockMetrics
		/** tooltip 的數值格式 */
		valueFormatter?: (value: number) => string
		/** Y 軸刻度的數值格式（通常要縮寫，例如 90M） */
		axisFormatter?: (value: number) => string
	}>()

	const palette = useChartPalette()
	const primary = useChartColor()

	const option = computed<EChartsOption>(() => {
		const p = palette.value
		const step = Math.max(1, Math.ceil(chartData.length / 4))

		return {
			animationDuration: 600,
			// ECharts 6 的 containLabel 要另外註冊 feature，改用 outerBounds：座標軸文字也算在 grid 範圍內
			grid: { top: 10, left: 6, right: 10, bottom: 2, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
			tooltip: {
				...chartTooltip(p),
				trigger: 'axis',
				axisPointer: { type: 'shadow', shadowStyle: { color: p.grid } },
				formatter: (params: any) => {
					const list = Array.isArray(params) ? params : [params]
					const x = list[0]
					const date = String(chartData[x.dataIndex]?.[xAxisKey] ?? '').slice(0, 10)
					return (
						`<div style="font-size:11px;opacity:.6">${date}</div>` +
						tooltipRow(x.color, seriesName || x.seriesName, valueFormatter(Number(x.value)))
					)
				},
			},
			xAxis: {
				type: 'category',
				data: chartData.map((item) => toAxisDate(String(item[xAxisKey]))),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: p.muted,
					fontSize: 11,
					margin: 10,
					interval: step - 1,
					alignMinLabel: 'left',
					alignMaxLabel: 'right',
				},
			},
			// 長條要從 0 起算，不用 scale，不然短的那幾根會被誇大
			yAxis: {
				type: 'value',
				splitNumber: 3,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: p.muted, fontSize: 11, formatter: axisFormatter },
				splitLine: { lineStyle: { color: p.grid, type: 'dashed' } },
			},
			series: [
				{
					type: 'bar',
					name: seriesName,
					barMaxWidth: 9,
					itemStyle: { borderRadius: [3, 3, 0, 0], opacity: 0.88 },
					emphasis: { itemStyle: { opacity: 1 } },
					data: chartData.map((item, i) => ({
						value: parseFloat(String(item[seriesKey])),
						itemStyle: { color: colors?.[i] ?? color ?? primary.value },
					})),
				},
			],
		}
	})
</script>
