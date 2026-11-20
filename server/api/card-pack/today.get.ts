/**
 * BFF proxy — 卡包今日資訊：卡池好了沒、今日異動（跑馬燈）。上游是公開端點，沒有抽卡內容。
 */
export default defineEventHandler((event) => cardPackFetch(event, 'GET', '/today'))
