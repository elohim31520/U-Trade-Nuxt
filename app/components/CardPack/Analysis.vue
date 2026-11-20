<template>
	<section
		class="cp-analysis rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md text-left text-sm leading-relaxed text-(--cp-on-primary)"
		:aria-label="$t('card_pack.analysis.aria')"
	>
		<header class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
			<strong class="text-base tracking-wide">{{ card.symbol }}</strong>
			<span class="font-bold tabular-nums">{{ formatChange(card.signals.dayChgPct) }}</span>
			<span class="rounded-full border border-white/40 px-2 py-px text-[0.6875rem] font-bold">
				{{ $t(`card_pack.sentiment.${card.sentiment}`) }}
			</span>
			<span class="ml-auto opacity-70">
				{{ $t('card_pack.analysis.as_of', { d: formatTradingDate(card.date) }) }}
			</span>
		</header>

		<h3 class="mt-2 text-base leading-snug font-extrabold">{{ text.headline }}</h3>
		<p class="mt-1.5 opacity-90">{{ text.summary }}</p>
		<ul class="mt-2 list-disc! space-y-1 pl-5! opacity-90">
			<li v-for="(point, i) in text.points" :key="i">{{ point }}</li>
		</ul>
		<p class="mt-2">
			<strong>{{ $t('card_pack.analysis.watch') }}</strong>
			{{ text.watch }}
		</p>

		<!-- 後端用行情算出的數字（不經過 AI） -->
		<dl class="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
			<div v-for="stat in stats" :key="stat.label" class="min-w-0">
				<dt class="opacity-70">{{ stat.label }}</dt>
				<dd class="font-bold tabular-nums">{{ stat.value }}</dd>
			</div>
		</dl>

		<p class="mt-3 text-[0.6875rem] leading-normal opacity-70">{{ $t('card_pack.analysis.disclaimer') }}</p>
	</section>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { CardPackCard, CardText } from '@/types/cardPack'
	import { formatChange, formatMultiple, formatTradingDate } from '@/utils/cardPackContent'

	/**
	 * 揭曉後的分析面板（兩個風格共用）：標題、概述、重點、後續觀察、後端算好的幾個數字與免責聲明。
	 * 顏色全用半透明白，疊在揭曉層的深色遮罩上，不跟風格的色票走。
	 */
	const props = defineProps<{
		card: CardPackCard
		/** 已依語系挑好的分析文字 */
		text: CardText
	}>()

	const { t } = useI18n()

	const stats = computed(() => {
		const { price, volumeRatio, moveMultiple, change20dPct } = props.card.signals
		return [
			{ label: t('card_pack.analysis.close'), value: `$${price.toLocaleString('en-US')}` },
			{ label: t('card_pack.analysis.volume'), value: formatMultiple(volumeRatio) || '--' },
			{ label: t('card_pack.analysis.move'), value: formatMultiple(moveMultiple) || '--' },
			{ label: t('card_pack.analysis.change20d'), value: formatChange(change20dPct) },
		]
	})
</script>
