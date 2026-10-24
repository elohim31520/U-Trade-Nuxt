<template>
	<div class="bg-surface-card p-2 shadow-card-primary">
		<div class="text-lg font-bold mb-4 text-#434343">
			{{ $t('market_breadth.title') }}
		</div>
		<div class="text-base font-bold text-primary">{{ marketBreadth }}%</div>
		<v-chart class="chart" :option="chartOption" style="height: 400px" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '~/utils/util'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const chartColor = useChartColor()

const { $publicKV } = useNuxtApp()

const { data: fetchedData } = await useAsyncData(
	'market-breadth',
	async () => {
		const res = await $publicKV.getMarketBreadth()
		if (_isNumber(res.data)) {
			return formatNumber(res.data * 100)
		}
		return 0
	},
	{ server: false },
)

const marketBreadth = computed(() => fetchedData.value ?? 0)

const chartOption = computed(() => {
	return {
		tooltip: {
			trigger: 'item',
			formatter: '{b}: {d}%',
		},
		legend: {
			orient: 'vertical',
			left: 'left',
			data: [t('market_breadth.advancers'), t('market_breadth.decliners')],
		},
		series: [
			{
				name: t('market_breadth.advancers'),
				type: 'pie',
				radius: '50%',
				center: ['50%', '60%'],
				color: [chartColor.value, '#FDF3F4'],
				data: [
					{
						value: formatNumber(marketBreadth.value),
						name: t('market_breadth.advancers'),
					},
					{
						value: formatNumber(100 - marketBreadth.value),
						name: t('market_breadth.decliners'),
					},
				],
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
