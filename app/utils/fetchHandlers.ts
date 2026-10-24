/**
 * 共用 $fetch handler factory
 *
 * 消除 bff / publicApi / publicKv 三處重複的 onResponse / onResponseError。
 * bff 額外需要 401 處理，透過 handle401 option 啟用。
 */

import { showNotify } from 'vant'

interface CreateHandlersOptions {
    /** 啟用後：401 response 自動清 token / redirect */
    handle401?: boolean;
    /** 錯誤訊息 fallback，用於區分來源（debug 用） */
    errorFallback?: string;
    nuxtApp?: {
        runWithContext: <T>(fn: () => T) => T | Promise<T>
    }
}

export function createFetchHandlers(options: CreateHandlersOptions = {}) {
    const { handle401 = false, errorFallback = '請求失敗', nuxtApp } = options

    return {
        onResponse({ response }: any) {
            let res = response._data

            if (typeof res === 'string') {
                try {
                    res = JSON.parse(res)
                    response._data = res
                } catch {
                    throw new Error('無效的響應格式')
                }
            }

            if (typeof res?.success === 'boolean' && !res.success) {
                const message = res.message || '操作失敗'
                if (import.meta.client) {
                    showNotify({ message, background: '#ef4444', color: '#fff' })
                }
                throw new Error(message)
            }
        },

        onResponseError({ response }: any) {
            const message =
                response._data?.message || response._data?.error || errorFallback

            if (import.meta.client) {
                showNotify({ message, background: '#ef4444', color: '#fff' })
            }
            console.log('onResponseError 這裡發生錯誤', response);

            if (handle401 && response.status === 401) {
                const redirect = () => {
                    if (import.meta.client) {
                        const { logout } = useAuth()
                        logout()
                    } else {
                        navigateTo({ path: useLocalePath()('/'), query: { auth: 'login' } })
                    }
                }
                if (nuxtApp) {
                    nuxtApp.runWithContext(redirect)
                } else {
                    redirect() // fallback，理論上不該走到這裡
                }
            }
        },
    }
}