<template>
	<span
		class="inline-block rounded-full px-2 py-px text-[0.6875rem] leading-normal font-extrabold tracking-widest whitespace-nowrap text-(--cp-on-primary) uppercase"
		:class="BG_CLASS[rarity]"
	>
		{{ $t(`card_pack.rarity.${rarity}`) }}
	</span>
</template>

<script setup lang="ts">
	import type { CardRarity } from '@/types/cardPack'

	/** 稀有度標籤（紀錄清單與揭曉的卡面共用）；顏色是活動色票的 --cp-rarity-* */
	defineProps<{ rarity: CardRarity }>()

	const BG_CLASS: Record<CardRarity, string> = {
		common: 'bg-(--cp-rarity-common)',
		rare: 'bg-(--cp-rarity-rare)',
		epic: 'bg-(--cp-rarity-epic)',
		legendary: 'bg-(--cp-rarity-legendary)',
	}
</script>
