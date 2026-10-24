<template>
	<div class="min-h-screen flex flex-col max-w-[480px] mx-auto bg-surface pb-[6rem]">
		<AppHeader v-if="showHeader" />

		<SideMenu />

		<ClientOnly>
			<AuthModal />
		</ClientOnly>

		<main :class="['grow transition-all duration-300', showHeader ? 'pt-[3.75rem]' : 'pt-0']">
			<NuxtRouteAnnouncer />
			<NuxtPage />
		</main>

		<Footer />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { t } = useI18n()

usePageSeo(computed(() => ({
	title: t('meta.default_title'),
	description: t('meta.default_description'),
})))

useHead({ script: [{ innerHTML: themeInitScript, tagPosition: 'head' }] })

const showHeader = computed(() => {
	if (['/my', '/my/'].includes(route.path)) return false
	return true
})
</script>
