<template>
	<div v-if="rows.length" class="w-full">
		<h3 v-if="showTitle" class="mb-4 text-sm font-bold uppercase tracking-widest">
			{{ $t('portfolio.allocation') }}
		</h3>

		<!-- 圓環：中央疊 HTML 數字（canvas 內的文字吃不到 tabular-nums 與字重） -->
		<div class="relative mx-auto size-[248px]">
			<v-chart class="size-full" :option="chartOptions" autoresize />
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span class="text-xs tracking-widest text-gray-400">{{ $t('portfolio.total_value') }}</span>
				<span class="mt-1.5 text-[28px] font-semibold leading-none tabular-nums text-gray-800">
					${{ formatCompact(total) }}
				</span>
			</div>
		</div>

		<!-- 圖例：色點對應圓環顏色，並列出佔比與價值（行動裝置沒有 hover tooltip） -->
		<ul class="mt-5 border-t border-gray-100">
			<li
				v-for="row in rows"
				:key="row.symbol"
				class="flex items-center gap-2.5 border-b border-gray-100 py-3 last:border-b-0 last:pb-0"
			>
				<span class="size-2.5 shrink-0 rounded-full" :style="{ background: row.gradient }" aria-hidden="true" />
				<span class="min-w-0 flex-1 truncate text-sm font-medium">{{ row.symbol }}</span>
				<span class="w-12 text-right text-xs tabular-nums text-gray-400">{{ row.share.toFixed(1) }}%</span>
				<span class="min-w-[8.5rem] text-right text-sm font-semibold tabular-nums">${{ formatMoney(row.value) }}</span>
			</li>
		</ul>
	</div>
	<div v-else class="py-10 text-center text-sm text-gray-400">{{ $t('portfolio.loading_or_no_holding') }}</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { EChartsOption } from 'echarts'
	import { formatMoney, formatCompact } from '~/utils/util'

	defineOptions({
		name: 'PortfolioChart',
	})

	withDefaults(defineProps<{ showTitle?: boolean }>(), { showTitle: true })

	const { rows, total } = usePortfolioAllocation()

	const gradient = ([from, to]: [string, string]) => ({
		type: 'linear' as const,
		x: 0,
		y: 0,
		x2: 1,
		y2: 1,
		colorStops: [
			{ offset: 0, color: from },
			{ offset: 1, color: to },
		],
	})

	const chartOptions = computed<EChartsOption>(() => ({
		series: [
			{
				type: 'pie',
				// 外徑留邊給光暈，否則 shadowBlur 會被 canvas 邊界切平
				radius: ['64%', '82%'],
				center: ['50%', '50%'],
				startAngle: 90,
				padAngle: rows.value.length > 1 ? 3 : 0,
				silent: true,
				label: { show: false },
				labelLine: { show: false },
				itemStyle: { borderRadius: 10 },
				data: rows.value.map((row) => ({
					name: row.symbol,
					value: row.value,
					itemStyle: {
						color: gradient(row.colors),
						shadowBlur: 14,
						shadowOffsetY: 4,
						// 色碼為 #rrggbb，補兩碼 alpha（0x4d ≈ 30%）
						shadowColor: `${row.colors[1]}4d`,
					},
				})),
				animationDuration: 900,
				animationEasing: 'cubicOut',
			},
		],
	}))
</script>
