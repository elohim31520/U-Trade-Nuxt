<template>
	<section>
		<SectionHeader :title="$t('market_breadth.title')" />

		<div class="rounded-2xl border border-gray-100 bg-surface-card px-5 pb-5 pt-6 shadow-card-primary">
			<!-- 圓環：中央疊 HTML 數字（canvas 內的文字吃不到 tabular-nums 與字重） -->
			<div class="relative mx-auto size-[232px]">
				<v-chart class="size-full" :option="chartOption" autoresize />
				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-xs tracking-widest text-gray-400">{{ $t('market_breadth.advancers') }}</span>
					<span class="mt-1.5 text-[36px] font-semibold leading-none tabular-nums text-gray-800">
						{{ advancers }}
						<span class="ml-0.5 text-lg font-medium text-gray-400">%</span>
					</span>
				</div>
			</div>

			<!-- 上漲／下跌兩欄：色點對應圓環顏色 -->
			<div class="mt-6 grid grid-cols-2 border-t border-gray-100 pt-4">
				<div class="flex flex-col items-center gap-1.5">
					<span class="flex items-center gap-1.5 text-xs text-gray-400">
						<span class="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
						{{ $t('market_breadth.advancers') }}
					</span>
					<span class="text-lg font-semibold tabular-nums text-emerald-600">{{ advancers }}%</span>
				</div>
				<div class="flex flex-col items-center gap-1.5 border-l border-gray-100">
					<span class="flex items-center gap-1.5 text-xs text-gray-400">
						<span class="size-2 rounded-full bg-red-500" aria-hidden="true" />
						{{ $t('market_breadth.decliners') }}
					</span>
					<span class="text-lg font-semibold tabular-nums text-red-500">{{ decliners }}%</span>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { formatNumber } from '~/utils/util'
	import { useI18n } from 'vue-i18n'
	import type { ThemeName } from '~/composables/useTheme'

	const { t } = useI18n()
	const { themeName } = useTheme()

	const { $publicKV } = useNuxtApp()

	/**
	 * 圓環漸層色 [起, 終]。canvas 吃不到 CSS 變數，依主題名稱查表；
	 * 漲跌色與 VolatileAsset 一致（default 為 emerald-500 / red-500，arctic-cyan 為 --c-positive / --c-negative）。
	 */
	const RING_COLOR: Record<ThemeName, { up: [string, string]; down: [string, string] }> = {
		default: { up: ['#6ee7b7', '#10b981'], down: ['#fca5a5', '#ef4444'] },
		'arctic-cyan': { up: ['#9be8c8', '#65d4a5'], down: ['#ffa3aa', '#ff6d78'] },
	}

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

	const { data: fetchedData } = await useAsyncData(
		'market-breadth',
		async () => {
			const res = await $publicKV.getMarketBreadth()
			if (_isNumber(res.data)) {
				return formatNumber(res.data * 100)
			}
			return 0
		},
		{ server: false }
	)

	const advancers = computed(() => fetchedData.value ?? 0)
	const decliners = computed(() => formatNumber(100 - advancers.value))

	const chartOption = computed(() => {
		const color = RING_COLOR[themeName.value]
		// 值為 0 的區段不畫，否則 padAngle 會在滿環上留下一道縫
		const parts = [
			{
				value: advancers.value,
				name: t('market_breadth.advancers'),
				colors: color.up,
				glow: 'rgba(16, 185, 129, 0.3)',
			},
			{
				value: decliners.value,
				name: t('market_breadth.decliners'),
				colors: color.down,
				glow: 'rgba(239, 68, 68, 0.3)',
			},
		].filter((part) => part.value > 0)

		return {
			series: [
				{
					type: 'pie',
					// 外徑留邊給光暈，否則 shadowBlur 會被 canvas 邊界切平
					radius: ['66%', '82%'],
					center: ['50%', '50%'],
					startAngle: 90,
					padAngle: parts.length > 1 ? 3 : 0,
					silent: true,
					label: { show: false },
					labelLine: { show: false },
					itemStyle: { borderRadius: 10 },
					data: parts.map((part) => ({
						value: part.value,
						name: part.name,
						itemStyle: {
							color: gradient(part.colors),
							shadowBlur: 14,
							shadowOffsetY: 4,
							shadowColor: part.glow,
						},
					})),
					animationDuration: 900,
					animationEasing: 'cubicOut' as const,
				},
			],
		}
	})
</script>
