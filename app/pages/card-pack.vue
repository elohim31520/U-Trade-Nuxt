<template>
	<CardPack />
</template>

<script setup lang="ts">
	import { computed } from 'vue'

	// 抽卡的次數與紀錄都在後端，要登入才有；不要登入也能玩就拿掉這一行
	definePageMeta({ middleware: 'auth' })

	const { t } = useI18n()

	usePageSeo(
		computed(() => ({
			title: t('card_pack.meta_title'),
			description: t('card_pack.meta_description'),
			robots: 'noindex',
		}))
	)
</script>
