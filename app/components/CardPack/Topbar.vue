<template>
	<!-- 浮在布幕上、不佔版面高度，讓主標與主角往上提。左邊是分享與音效（語言切換在站台的側邊選單） -->
	<div class="cp-topbar absolute inset-x-0 top-0 z-7 flex items-start gap-2 px-4 pt-2">
		<button type="button" :class="ICON_BUTTON_CLASS" :aria-label="$t('card_pack.share_button')" @click="emit('share')">
			<img class="size-full" :src="`${CARD_PACK.imgDir}/icon-share.${CARD_PACK.imgExt}`" alt="" />
		</button>
		<button
			type="button"
			:class="ICON_BUTTON_CLASS"
			:aria-pressed="soundEnabled"
			:aria-label="$t(soundEnabled ? 'card_pack.sound_off' : 'card_pack.sound_on')"
			@click="emit('toggleSound')"
		>
			<img
				class="size-full"
				:src="`${CARD_PACK.imgDir}/${soundEnabled ? 'icon-sound-on' : 'icon-sound-off'}.${CARD_PACK.imgExt}`"
				alt=""
			/>
		</button>
	</div>
</template>

<script setup lang="ts">
	import { CARD_PACK } from '@/constants/cardPack'

	defineProps<{ soundEnabled: boolean }>()
	const emit = defineEmits<{ share: []; toggleSound: [] }>()

	/** 分享、音效兩顆圓鈕共用的樣式 */
	const ICON_BUTTON_CLASS =
		'size-9 cursor-pointer rounded-full shadow-(--cp-shadow-btn) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cp-accent)'
</script>
