<template>
	<div class="p-1 bg-surface-card rounded-lg shadow-card-primary">
		<div class="flex justify-center gap-5 my-5">
			<div v-for="day in timeRanges" :key="day" @click="refreshData(day)" :class="[
				'px-2 py-2 rounded-md w-auto min-w-[3rem] text-center whitespace-nowrap',
				selectedDays === day ? 'bg-primary text-on-primary' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
			]">
				{{ $t('momentum_chart.days_unit', { count: day }) }}
			</div>
		</div>

		<ClientOnly>
			<div class="h-[400px]">
				<v-chart class="chart" :option="option" autoresize />
			</div>
			<template #fallback>
				<div class="h-[400px] bg-gray-100 animate-pulse" />
			</template>
		</ClientOnly>

		<div class="text-gray-500 p-2">
			<div class="mb-2">
				{{ $t('momentum_chart.tips') }}
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const chartColor = useChartColor()
const localePath = useLocalePath()
const userStore = useUserStore()
const { $publicKV, $bffApi } = useNuxtApp()

const timeRanges = [1, 3, 7, 30]
const selectedDays = ref<number>(1)

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
const option = computed(() => {
	const dates = momentumData.value.map((item: chartData) => item.ct)
	const volumes = momentumData.value.map((item: chartData) => item.v)
	const baseDelay = DELAY_CONFIG[selectedDays.value] || 0
	return {
		title: {
			text: t('momentum_chart.title', { days: selectedDays.value }),
			left: 'center',
		},
		tooltip: {
			trigger: 'axis',
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: dates,
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: (value: number) => `${value}%`,
			},
		},
		series: [
			{
				data: volumes,
				type: 'bar',
				itemStyle: {
					color: chartColor.value,
				},
				animationDelay: (idx: number) => idx * baseDelay,
				animationDelayUpdate: (idx: number) => idx * baseDelay,
			},
		],
		animation: true,
		animationDuration: 1000,
		animationEasing: 'cubicOut' as const,
	}
})

const BFF_DAYS = new Set([7, 30])

const fetchData = async (days: number): Promise<chartData[]> => {
	try {
		const res = BFF_DAYS.has(days)
			? await $bffApi.getMomentumByRange(days)
			: await $publicKV.getMomentumByRange(days)
		return res.data
	} catch (error) {
		console.error(`Failed to fetch ${days}-day momentum data:`, error)
		return []
	}
}

const refreshData = async (days: number): Promise<void> => {
	// 1. 權限檢查：如果沒登入 且 選的是 7 或 30 天
	if (!userStore.isLogin && ![1, 3].includes(days)) {
		navigateTo(localePath('/login'))
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
