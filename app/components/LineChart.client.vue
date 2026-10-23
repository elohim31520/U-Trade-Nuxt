<template>
	<v-chart class="chart" :style="{ height }" :option="option" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import type { StockMetrics } from '~/types/stockMetrics'

const {
	title,
	lineColor,
	chartData,
	height = '400px',
	smooth = true,
	compact = false,
	xAxisKey,
	seriesKey,
} = defineProps<{
	title: string
	lineColor?: string
	chartData: StockMetrics[]
	height?: string
	smooth?: boolean | number
	/** 卡片內嵌用：不顯示圖表標題，收緊邊距、改用短日期與面積漸層 */
	compact?: boolean
	xAxisKey?: string
	seriesKey?: string
}>()

const color = computed(() => lineColor || '#F88379')

const xAxisData = computed(() => {
	return chartData.map((item) => new Date(item[xAxisKey as keyof typeof item]).toLocaleDateString())
})

const shortLabels = computed(() => {
	return chartData.map((item) => {
		const date = new Date(item[xAxisKey as keyof typeof item])
		return `${date.getMonth() + 1}/${date.getDate()}`
	})
})

const seriesData = computed(() => {
	return chartData.map((item) => parseFloat(item[seriesKey as keyof typeof item] as keyof StockMetrics))
})

const option = computed<EChartsOption>(() => ({
	title: compact ? undefined : { text: title, left: 'center' },
	grid: compact ? { top: 12, left: 8, right: 12, bottom: 4, containLabel: true } : undefined,
	tooltip: {
		trigger: 'axis',
		confine: compact,
		valueFormatter: compact ? (value) => Number(value).toFixed(2) : undefined,
	},
	xAxis: {
		type: 'category',
		data: xAxisData.value,
		boundaryGap: !compact,
		axisTick: { show: !compact },
		axisLine: compact ? { lineStyle: { color: '#e5e7eb' } } : undefined,
		axisLabel: compact
			? {
				color: '#9ca3af',
				fontSize: 10,
				hideOverlap: true,
				formatter: (_value: string, index: number) => shortLabels.value[index],
			}
			: undefined,
		splitLine: {
			show: !compact,
			lineStyle: {
				color: 'rgba(0,0,0,0.06)',
				width: 1,
			},
		},
	},
	yAxis: {
		type: 'value',
		scale: true,
		splitNumber: compact ? 4 : undefined,
		axisLabel: compact ? { color: '#9ca3af', fontSize: 10 } : undefined,
		splitLine: {
			lineStyle: {
				color: compact ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.06)',
				width: 1,
			},
		},
	},
	series: [
		{
			type: 'line',
			name: compact ? title : undefined,
			symbol: 'none',
			smooth,
			data: seriesData.value,
			lineStyle: compact ? { width: 2 } : undefined,
			itemStyle: {
				color: color.value,
			},
			areaStyle: compact
				? {
					opacity: 0.18,
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: color.value },
							{ offset: 1, color: '#ffffff' },
						],
					},
				}
				: undefined,
		},
	],
}))
</script>
