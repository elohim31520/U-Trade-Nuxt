/**
 * 承接 middleware/auth.ts 與舊 /login、/register 網址的導向：
 * SSR／整頁重新整理時 useState 不會跨請求保留，靠 ?auth=login|register 把「要開彈窗」的意圖
 * 帶到新頁面，這裡在 client 補開並把 query 清掉。
 *
 * 清 query 要等 app:mounted：Nuxt 在 app:created 會拿原始網址 force replace 一次初始路由，
 * 太早清會被蓋回來。
 */
export default defineNuxtPlugin((nuxtApp) => {
	const route = useRoute()
	const mode = route.query.auth
	if (mode !== 'login' && mode !== 'register') return

	useAuthModal().open(mode)

	const router = useRouter()
	nuxtApp.hooks.hookOnce('app:mounted', () => {
		const { auth: _auth, ...query } = route.query
		router.replace({ path: route.path, query, hash: route.hash })
	})
})
