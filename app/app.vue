<template>
	<div class="min-h-screen flex flex-col max-w-[480px] mx-auto bg-surface pb-[6rem]">
		<AppHeader />

		<SideMenu />

		<ClientOnly>
			<AuthModal />
		</ClientOnly>

		<main class="grow pt-[3.75rem]">
			<NuxtRouteAnnouncer />
			<NuxtPage />
		</main>

		<Footer />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { t } = useI18n()

usePageSeo(computed(() => ({
	title: t('meta.default_title'),
	description: t('meta.default_description'),
})))

useHead({ script: [{ innerHTML: themeInitScript, tagPosition: 'head' }] })
</script>
