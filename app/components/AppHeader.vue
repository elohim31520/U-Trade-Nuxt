<template>
	<header
		:class="['w-full max-w-[480px] flex-y-center bg-surface-card shadow-card-primary fixed top-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-300', isScrolled ? 'h-12' : 'h-15']">
		<div class="app-logo ml-4 transition-all duration-300 cursor-pointer"
			:style="{ height: isScrolled ? '1.5rem' : '1.875rem' }" @click="navigateTo(localePath('/'))"></div>
		<div @click.prevent="uiStore.showMenu" class="p-2 ml-auto mr-2.5">
			<SvgIcon name="icon_button_Menu" :size="isScrolled ? '1.5rem' : '2rem'" class="text-gray-700" />
		</div>
	</header>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const localePath = useLocalePath()
const { y } = useWindowScroll()

const isScrolled = computed(() => y.value > 20)
</script>
