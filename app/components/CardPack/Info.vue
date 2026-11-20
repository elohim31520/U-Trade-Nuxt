<template>
	<section
		class="cp-info bg-(--cp-bg) bg-(image:--cp-img-info-bg) bg-size-[23.4375rem] bg-top bg-repeat text-(--cp-text)"
		:aria-label="$t('card_pack.info_aria')"
	>
		<div class="cp-info-inner flex flex-col gap-6 px-4 pt-8 pb-24">
			<article class="cp-card relative px-1 pt-2 pb-1">
				<h2 :class="CARD_TITLE_CLASS" class="cp-card-title">{{ rulesTitle }}</h2>
				<ol v-if="rules.length" class="cp-rules list-decimal! space-y-2 pl-[1.3em]! text-sm leading-normal">
					<li v-for="(rule, i) in rules" :key="i">{{ rule }}</li>
				</ol>
				<p
					v-else
					class="cp-slot flex min-h-40 items-center justify-center rounded-lg border-2 border-dashed border-(--cp-border) p-4 text-center text-[0.8125rem] leading-normal text-(--cp-text-2)"
				>
					{{ $t('card_pack.rules_empty') }}
				</p>
			</article>

			<article class="cp-card relative px-1 pt-2 pb-1">
				<h2 :class="CARD_TITLE_CLASS" class="cp-card-title">
					{{ $t('card_pack.records_title') }}
				</h2>
				<ul class="cp-record-list text-sm leading-normal">
					<li v-if="!records.length" class="cp-empty text-(--cp-text-2)">
						{{ recordsEmpty }}
					</li>
					<li
						v-for="(record, i) in records"
						:key="i"
						class="cp-record flex items-baseline justify-between gap-3 border-t border-(--cp-border) py-2 first:border-t-0 first:pt-0"
					>
						<span class="min-w-0">
							<RarityTag :rarity="record.rarity" class="mr-2" />
							{{ record.name }}
							<span class="mt-0.5 block text-xs text-(--cp-text-2)">{{ record.headline }}</span>
						</span>
						<time class="shrink-0 text-(--cp-text-2) tabular-nums">{{ record.time }}</time>
					</li>
				</ul>
				<!-- 開發環境限定：每天的次數用完後要等隔天，靠這顆重設自己的次數與紀錄 -->
				<button
					v-if="isDev"
					type="button"
					class="cp-dev-reset mt-3 cursor-pointer text-xs leading-normal text-(--cp-text-2) underline"
					@click="emit('reset')"
				>
					重設次數（僅開發環境）
				</button>
			</article>

			<div
				class="cp-footer-deco -mx-4 h-0 bg-(image:--cp-img-footer-deco) bg-size-[100%_100%] bg-center bg-no-repeat pt-[21.33%]"
				aria-hidden="true"
			/>
		</div>
	</section>
</template>

<script setup lang="ts">
	import type { CardPackRecordView } from '@/types/cardPack'
	import RarityTag from './RarityTag.vue'

	/** 活動下半部的說明：玩法說明卡、我的抽卡紀錄卡、頁尾裝飾 */
	defineProps<{
		rulesTitle: string
		rules: string[]
		/** 最新的在最上面；名稱前面會加稀有度標籤 */
		records: CardPackRecordView[]
		/** 還沒有紀錄時的提示 */
		recordsEmpty: string
	}>()
	const emit = defineEmits<{ reset: [] }>()

	/** 只在開發環境顯示「重設次數」；每天的次數用完後要等隔天，開發時靠它重設 */
	const isDev = import.meta.dev

	/** 卡片標題的緞帶：標題往上突出卡片邊框，寬度至少 60% */
	const CARD_TITLE_CLASS =
		'mx-auto -mt-8.5 mb-4 table min-w-[60%] bg-(image:--cp-img-card-title) bg-size-[100%_100%] bg-center bg-no-repeat px-8 pt-3 pb-4 text-center text-base leading-normal font-extrabold text-(--cp-on-primary)'
</script>

<style scoped>
	/* ---------- 說明卡片：九宮格邊框圖（切片 40、邊框 1.25rem）+ 陰影 ---------- */
	.cp-card {
		border: 1.25rem solid transparent;
		border-image: var(--cp-img-card-frame) 40 fill / 1.25rem stretch;
		filter: drop-shadow(0 0.375rem 0.875rem var(--cp-card-shadow));
	}
</style>
