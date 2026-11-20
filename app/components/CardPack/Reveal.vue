<template>
	<!-- 彈窗留在容器內（不 Teleport），寬度用量測到的容器寬，遮罩才會對齊容器而不是整個視窗。
       z-index 要蓋過手機底部導覽（200）與浮動客服（150），跟公告彈窗同一層 -->
	<div
		ref="dialogRef"
		class="cp-reveal fixed inset-y-0 z-1000 flex items-center justify-center overflow-y-auto bg-(--cp-reveal-bg) p-4"
		:style="{ width: `${width}px` }"
		role="dialog"
		aria-modal="true"
		aria-labelledby="card-pack-reveal-title"
	>
		<div class="m-auto w-full max-w-[calc(var(--cp-page-w)-2rem)] text-center text-(--cp-on-primary)">
			<h2 id="card-pack-reveal-title" class="text-xl font-extrabold">
				{{ $t('card_pack.reveal_title') }}
			</h2>
			<p class="mt-1 min-h-[1.5em] text-[0.8125rem] opacity-85" aria-live="polite">
				{{ flipped ? '' : $t('card_pack.reveal_tap') }}
			</p>

			<div class="relative my-4 grid place-items-center">
				<!-- 光暈：翻開前是 common 的淡光，翻開後依稀有度加強 -->
				<div
					class="cp-glow pointer-events-none absolute aspect-square w-[min(120%,80svh)] rounded-full transition-opacity duration-400"
					:style="{ '--cp-glow-color': `var(--cp-rarity-${flipped ? rarity : 'common'})` }"
					:data-rarity="flipped ? rarity : 'common'"
					aria-hidden="true"
				/>
				<img
					class="cp-rays pointer-events-none absolute aspect-square w-[min(120%,80svh)] max-w-none opacity-70"
					:src="`${imgDir}/reveal/reveal-rays.${imgExt}`"
					alt=""
				/>
				<button
					type="button"
					class="cp-card is-enter relative block cursor-pointer rounded-2xl"
					:class="{ 'is-flipped': flipped }"
					:aria-label="flipped ? name : $t('card_pack.reveal_flip')"
					@click="emit('flip')"
				>
					<span class="cp-face cp-face--back" aria-hidden="true">
						<img class="absolute inset-0 size-full" :src="`${imgDir}/reveal/reward-back.${imgExt}`" alt="" />
					</span>
					<span class="cp-face cp-face--front flex flex-col items-center justify-end gap-2 text-(--cp-text)">
						<img
							class="pointer-events-none absolute inset-0 size-full"
							:src="`${imgDir}/reveal/reward-frame-${rarity}.${imgExt}`"
							alt=""
						/>
						<!-- 公司 logo：墊一塊白底，深色或透明底的 logo 才看得清楚 -->
						<span
							v-if="icon"
							class="absolute top-[18%] left-1/2 grid aspect-square w-[46%] -translate-x-1/2 place-items-center rounded-2xl bg-white p-[7%] shadow-md"
						>
							<img class="size-full object-contain" :src="icon" alt="" />
						</span>
						<RarityTag :rarity="rarity" class="relative" />
						<span class="relative max-w-full text-[1.0625rem] leading-tight font-extrabold wrap-anywhere">
							{{ name }}
							<small class="mt-1 block text-xs font-bold text-(--cp-text-2) tabular-nums">
								{{ card.symbol }} · {{ formatChange(card.signals.dayChgPct) }}
							</small>
						</span>
					</span>
				</button>
			</div>

			<!-- 翻開後才看得到分析：標題、概述、重點、後續觀察與免責聲明；內容多時整個揭曉層可捲動 -->
			<CardPackAnalysis v-if="flipped" :card="card" :text="text" class="mb-4" />

			<div class="grid justify-items-center gap-2">
				<!-- 主按鈕：btn-primary 400×110，文字疊在上面 -->
				<button
					ref="actionButton"
					type="button"
					class="min-h-14 w-full max-w-72 cursor-pointer rounded-full bg-(image:--cp-img-btn-primary) bg-size-[100%_100%] bg-center bg-no-repeat px-5 py-3 text-base leading-tight font-extrabold tracking-wider text-(--cp-on-primary) shadow-(--cp-shadow-btn) transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--cp-accent) active:scale-96"
					@click="emit('step')"
				>
					{{ $t(flipped ? 'card_pack.reveal_done' : 'card_pack.reveal_flip') }}
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { nextTick, onMounted, ref, watch } from 'vue'
	import type { CardPackCard, CardRarity, CardText } from '@/types/cardPack'
	import { formatChange } from '@/utils/cardPackContent'
	import CardPackAnalysis from './Analysis.vue'
	import RarityTag from './RarityTag.vue'

	/** 開包後的揭曉：卡背朝上，點卡片或按鈕翻開（翻開後在卡片下面顯示分析），再按一次收下 */
	const props = defineProps<{
		/** 容器寬（px）：遮罩的寬度要等於活動容器，不是整個視窗 */
		width: number
		imgDir: string
		imgExt: string
		/** 公司名稱 */
		name: string
		/** 公司 logo */
		icon?: string
		rarity: CardRarity
		/** 抽到的卡 */
		card: CardPackCard
		/** 這張卡已依語系挑好的分析文字 */
		text: CardText
		flipped: boolean
	}>()
	const emit = defineEmits<{ flip: []; step: [] }>()

	// 揭曉一出現就把焦點放在主按鈕上，鍵盤使用者直接按 Enter 就能翻卡、收下
	const actionButton = ref<HTMLButtonElement | null>(null)
	onMounted(() => actionButton.value?.focus())

	// 翻開後下面多了分析面板，內容可能比視窗高：捲回最上面，先看到翻開的卡面，再往下讀分析
	const dialogRef = ref<HTMLElement | null>(null)
	watch(
		() => props.flipped,
		async (isFlipped) => {
			if (!isFlipped) return
			await nextTick()
			dialogRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
		}
	)
</script>

<style scoped>
	/* 光暈：稀有度顏色的放射漸層，越稀有越亮 */
	.cp-glow {
		background: radial-gradient(circle, var(--cp-glow-color) 0, transparent 62%);
		opacity: 0.55;
	}
	.cp-glow[data-rarity='rare'] {
		opacity: 0.8;
	}
	.cp-glow[data-rarity='epic'] {
		opacity: 0.9;
	}
	.cp-glow[data-rarity='legendary'] {
		opacity: 1;
	}

	.cp-rays {
		animation: cp-rays 18s linear infinite;
	}
	@keyframes cp-rays {
		to {
			transform: rotate(360deg);
		}
	}

	/* 卡片 2:3；翻面：兩面各自背面隱藏、翻轉方向相反 */
	.cp-card {
		width: min(calc(62 * var(--cp-u)), 15rem, calc((100svh - 16.25rem) / 1.5));
		aspect-ratio: 2 / 3;
		perspective: 900px;
		transform-style: preserve-3d;
	}
	.cp-card.is-enter {
		animation: cp-card-in 0.42s cubic-bezier(0.2, 0.9, 0.3, 1.2);
	}
	@keyframes cp-card-in {
		from {
			opacity: 0;
			transform: translateY(2.5rem) scale(0.9);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.cp-face {
		position: absolute;
		inset: 0;
		padding: 12% 10%;
		border-radius: 1rem;
		backface-visibility: hidden;
		transition: transform 0.6s cubic-bezier(0.3, 0.7, 0.2, 1);
		box-shadow: var(--cp-shadow-prize);
	}
	.cp-face--back {
		padding: 0;
		background: var(--cp-primary);
	}
	.cp-face--front {
		background: linear-gradient(160deg, var(--cp-surface), var(--cp-surface-2));
		transform: rotateY(180deg);
	}
	.cp-card.is-flipped .cp-face--back {
		transform: rotateY(-180deg);
	}
	.cp-card.is-flipped .cp-face--front {
		transform: rotateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.cp-rays,
		.cp-card.is-enter {
			animation: none !important;
		}
		.cp-face {
			transition: none;
		}
	}
</style>
