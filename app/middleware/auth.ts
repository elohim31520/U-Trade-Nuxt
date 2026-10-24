import { useUserStore } from '@/stores/user'

/**
 * 需要登入的頁面在 definePageMeta({ middleware: 'auth' }) 掛上這支。
 * 未登入不做頁面跳轉，改成拉起登入彈窗：
 *  - 站內點進來：取消這次導覽，使用者停在原頁，彈窗蓋在上面
 *  - 第一次進站（直接輸入網址／重新整理）：沒有原頁可停，導去首頁再開彈窗
 */
export default defineNuxtRouteMiddleware(async () => {
	const { isAuthenticated } = useAuth()
	if (isAuthenticated.value) return

	const home = useLocalePath()('/')

	// SSR 的 useState 不會帶到 client，靠 ?auth=login 讓 plugins/authModalFromQuery.client.ts 補開彈窗
	if (import.meta.server) {
		return navigateTo({ path: home, query: { auth: 'login' } })
	}

	// 第一次進站時 from 就是目前這個網址（Nuxt 會在 app:created 強制重跑一次初始導覽），
	// 所以不能靠 from 判斷，要看是否還在 hydrate
	const isFirstNavigation = useNuxtApp().isHydrating

	// token 放在 httpOnly cookie，client 讀不到；CSR 頁面重新整理時 isAuthenticated 只是預設值 false，
	// 第一次導覽先問 BFF 一次確認，避免已登入的人被擋掉
	if (isFirstNavigation) {
		await useUserStore().fetchMe()
		if (isAuthenticated.value) return
	}

	useAuthModal().open('login')
	return isFirstNavigation ? navigateTo(home) : abortNavigation()
})
