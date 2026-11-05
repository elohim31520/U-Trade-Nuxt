/**
 * BFF — 非熱門公司的財務指標（需登入）。
 *
 * token 放在 httpOnly cookie，瀏覽器沒辦法直接帶 Authorization 去打跨網域的 KV worker，
 * 所以由這裡從 cookie 取 token，再轉發給 KV worker；是否放行由 worker 的 metricsAccess 決定。
 * 熱門公司是公開資料，client 直接打 publicKv，不走這裡。
 */

// 代號只會是英數、點、減號（例如 BRK.B）；擋掉 ../ 之類會改變上游路徑的字元
const SYMBOL_PATTERN = /^[A-Za-z0-9.-]{1,10}$/

// 與 KV worker 的 CACHE_TTL 一致（20 小時）：指標一天才更新一次
const CACHE_SECONDS = 3600 * 20

export default defineEventHandler(async (event) => {
	const symbol = getRouterParam(event, 'symbol') ?? ''
	if (!SYMBOL_PATTERN.test(symbol)) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid symbol' })
	}

	const config = useRuntimeConfig()
	const token = getCookie(event, 'user_token')
	const rawQuery = getRequestURL(event).search

	const data = await $fetch(`${config.kvUrl}/company-metrics/${symbol}${rawQuery}`, {
		method: 'GET',
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	})

	// BFF 回應預設不帶 Cache-Control，瀏覽器每次重看都會再來打一次 worker（多一次 KV 讀取）。
	// 這份資料要登入才拿得到，所以用 private：只讓使用者自己的瀏覽器快取，共用快取不能存。
	// 放在成功之後才設，401 等錯誤回應不會被快取。
	setHeader(event, 'Cache-Control', `private, max-age=${CACHE_SECONDS}`)

	return data
})
