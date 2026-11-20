<template>
	<CardPackShell v-slot="{ width: containerWidth }" :theme="themeStyle">
		<section
			class="cp-stage relative overflow-hidden bg-(--cp-surface-2) bg-(image:--cp-img-stage-bg) bg-cover bg-bottom bg-no-repeat text-(--cp-text)"
			:aria-label="$t('card_pack.stage_aria')"
		>
			<CardPackTopbar :sound-enabled="soundEnabled" @share="shareOpen = true" @toggle-sound="toggleSound" />

			<div class="relative z-3 px-4 pt-12 pb-4 text-center">
				<h1 class="cp-title relative z-2 mx-auto w-[92%] max-w-100">
					<img class="h-auto w-full" :src="titleImage" :alt="$t('card_pack.title')" />
				</h1>
				<p v-if="dataDateText" class="relative z-2 mt-2">
					<span
						class="cp-period inline-block min-w-[70%] bg-(image:--cp-img-period-badge) bg-size-[100%_100%] bg-center bg-no-repeat px-[clamp(1.5rem,calc(9*var(--cp-u)),3rem)] py-2 text-[0.8125rem] font-bold whitespace-nowrap text-(--cp-text)"
					>
						{{ dataDateText }}
					</span>
				</p>

				<CardPackScene
					ref="sceneRef"
					:phase="phase"
					:img-dir="CARD_PACK.imgDir"
					:img-ext="CARD_PACK.imgExt"
					:scene="CARD_PACK.scene"
					:label="packLabel"
					@select="onSelectPack"
					@pick="pickPack"
					@swipe-open="open"
					@choose="choose"
				/>

				<!-- 操作台：剩餘包數、主按鈕（挑選階段改顯示提示）、狀態提示、跑馬燈 -->
				<div class="relative mt-2 grid grid-cols-1 justify-items-center gap-2">
					<p
						class="cp-chances inline-flex items-baseline bg-(image:--cp-img-chances-badge) bg-size-[100%_100%] bg-center bg-no-repeat px-6 py-2 text-sm leading-normal font-bold whitespace-nowrap max-[22.4375rem]:px-4 max-[22.4375rem]:text-xs"
						:class="{ invisible: !ready }"
					>
						<i18n-t keypath="card_pack.chances" tag="span">
							<template #n>
								<strong class="text-xl leading-none text-(--cp-primary) max-[22.4375rem]:text-lg">
									{{ chances }}
								</strong>
							</template>
						</i18n-t>
					</p>

					<!-- 挑選階段沒有主按鈕：點 3D 區的任一包就是選擇，按鈕的位置改顯示提示（高度相同，切換時版面不跳） -->
					<p
						v-if="phase === 'select'"
						class="inline-flex min-h-14 w-full max-w-72 items-center justify-center gap-2 rounded-full border-2 border-dashed px-5 py-2 text-[0.9375rem] leading-tight font-extrabold"
						:class="
							pickHintEmpty
								? 'border-(--cp-border) bg-(--cp-surface) text-(--cp-text-2)'
								: 'border-(--cp-accent) bg-(--cp-surface) text-(--cp-text)'
						"
					>
						<img
							v-if="!pickHintEmpty"
							class="cp-tap size-9 shrink-0"
							:src="`${CARD_PACK.imgDir}/icon-tap.${CARD_PACK.imgExt}`"
							alt=""
						/>
						<span>{{ pickHint }}</span>
					</p>
					<button
						v-else
						type="button"
						class="min-h-14 w-full max-w-72 cursor-pointer rounded-full bg-(image:--cp-img-btn-primary) bg-size-[100%_100%] bg-center bg-no-repeat px-5 py-3 text-base leading-tight font-extrabold tracking-wider text-(--cp-on-primary)! shadow-(--cp-shadow-btn) transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--cp-accent) active:scale-96 disabled:cursor-progress disabled:opacity-60"
						:disabled="phase === 'loading' || phase === 'opening'"
						@click="open"
					>
						{{ $t('card_pack.action_open') }}
					</button>

					<p class="min-h-[1.5em] text-xs text-(--cp-text-2)" role="status" aria-live="polite">
						{{ status }}
					</p>
					<div class="min-h-7.25">
						<button v-if="phase === 'ready'" type="button" :class="LINK_CLASS" @click="backToSelect">
							{{ $t('card_pack.back') }}
						</button>
						<button v-else-if="phase === 'opening'" type="button" :class="LINK_CLASS" @click="skip">
							{{ $t('card_pack.skip') }}
						</button>
					</div>

					<div class="mt-1 w-full">
						<CardPackTicker :items="tickerItems" />
					</div>
				</div>
			</div>
		</section>

		<CardPackInfo
			:rules-title="rulesTitle"
			:rules="rules"
			:records="records"
			:records-empty="$t('card_pack.records_empty')"
			@reset="resetPacks"
		/>

		<CardPackReveal
			v-if="phase === 'reveal' && reward && rewardText"
			:width="containerWidth"
			:img-dir="CARD_PACK.imgDir"
			:img-ext="CARD_PACK.imgExt"
			:name="rewardName"
			:icon="rewardLogo"
			:card="reward"
			:text="rewardText"
			:rarity="rewardRarity"
			:flipped="flipped"
			@flip="flip"
			@step="revealStep"
		/>

		<CardPackShare
			:open="shareOpen"
			:width="containerWidth"
			:title="$t('card_pack.title')"
			:text="$t('card_pack.share_text')"
			@close="shareOpen = false"
		/>
	</CardPackShell>
</template>

<script setup lang="ts">
	import { nextTick, ref, watch } from 'vue'
	import { CARD_PACK } from '@/constants/cardPack'
	import type { CardPackSceneApi } from '@/types/cardPack'
	import { cardPackThemeStyle } from '@/utils/cardPackContent'
	import CardPackInfo from './Info.vue'
	import CardPackReveal from './Reveal.vue'
	import CardPackScene from './Scene.vue'
	import CardPackShare from './Share.vue'
	import CardPackShell from './Shell.vue'
	import CardPackTicker from './Ticker.vue'
	import CardPackTopbar from './Topbar.vue'

	/** 3D 場景元件：useCardPack 透過它轉環、撕開 */
	const sceneRef = ref<(CardPackSceneApi & { $el: HTMLElement }) | null>(null)

	const {
		phase,
		ready,
		chances,
		flipped,
		reward,
		soundEnabled,
		titleImage,
		dataDateText,
		rulesTitle,
		rules,
		tickerItems,
		records,
		packLabel,
		pickHint,
		pickHintEmpty,
		status,
		rewardName,
		rewardRarity,
		rewardLogo,
		rewardText,
		onSelectPack,
		choose,
		pickPack,
		open,
		skip,
		backToSelect,
		flip,
		revealStep,
		resetPacks,
		toggleSound,
	} = useCardPack(sceneRef, CARD_PACK)

	/** 活動的皮膚（色票＋背景圖）轉成 CSS 變數，綁在最外層 */
	const themeStyle = cardPackThemeStyle(CARD_PACK)

	const shareOpen = ref(false)

	/** 「選擇其他」「跳過動畫」這類文字連結 */
	const LINK_CLASS =
		'cursor-pointer px-2 py-1 text-[0.8125rem] text-(--cp-text-2) underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--cp-accent)'

	// 揭曉關閉後把焦點還給 3D 場景，鍵盤使用者可以接著挑下一包
	watch(phase, async (next, prev) => {
		if (prev === 'reveal' && next === 'select') {
			await nextTick()
			sceneRef.value?.$el.focus()
		}
	})
</script>

<style scoped>
	/* 挑選提示的手勢圖示：輕輕點按的動畫 */
	.cp-tap {
		animation: cp-tap 1.4s ease-in-out infinite;
	}
	@keyframes cp-tap {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		40% {
			transform: translateY(0.25rem) scale(0.92);
		}
		60% {
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cp-tap {
			animation: none !important;
		}
	}
</style>
