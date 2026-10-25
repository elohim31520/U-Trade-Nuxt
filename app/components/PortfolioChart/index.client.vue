<template>
	<div v-if="chartOptions" class="w-full h-[450px]">
		<v-chart :option="chartOptions" autoresize />
	</div>
	<div v-else class="text-center text-gray-500 pt-2">正在載入資料或無持股...</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatNumber } from '~/utils/util'

const portfolioStore = usePortfolioStore()

defineOptions({
	name: 'PortfolioChart',
})

const props = withDefaults(defineProps<{ showTitle?: boolean }>(), { showTitle: true })

const chartOptions = computed<EChartsOption | null>(() => {
	const data = portfolioStore.portfolioData
	if (!data || data.length === 0) return null

	return {
		title: {
			show: props.showTitle,
			text: '投資組合佔比',
			left: 'center',
		},
		tooltip: {
			trigger: 'item',
			formatter: '{a} <br/>{b} : {c} ({d}%)',
		},
		legend: {
			orient: 'horizontal',
			bottom: '5%',
			left: 'center',
			data: data.map((item) => item.stockSymbol),
		},
		series: [
			{
				name: '持股價值',
				type: 'pie',
				radius: ['35%', '60%'],
				center: ['50%', '40%'],
				data: data.map((item) => ({
					name: item.stockSymbol,
					value: formatNumber((item.quantity || 0) * (item.averagePrice || 0)),
				})),
				label: {
					show: true,
					formatter: '{b}\n({d}%)',
				},
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: 'rgba(0, 0, 0, 0.5)',
					},
				},
			},
		],
	}
})
</script>