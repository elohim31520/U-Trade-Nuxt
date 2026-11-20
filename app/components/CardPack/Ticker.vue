<template>
	<div
		v-if="items.length"
		class="cp-ticker relative z-2 flex h-10 min-w-0 items-center gap-2 bg-(image:--cp-img-ticker-bar) bg-size-[100%_100%] bg-center bg-no-repeat pr-3 text-[0.8125rem] font-bold text-(--cp-on-primary)"
	>
		<span
			class="cp-ticker-label w-[22%] shrink-0 text-center text-xs leading-normal font-extrabold whitespace-nowrap text-(--cp-ticker-label)"
		>
			{{ $t('card_pack.ticker_label') }}
		</span>
		<div class="cp-ticker-track min-w-0 flex-1 overflow-hidden">
			<!-- 內容複製一份，捲動到一半時無縫接回開頭 -->
			<div class="cp-ticker-items inline-flex gap-8 whitespace-nowrap">
				<span
					v-for="(item, i) in [...items, ...items]"
					:key="i"
					class="before:text-(--cp-accent) before:content-['★_']"
				>
					{{ item }}
				</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	/** 中獎跑馬燈：items 是已經組好文字的中獎訊息（沒有就整條不顯示） */
	defineProps<{ items: string[] }>()
</script>

<style scoped>
	.cp-ticker-items {
		animation: cp-ticker 22s linear infinite;
	}
	@keyframes cp-ticker {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cp-ticker-items {
			animation: none !important;
		}
	}
</style>
