<template>
	<div class="flex-center">
		<NuxtLink :to="localePath(to)" class="see-more group">
			<span>{{ $t('see_more.text') }}</span>
			<span class="see-more__icon">
				<SvgIcon name="icon_arrow_right" size="0.75rem" />
			</span>
		</NuxtLink>
	</div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

defineProps<{
	to: string
}>()
</script>

<style scoped>
/* 膠囊按鈕：品牌色細描邊 + 淡色底，右側圓形箭頭。顏色全走 --color-primary / --color-surface-card，
   預設主題與 arctic-cyan 都會跟著換，不用另外寫深色版 */
.see-more {
	display: inline-flex;
	align-items: center;
	gap: 0.625rem;
	height: 2.25rem;
	padding: 0 0.375rem 0 1.125rem;
	border-radius: 9999px;
	border: 1px solid color-mix(in oklch, var(--color-primary) 32%, transparent);
	background: color-mix(in oklch, var(--color-primary) 7%, var(--color-surface-card));
	box-shadow:
		0 1px 2px rgb(16 24 40 / 0.04),
		0 6px 16px -8px color-mix(in oklch, var(--color-primary) 45%, transparent);
	color: var(--color-primary-600);
	font-size: 0.8125rem;
	font-weight: 500;
	letter-spacing: 0.06em;
	text-decoration: none;
	-webkit-tap-highlight-color: transparent;
	transition:
		transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
		border-color 0.25s,
		background-color 0.25s,
		box-shadow 0.25s;
}

.see-more__icon {
	display: grid;
	place-items: center;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 9999px;
	background: linear-gradient(135deg, var(--color-primary), var(--color-primary-600));
	color: var(--color-on-primary);
	box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.3);
	transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (hover: hover) {
	.see-more:hover {
		transform: translateY(-1px);
		border-color: color-mix(in oklch, var(--color-primary) 55%, transparent);
		background: color-mix(in oklch, var(--color-primary) 12%, var(--color-surface-card));
		box-shadow:
			0 1px 2px rgb(16 24 40 / 0.04),
			0 10px 20px -8px color-mix(in oklch, var(--color-primary) 55%, transparent);
	}

	.see-more:hover .see-more__icon {
		transform: translateX(2px);
	}
}

.see-more:active {
	transform: scale(0.97);
}

.see-more:focus-visible {
	outline: 2px solid var(--color-primary);
	outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {

	.see-more,
	.see-more__icon {
		transition: none;
	}
}
</style>
