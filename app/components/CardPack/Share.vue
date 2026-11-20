<template>
	<!-- 跟結果彈窗一樣留在容器內（不 Teleport）：寬度用量測到的容器寬，遮罩與面板才會對齊容器。
       z-index 要蓋過手機底部導覽（200）與浮動客服（150），跟公告彈窗同一層 -->
	<div
		v-if="open"
		class="fixed inset-y-0 z-1000 flex items-end justify-center bg-(--cp-scrim)"
		:style="{ width: `${width}px` }"
		role="dialog"
		aria-modal="true"
		aria-labelledby="card-pack-share-title"
		@click.self="emit('close')"
		@keydown.esc="emit('close')"
	>
		<div
			class="cp-sheet-panel w-full rounded-t-2xl bg-(--cp-surface) px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 id="card-pack-share-title" class="m-0 text-[1.0625rem] font-extrabold text-(--cp-text)">
					{{ $t('card_pack.share_title') }}
				</h2>
				<button
					type="button"
					class="size-9 cursor-pointer rounded-full bg-(--cp-surface-2) text-[1.375rem] leading-none text-(--cp-text)"
					:class="FOCUS_CLASS"
					:aria-label="$t('card_pack.share_close')"
					@click="emit('close')"
				>
					×
				</button>
			</div>

			<div class="grid grid-cols-5 gap-2">
				<a
					v-for="link in links"
					:key="link.id"
					class="flex min-w-0 flex-col items-center gap-1 rounded-lg text-xs font-semibold text-(--cp-text) no-underline"
					:class="FOCUS_CLASS"
					:href="link.href"
					target="_blank"
					rel="noopener"
				>
					<span
						class="flex size-12 items-center justify-center rounded-full text-lg font-extrabold text-(--cp-on-primary)"
						:class="DOT_CLASS[link.id]"
						aria-hidden="true"
					>
						{{ link.name.charAt(0) }}
					</span>
					<span>{{ link.name }}</span>
				</a>
			</div>

			<div class="mt-5 flex gap-2">
				<input
					ref="urlInput"
					class="min-h-11 min-w-0 flex-1 rounded-full border border-(--cp-border) bg-(--cp-bg) px-3 text-[0.8125rem] text-(--cp-text-2)"
					type="text"
					readonly
					:value="url"
					:aria-label="$t('card_pack.share_url_label')"
					@focus="urlInput?.select()"
				/>
				<button
					ref="copyButton"
					type="button"
					class="min-h-11 shrink-0 cursor-pointer rounded-full bg-(--cp-primary) px-5 text-sm font-extrabold text-(--cp-on-primary)"
					:class="FOCUS_CLASS"
					@click="copy(urlInput)"
				>
					{{ $t('card_pack.share_copy') }}
				</button>
			</div>

			<button
				v-if="canNativeShare()"
				type="button"
				class="mx-auto mt-4 block cursor-pointer text-[0.8125rem] text-(--cp-text-2) underline"
				:class="FOCUS_CLASS"
				@click="nativeShare"
			>
				{{ $t('card_pack.share_more') }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { nextTick, ref, watch } from 'vue'
	import { useCardPackShare } from '@/composables/useCardPackShare'
	import type { SharePlatformId } from '@/utils/cardPackContent'

	const props = defineProps<{
		open: boolean
		/** 容器寬（px）：遮罩與面板的寬度要等於活動容器，不是整個視窗 */
		width: number
		/** 活動名稱（已翻譯），系統分享選單的標題 */
		title: string
		/** 分享文案（已翻譯，各活動不同） */
		text: string
	}>()
	const emit = defineEmits<{ close: [] }>()

	const { url, links, canNativeShare, copy, nativeShare } = useCardPackShare(
		() => props.title,
		() => props.text
	)

	const FOCUS_CLASS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cp-accent)'

	/** 各平台圓點的代表色（色票在 Shell.vue 的 .cp-theme） */
	const DOT_CLASS: Record<SharePlatformId, string> = {
		line: 'bg-(--cp-share-line)',
		facebook: 'bg-(--cp-share-facebook)',
		x: 'bg-(--cp-share-x)',
		whatsapp: 'bg-(--cp-share-whatsapp)',
		telegram: 'bg-(--cp-share-telegram)',
	}

	// 面板開啟時把焦點移到「複製連結」，關閉後還給原本的分享鈕
	const urlInput = ref<HTMLInputElement | null>(null)
	const copyButton = ref<HTMLButtonElement | null>(null)
	let previouslyFocused: HTMLElement | null = null
	watch(
		() => props.open,
		async (open) => {
			if (open) {
				previouslyFocused = document.activeElement as HTMLElement | null
				await nextTick()
				copyButton.value?.focus()
			} else {
				previouslyFocused?.focus()
				previouslyFocused = null
			}
		}
	)
</script>

<style scoped>
	.cp-sheet-panel {
		animation: cp-sheet-up 0.24s ease-out;
	}

	@keyframes cp-sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cp-sheet-panel {
			animation: none !important;
		}
	}
</style>
