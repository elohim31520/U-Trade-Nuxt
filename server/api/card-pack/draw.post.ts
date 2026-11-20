/**
 * BFF proxy — 拆一包。需要登入；抽哪一張、次數、排除已抽過的卡都由後端決定，前端只拿結果。
 * 上游的狀態碼會原樣回來：503 卡池準備中、429 今天次數用完、409 上一包還在處理中。
 */
export default defineEventHandler((event) => cardPackFetch(event, 'POST', '/draw'))
