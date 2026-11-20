/**
 * 需要 auth 的請求統一走 BFF（/api/*）。
 * Client 只傳 cookie，token 注入由 server/api/ 層處理，不再外露到 client JS。
 *
 * 對應的 server route 格式：/server/api/<resource>.ts
 */

import type { ResponseData } from '~/types/api'
import type { BalanceInfo } from '~/types/balance'
import { createFetchHandlers } from '~/utils/fetchHandlers'
import type { CardPackDrawResult, CardPackMe, CardPackToday } from '~/types/cardPack'
import type { MomentumResult } from '~/types/marketSnapshots'
import type { PortfolioItem, NewPortfolio } from '~/types/portfolio'
import type { StockMetrics } from '~/types/stockMetrics'
import type { AnalyzeScreenshotRes } from '~/types/trade'

// baseURL 指向 Nuxt server routes（/api/...），走同源請求，cookie 自動帶入。

export default defineNuxtPlugin((nuxtApp) => {
    const client = $fetch.create({
        baseURL: '/api',
        timeout: 30000,
        credentials: 'include', // 確保 cookie 帶出去
        ...createFetchHandlers({ handle401: true, nuxtApp }),
    })

    return {
        provide: {
            bffApi: {
                // ── balance ──────────────────────────────────────────────
                getMyBalances: () =>
                    client<ResponseData<BalanceInfo>>('/balance'),
                createMyBalances: (params: BalanceInfo) =>
                    client<ResponseData<BalanceInfo>>('/balance', { method: 'POST', body: params }),
                updateMyBalances: (params: BalanceInfo) =>
                    client<ResponseData<BalanceInfo>>('/balance', { method: 'PUT', body: params }),

                // ── market（需 auth）─────────────────────────────────────
                getMomentum: () =>
                    client<ResponseData<MomentumResult[]>>('/market/momentum'),
                getMarketWeights: () =>
                    client<ResponseData<Record<string, number>[]>>('/market/weights'),
                /** days 非 1 / 3 時需要 auth，走 BFF；1 / 3 天請走 publicKv */
                getMomentumByRange: (days: number) =>
                    client<ResponseData<MomentumResult[]>>(`/market/momentum/range/${days}`),

                // ── company-metrics（非熱門公司需 auth）──────────────────
                /** 熱門公司請走 publicKv；其餘公司要登入，由 BFF 帶 cookie token 給 KV worker */
                getStatementBySymbol: (symbol: string, days: number) =>
                    client<ResponseData<StockMetrics>>(`/company-metrics/${symbol}`, { query: { days } }),

                // ── portfolio ─────────────────────────────────────────────
                getPortfolios: () =>
                    client<ResponseData<PortfolioItem[]>>('/portfolio'),
                createPortfolio: (params: NewPortfolio) =>
                    client<ResponseData<null>>('/portfolio', { method: 'POST', body: params }),
                updatePortfolio: (params: NewPortfolio) =>
                    client<ResponseData<null>>('/portfolio', { method: 'PUT', body: params }),
                deletePortfolio: (id: string | number) =>
                    client<ResponseData<null>>(`/portfolio/${id}`, { method: 'DELETE' }),

                // ── trade ─────────────────────────────────────────────────
                getTrades: (params?: Record<string, any>) =>
                    client<ResponseData<any>>('/trade', { query: params }),
                getTradeById: (id: string | number) =>
                    client<ResponseData<any>>(`/trade/${id}`),
                createTrade: (params: any) =>
                    client<ResponseData<any>>('/trade', { method: 'POST', body: params }),
                bulkCreateTrades: (params: any) =>
                    client<ResponseData<any>>('/trade/bulk', { method: 'POST', body: params }),
                updateTrade: (id: string | number, params: any) =>
                    client<ResponseData<any>>(`/trade/${id}`, { method: 'PUT', body: params }),
                deleteTrade: (id: string | number) =>
                    client<ResponseData<any>>(`/trade/${id}`, { method: 'DELETE' }),
                /** 截圖辨識：傳 FormData，由 server route 轉 multipart 轉發 */
                analyzeScreenshot: (formData: FormData) =>
                    client<ResponseData<AnalyzeScreenshotRes>>('/trade/analyze-screenshot', {
                        method: 'POST',
                        body: formData,
                    }),
                getAIJobStatus: (jobId: string) =>
                    client<ResponseData<any>>(`/trade/ai-job/${jobId}`),

                // ── card-pack（抽卡需登入）────────────────────────────────
                /** 卡池好了沒、今日異動（跑馬燈）；沒有抽卡內容 */
                getCardPackToday: () =>
                    client<ResponseData<CardPackToday>>('/card-pack/today'),
                /** 今天還剩幾包、抽卡紀錄 */
                getCardPackMe: () =>
                    client<ResponseData<CardPackMe>>('/card-pack/me'),
                /** 拆一包：後端決定抽哪張、扣次數。503 準備中、429 次數用完、409 上一包處理中 */
                drawCardPack: () =>
                    client<ResponseData<CardPackDrawResult>>('/card-pack/draw', { method: 'POST' }),
                /** 開發環境限定：重設自己的次數與紀錄 */
                resetCardPack: () =>
                    client<ResponseData<null>>('/card-pack/dev/reset', { method: 'POST' }),

                // ── user（需 auth 的部分）────────────────────────────────
                /** login / google-login / logout / me 各自有 specific server route，不在此列 */
                changePassword: (params: any) =>
                    client<ResponseData<any>>('/user/password', { method: 'POST', body: params }),
                isLogin: () =>
                    client<ResponseData<boolean>>('/user/is-login'),
            },
        },
    }
})