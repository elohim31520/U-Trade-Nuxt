<template>
	<nav
		class="fixed inset-x-0 bottom-0 z-50 mx-auto grid w-full max-w-[480px] grid-cols-5 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] backdrop-blur-md">
		<!-- 中間往下凹的底板：圖形用 preserveAspectRatio="none" 跟著 nav 寬高縮放 -->
		<svg class="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 390 64"
			preserveAspectRatio="none" aria-hidden="true" focusable="false">
			<path class="fill-surface-card"
				d="M0,0 L151,0 C176,0 183,30 195,30 C207,30 214,0 239,0 L390,0 L390,64 L0,64 Z" />
			<path class="fill-none stroke-1 stroke-gray-200" vector-effect="non-scaling-stroke"
				d="M0,0 L151,0 C176,0 183,30 195,30 C207,30 214,0 239,0 L390,0" />
		</svg>

		<NuxtLink v-for="item in tabItems" :key="item.to" :to="localePath(item.to)"
			class="relative flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold"
			:class="[
				item.center ? '-mt-5.5 text-gray-500' : isActive(item) ? 'text-accent-2' : 'text-gray-500',
			]">
			<span v-if="isActive(item) && !item.center"
				class="absolute inset-x-1/5 top-0 h-0.5 rounded-full bg-linear-to-r from-accent to-accent-2 shadow-nav-active" />
			<span v-if="item.center"
				class="grid h-11.5 w-11.5 place-items-center rounded-full border-3 border-surface-card bg-linear-to-br from-accent to-accent-2 text-on-primary shadow-nav-home">
				<SvgIcon size="1.375rem" :name="item.icon" />
			</span>
			<SvgIcon v-else size="1.375rem" :name="item.icon" />
			<span>{{ $t(item.label) }}</span>
		</NuxtLink>
	</nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import SvgIcon from '@/components/SvgIcon/index.vue'

interface FooterTab {
	label: string
	to: string
	icon: string
	/** 中間凸起的圓形按鈕，不套用 active 配色 */
	center?: boolean
	/** 預設只有 `to` 本身（含子路徑）算 active；文章內頁 /post/:id 要一併讓「資訊」亮 */
	matches?: string[]
	/** 只有完全相同的路徑才算 active（首頁，否則所有頁面都會匹配 `/`） */
	exact?: boolean
}

const route = useRoute()
const localePath = useLocalePath()

const tabItems: FooterTab[] = [
	{ label: 'footer.info', to: '/posts', icon: 'footer_info', matches: ['/posts', '/post'] },
	{ label: 'footer.portfolio', to: '/portfolio', icon: 'footer_portfolio' },
	{ label: 'footer.home', to: '/', icon: 'footer_home', center: true, exact: true },
	{ label: 'footer.record', to: '/add-transaction', icon: 'footer_record' },
	{ label: 'footer.my', to: '/my', icon: 'footer_my' },
]

// Nuxt 的頁面檔名有大寫（My.vue、Portfolio.vue），路徑一律轉小寫、去掉結尾斜線再比
const normalize = (path: string) => path.toLowerCase().replace(/\/+$/, '') || '/'

// 去掉語系前綴（/zh/portfolio → /portfolio），不能對 /post 這種沒有對應頁面的路徑呼叫 localePath（會噴 router warn）
const currentPath = computed(() => {
	const path = normalize(route.path)
	const prefix = normalize(localePath('/'))
	if (prefix === '/' || (path !== prefix && !path.startsWith(`${prefix}/`))) return path
	return path.slice(prefix.length) || '/'
})

function isActive(item: FooterTab) {
	if (item.exact) return currentPath.value === item.to

	return (item.matches ?? [item.to]).some(
		(base) => currentPath.value === base || currentPath.value.startsWith(`${base}/`),
	)
}
</script>
