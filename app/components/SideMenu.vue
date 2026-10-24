<template>
	<van-popup :show="uiStore.isMenuShown" @update:show="uiStore.isMenuShown = $event" position="left"
		:style="{ width: '80%', height: '100%' }" z-index="99">
		<div class="pt-5 flex flex-col h-full">
			<nav class="flex flex-col gap-y-2">
				<template v-for="item in menuItems" :key="item.to">
					<NuxtLink v-if="
						item.display === 'always' ||
						(item.display === 'auth' && userStore.isLogin) ||
						(item.display === 'guest' && !userStore.isLogin)
					" :to="localePath(item.to)" @click="closeMenu"
						class="flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
						active-class="text-primary">
						<SvgIcon :name="item.icon" size="1.2rem" class="mr-5" />
						<span class="text-xl">{{ $t(item.text) }}</span>
					</NuxtLink>
				</template>
				<div v-if="userStore.isLogin" @click="logout"
					class="flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
					active-class="text-primary">
					<SvgIcon name="icon_quit" size="1.2rem" class="mr-5" />
					<span class="text-xl">{{ $t('sidemenu.logout') }}</span>
				</div>
			</nav>

			<!-- 語言切換 -->
			<div class="mt-6 px-4">
				<div class="flex rounded-lg overflow-hidden border border-gray-200">
					<NuxtLink :to="switchLocalePath('zh')" class="flex-1 py-2 text-center text-sm transition-colors"
						:class="locale === 'zh'
							? 'bg-primary text-on-primary font-semibold'
							: 'bg-surface-card text-gray-500 hover:bg-gray-50'" @click="closeMenu">
						中文
					</NuxtLink>
					<div class="w-px bg-gray-200" />
					<NuxtLink :to="switchLocalePath('en')" class="flex-1 py-2 text-center text-sm transition-colors"
						:class="locale === 'en'
							? 'bg-primary text-on-primary font-semibold'
							: 'bg-surface-card text-gray-500 hover:bg-gray-50'" @click="closeMenu">
						English
					</NuxtLink>
				</div>
			</div>

			<!-- 主題切換 -->
			<div class="mt-3 px-4">
				<ThemeSelector />
			</div>

		</div>
	</van-popup>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()
const uiStore = useUIStore()
const userStore = useUserStore()

const menuItems = [
	{ to: '/', icon: 'icon_settings_Name2', text: 'sidemenu.home', display: 'always' },
	{ to: '/market-summary', icon: 'icon_menu_Opinion', text: 'market.marketReport', display: 'always' },
	{ to: '/news', icon: 'icon_menu_Opinion', text: 'news.title', display: 'always' },
	{ to: '/records', icon: 'money', text: 'sidemenu.my_records', display: 'always' },
	{
		to: '/portfolio',
		icon: 'icon_gift',
		text: 'sidemenu.my_portfolio',
		display: 'always',
	},
	{
		to: '/companies',
		icon: 'icon_menu_Query',
		text: 'sidemenu.stock_list',
		display: 'always',
	},
	{
		to: '/m7',
		icon: 'side-bar-no1',
		text: 'sidemenu.m7',
		display: 'always',
	},
	{ to: '/market-metrics', icon: 'media', text: 'sidemenu.market_indicators', display: 'always' },
	{ to: '/volatile-stock', icon: 'icon_ghost', text: 'sidemenu.todays_volatility', display: 'always' },
	{ to: '/monte-carlo-simulation', icon: 'icon_button_system', text: 'monte-sim.menu', display: 'always' },
	{ to: '/login', icon: 'icon_user2', text: 'sidemenu.login', display: 'guest' },
	{ to: '/register', icon: 'icon_settings_invite', text: 'sidemenu.register', display: 'guest' },
]

const closeMenu = () => {
	uiStore.hideMenu()
}

const logout = async () => {
	closeMenu()
	userStore.logout()
	await navigateTo(localePath('/login'))
	window.location.reload()
}
</script>

<style scoped lang="scss"></style>
