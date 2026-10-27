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
		xAxisKey,
		seriesKey,
	} = defineProps<{
		title: string
		lineColor?: string
		chartData: StockMetrics[]
		height?: string
		xAxisKey: keyof StockMetrics
		seriesKey: keyof StockMetrics
	}>()

	const xAxisData = computed(() => {
		return chartData.map((item) => new Date(item[xAxisKey]).toLocaleDateString())
	})

	const seriesData = computed(() => {
		return chartData.map((item) => parseFloat(String(item[seriesKey])))
	})

	const option = computed<EChartsOption>(() => ({
		title: {
			text: title,
			left: 'center',
		},
		tooltip: {
			trigger: 'axis',
		},
		xAxis: {
			type: 'category',
			data: xAxisData.value,
		},
		yAxis: {
			type: 'value',
			scale: true,
		},
		series: [
			{
				type: 'bar',
				data: seriesData.value,
				itemStyle: {
					color: lineColor || '#F88379',
				},
			},
		],
	}))
</script>
