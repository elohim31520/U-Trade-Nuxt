/**
 * BFF proxy — 重設自己的次數與抽卡紀錄，只在開發環境提供。
 * 上游的 /card-pack/dev/reset 在 production 也沒有註冊，這裡再擋一次，正式站直接 404。
 */
export default defineEventHandler((event) => {
	if (!import.meta.dev) throw createError({ statusCode: 404, message: 'Not Found' })
	return cardPackFetch(event, 'POST', '/dev/reset')
})
