<template>
	<van-popup :show="uiStore.isMenuShown" @update:show="uiStore.isMenuShown = $event" position="left"
		:style="{ width: 'min(84%, 20rem)', height: '100%' }" z-index="99">
		<div class="relative flex h-full flex-col overflow-hidden bg-surface-card">
			<!-- 右上角的柔光，讓整塊面板不要只是一片平面 -->
			<div class="pointer-events-none absolute -top-28 -right-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />

			<!-- 頂部：logo + 關閉 -->
			<div class="relative flex h-14 shrink-0 items-center justify-between pr-3 pl-2">
				<div class="app-logo h-10 w-22 bg-contain bg-center bg-no-repeat" style="background-image: url(/logo.webp); background-size: 130%" />
				<button type="button" :aria-label="$t('sidemenu.close')"
					class="grid size-9 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-90"
					@click="closeMenu">
					<SvgIcon name="menu_close" size="1.125rem" />
				</button>
			</div>

			<!-- 每次打開都換 key：整塊重新掛載，進場動畫才會重播，捲動位置也回到頂部 -->
			<div :key="openTick"
				class="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.25rem),transparent)] [scrollbar-width:none]">
				<!-- 帳號卡片 -->
				<NuxtLink v-if="userStore.isLogin" :to="localePath('/my')" @click="closeMenu"
					class="menu-stagger mb-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-surface p-3 transition active:scale-[0.98]"
					style="--i: 0">
					<img :src="userStore.userInfo.picture" alt=""
						class="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary/40" />
					<span class="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
						{{ userStore.userInfo.name || $t('footer.my') }}
					</span>
					<SvgIcon name="menu_chevron" size="1.125rem" class="shrink-0 text-gray-400" />
				</NuxtLink>

				<div v-else class="menu-stagger mb-3 rounded-2xl border border-gray-200 bg-surface p-3.5" style="--i: 0">
					<p class="text-[15px] font-semibold text-gray-900">{{ $t('sidemenu.guest_title') }}</p>
					<p class="mt-1 text-xs leading-relaxed text-gray-500">{{ $t('sidemenu.guest_desc') }}</p>
					<div class="mt-2.5 grid grid-cols-2 gap-2">
						<button type="button" @click="openAuth('login')"
							class="flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-br from-primary to-primary-600 py-2 text-sm font-semibold text-on-primary! shadow-sm transition active:scale-95">
							<SvgIcon name="menu_login" size="1.125rem" />
							{{ $t('sidemenu.login') }}
						</button>
						<button type="button" @click="openAuth('register')"
							class="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-surface-card py-2 text-sm font-semibold text-gray-700! transition active:scale-95">
							<SvgIcon name="menu_register" size="1.125rem" />
							{{ $t('sidemenu.register') }}
						</button>
					</div>
				</div>

				<nav class="flex flex-col gap-3">
					<section v-for="group in groups" :key="group.title">
						<h2 class="menu-stagger px-3 pb-1.5 text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase"
							:style="{ '--i': group.items[0].index }">
							{{ $t(group.title) }}
						</h2>
						<ul class="flex flex-col gap-0.5">
							<li v-for="item in group.items" :key="item.to">
								<NuxtLink :to="localePath(item.to)" @click="closeMenu"
									class="menu-stagger group relative flex items-center gap-3 rounded-xl px-3 py-1 transition-colors duration-150 active:scale-[0.98]"
									:class="isActive(item.to) ? 'bg-primary/10' : 'hover:bg-gray-50'"
									:aria-current="isActive(item.to) ? 'page' : undefined" :style="{ '--i': item.index }">
									<!-- active 指示條，貼齊面板左緣 -->
									<span v-if="isActive(item.to)"
										class="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
									<span class="grid size-8 shrink-0 place-items-center rounded-[10px] transition-colors duration-150"
										:class="isActive(item.to)
											? 'bg-primary text-on-primary shadow-sm'
											: 'bg-gray-100 text-gray-500 group-hover:text-gray-700'">
										<SvgIcon :name="item.icon" size="1.125rem" />
									</span>
									<span class="flex-1 truncate text-[15px]"
										:class="isActive(item.to) ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'">
										{{ $t(item.text) }}
									</span>
									<SvgIcon name="menu_chevron" size="1rem"
										class="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
										:class="isActive(item.to) ? 'text-primary' : 'text-gray-300'" />
								</NuxtLink>
							</li>
						</ul>
					</section>
				</nav>
			</div>

			<!-- 底部：偏好設定固定在面板最下方 -->
			<div
				class="relative shrink-0 border-t border-gray-200 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
				<h2 class="pb-2 text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
					{{ $t('sidemenu.preferences') }}
				</h2>

				<div class="flex items-center gap-2.5">
					<SvgIcon name="menu_globe" size="1.125rem" class="shrink-0 text-gray-500" />
					<span class="min-w-0 flex-1 text-sm font-medium text-gray-700">{{ $t('sidemenu.language') }}</span>
					<div class="flex w-44 min-w-0 gap-1 rounded-lg bg-gray-100 p-1">
						<NuxtLink v-for="lang in languages" :key="lang.code" :to="switchLocalePath(lang.code)"
							class="flex-1 rounded-md py-1 text-center text-[13px] transition-colors"
							:class="locale === lang.code
								? 'bg-primary font-semibold text-on-primary shadow-sm'
								: 'text-gray-500 hover:text-gray-700'" @click="closeMenu">
							{{ lang.label }}
						</NuxtLink>
					</div>
				</div>

				<div class="mt-3 flex items-center gap-2.5">
					<SvgIcon name="menu_palette" size="1.125rem" class="shrink-0 text-gray-500" />
					<span class="min-w-0 flex-1 text-sm font-medium text-gray-700">{{ $t('sidemenu.theme') }}</span>
					<div class="w-44 min-w-0">
						<ThemeSelector />
					</div>
				</div>

				<button v-if="userStore.isLogin" type="button"
					class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500 transition active:scale-[0.98]"
					@click="logout">
					<SvgIcon name="menu_logout" size="1.125rem" />
					{{ $t('sidemenu.logout') }}
				</button>
			</div>
		</div>
	</van-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

interface MenuItem {
	to: string
	icon: string
	text: string
}

const route = useRoute()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()
const uiStore = useUIStore()
const userStore = useUserStore()
const authModal = useAuthModal()

const menuGroups: { title: string; items: MenuItem[] }[] = [
	{
		title: 'sidemenu.section_market',
		items: [
			{ to: '/', icon: 'footer_home', text: 'sidemenu.home' },
			{ to: '/market-summary', icon: 'menu_report', text: 'market.marketReport' },
			{ to: '/news', icon: 'footer_info', text: 'news.title' },
			{ to: '/companies', icon: 'menu_stocks', text: 'sidemenu.stock_list' },
			{ to: '/m7', icon: 'menu_m7', text: 'sidemenu.m7' },
			{ to: '/market-metrics', icon: 'menu_metrics', text: 'sidemenu.market_indicators' },
			{ to: '/volatile-stock', icon: 'menu_volatility', text: 'sidemenu.todays_volatility' },
		],
	},
	{
		title: 'sidemenu.section_mine',
		items: [
			{ to: '/records', icon: 'menu_records', text: 'sidemenu.my_records' },
			{ to: '/portfolio', icon: 'footer_portfolio', text: 'sidemenu.my_portfolio' },
		],
	},
	{
		title: 'sidemenu.section_tools',
		items: [{ to: '/monte-carlo-simulation', icon: 'menu_simulation', text: 'monte-sim.menu' }],
	},
]

// 進場動畫的階梯延遲：帳號卡片是 0，之後每個標題／項目依序 +1
const groups = computed(() => {
	let index = 1
	return menuGroups.map((group) => ({
		title: group.title,
		items: group.items.map((item) => ({ ...item, index: index++ })),
	}))
})

const languages = [
	{ code: 'zh', label: '中文' },
	{ code: 'en', label: 'English' },
] as const

const openTick = ref(0)
watch(
	() => uiStore.isMenuShown,
	(shown) => {
		if (shown) openTick.value++
	},
)

// 頁面檔名有大寫（M7.vue、Portfolio.vue），路徑一律轉小寫、去掉結尾斜線再比
const normalize = (path: string) => path.toLowerCase().replace(/\/+$/, '') || '/'

// 去掉語系前綴（/zh/portfolio → /portfolio）
const currentPath = computed(() => {
	const path = normalize(route.path)
	const prefix = normalize(localePath('/'))
	if (prefix === '/' || (path !== prefix && !path.startsWith(`${prefix}/`))) return path
	return path.slice(prefix.length) || '/'
})

// 首頁只有完全相同才算，否則所有頁面都會匹配 `/`
const isActive = (to: string) =>
	to === '/' ? currentPath.value === '/' : currentPath.value === to || currentPath.value.startsWith(`${to}/`)

const closeMenu = () => {
	uiStore.hideMenu()
}

const openAuth = (mode: AuthMode) => {
	closeMenu()
	authModal.open(mode)
}

const logout = async () => {
	closeMenu()
	await userStore.logout()
	await navigateTo(localePath('/'))
	window.location.reload()
}
</script>

<style scoped>
.menu-stagger {
	animation: menu-in 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	animation-delay: calc(var(--i, 0) * 28ms + 60ms);
}

@keyframes menu-in {
	from {
		opacity: 0;
		transform: translateX(-12px);
	}

	to {
		opacity: 1;
		transform: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.menu-stagger {
		animation: none;
	}
}
</style>
