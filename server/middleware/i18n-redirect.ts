export default defineEventHandler((event) => {
    const { pathname: path, search } = getRequestURL(event)

    // 只在使用者打裸域名(根路径)时判断,其他页面维持原本语系不介入
    if (path !== '/') return

    const acceptLanguage = getHeader(event, 'accept-language') || ''
    const prefersZh = /zh(-TW|-Hant)?/i.test(acceptLanguage)

    if (prefersZh) {
        return sendRedirect(event, `/zh/${search}`, 302)
    }
    // 不是中文就维持 en,什么都不用做
})