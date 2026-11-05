<template>
	<div
		class="relative overflow-hidden rounded-2xl border border-gray-100 bg-surface-card p-3.5 shadow-card-soft motion-safe:animate-row-in"
	>
		<div class="flex items-center gap-1.5 text-xs font-medium text-gray-500">
			<span aria-hidden="true" class="size-1.5 shrink-0 rounded-full" :style="{ background: color }" />
			<span class="truncate">{{ label }}</span>
		</div>

		<div class="mt-2 text-[22px] font-bold leading-none tracking-tight tabular-nums text-gray-900">{{ value }}</div>

		<!-- 迷你走勢：只看形狀不看刻度，所以不畫座標軸；寬度拉伸、線寬用 non-scaling-stroke 維持固定粗細 -->
		<svg
			v-if="path"
			class="mt-3 block h-8 w-full overflow-visible"
			viewBox="0 0 100 32"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<defs>
				<linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" :stop-color="color" stop-opacity="0.22" />
					<stop offset="1" :stop-color="color" stop-opacity="0" />
				</linearGradient>
			</defs>
			<path :d="`${path} L100,32 L0,32 Z`" :fill="`url(#${gradientId})`" />
			<path
				:d="path"
				fill="none"
				:stroke="color"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
	</div>
</template>

<script setup lang="ts">
	import { computed, useId } from 'vue'

	const props = defineProps<{
		label: string
		value: string
		color: string
		/** 走勢的數值，由舊到新 */
		points: number[]
	}>()

	// useId() 的格式不保證能直接放進 url(#...)，把非字元符號濾掉
	const gradientId = `spark-${useId().replace(/[^\w-]/g, '')}`

	// 上下各留 3 的空間，線頭線尾的圓角不會被切掉
	const path = computed(() => {
		const values = props.points.filter(Number.isFinite)
		if (values.length < 2) return ''
		const min = Math.min(...values)
		const range = Math.max(...values) - min || 1
		return values
			.map((v, i) => {
				const x = (i / (values.length - 1)) * 100
				const y = 29 - ((v - min) / range) * 26
				return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
			})
			.join(' ')
	})
</script>
