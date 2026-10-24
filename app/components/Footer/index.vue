<template>
	<div class="bg-white fixed bottom-0 z-50 px-2.5 w-full max-w-[480px] left-1/2 -translate-x-1/2">
		<div class="grid grid-cols-5">
			<div v-for="(tab, index) in tabItems" :key="index" class="flex-center flex-col py-1" :class="{
				'bg-linear-to-r from-[#EC09F8] to-[#B732FF] bg-clip-text text-transparent': activeTab === tab.name,
			}" @click="handleClick(tab.to)">
				<SvgIcon size="1.5rem" :name="activeTab === tab.name ? tab.activeIcon : tab.defaultIcon"
					class="mb-0.5" />
				<span class="text-xs">
					{{ $t(tab.label) }}
				</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import SvgIcon from '@/components/SvgIcon/index.vue'

const route = useRoute()
const localePath = useLocalePath()

const activeTab = computed(() => {
	return (route.name as string) || 'index'
})

const tabItems = [
	{
		name: 'index',
		label: 'footer.home',
		defaultIcon: 'icon_voice',
		activeIcon: 'icon_voice_a',
		to: '/',
	},
	{
		name: 'portfolio',
		label: 'footer.portfolio',
		defaultIcon: 'icon_gift',
		activeIcon: 'icon_gift_a',
		to: '/portfolio',
	},
	{
		name: 'add-transaction',
		label: 'footer.record',
		defaultIcon: 'icon_follow2',
		activeIcon: 'icon_follow',
		to: '/add-transaction',
	},
	{
		name: 'info',
		label: 'footer.info',
		defaultIcon: 'icon_message',
		activeIcon: 'icon_message_a',
		to: '/posts',
	},
	{
		name: 'my',
		label: 'footer.my',
		defaultIcon: 'icon_user',
		activeIcon: 'icon_user_a',
		to: '/my',
	},
]

const handleClick = (to: string) => {
	navigateTo(localePath(to))
}
</script>
