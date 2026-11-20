import type { H3Event } from 'h3'

/**
 * 卡包的上游請求（/card-pack/*）。
 *
 * 跟一般的 apiFetch 差在錯誤處理：上游的狀態碼要原樣交給前端
 * （503 卡池準備中、429 今天次數用完、409 上一包還在處理中，前端靠狀態碼分辨），
 * 訊息則用上游回的中文訊息，不要讓 FetchError 把上游網址帶進回應。
 */
export async function cardPackFetch(event: H3Event, method: 'GET' | 'POST', path: string) {
	try {
		return await apiFetch(event, method, `/card-pack${path}`)
	} catch (err: any) {
		throw createError({
			statusCode: err?.statusCode ?? err?.status ?? 502,
			message: err?.data?.message ?? '卡包服務暫時無法使用',
		})
	}
}
