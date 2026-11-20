/**
 * BFF proxy — 我的卡包狀態：今天還剩幾包、抽卡紀錄。需要登入，token 由 apiFetch 從 cookie 帶上。
 */
export default defineEventHandler((event) => cardPackFetch(event, 'GET', '/me'))
