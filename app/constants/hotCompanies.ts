export interface HotCompany {
	/** 小寫代號，同時是路由參數與 logo 檔名 */
	id: string
	name: string
	/** logo 放在 /logo/{id}.svg；否則用 /hot/{id}.webp */
	useLogoPath?: boolean
}

/**
 * 「探索熱門公司」顯示的清單，同時也是 company-metrics 頁的免登入名單：
 * 這些公司可直接看 K 線＋財務指標，其餘公司只開放 K 線，指標要登入。
 */
export const HOT_COMPANY_LIST: HotCompany[] = [
	{ id: 'spcx', name: 'SpaceX', useLogoPath: true },
	{ id: 'sndk', name: 'Sandisk', useLogoPath: true },
	{ id: 'mu', name: 'Micron', useLogoPath: true },
	{ id: 'cohr', name: 'Coherent', useLogoPath: true },
	{ id: 'lite', name: 'Lumentum', useLogoPath: true },
	{ id: 'tsm', name: 'TSMC', useLogoPath: true },
	{ id: 'amd', name: 'AMD', useLogoPath: true },
	{ id: 'mstr', name: 'Strategy', useLogoPath: true },
	{ id: 'hood', name: 'Robinhood', useLogoPath: true },
	{ id: 'vst', name: 'Vistra', useLogoPath: true },
	{ id: 'app', name: 'AppLovin', useLogoPath: true },
	{ id: 'sofi', name: 'SoFi', useLogoPath: true },
	{ id: 'avgo', name: 'Broadcom', useLogoPath: true },
	{ id: 'crwv', name: 'CoreWeave', useLogoPath: true },
	{ id: 'oklo', name: 'Oklo', useLogoPath: true },
	{ id: 'tsla', name: 'Tesla' },
	{ id: 'nvda', name: 'NVIDIA' },
	{ id: 'pltr', name: 'Palantir' },
	{ id: 'amzn', name: 'Amazon' },
	{ id: 'goog', name: 'Alphabet' },
	{ id: 'meta', name: 'Meta' },
	{ id: 'msft', name: 'Microsoft' },
	{ id: 'aapl', name: 'Apple', useLogoPath: true },
]

/** 大寫代號，給 company-metrics 判斷是否免登入 */
export const HOT_COMPANIES = HOT_COMPANY_LIST.map((c) => c.id.toUpperCase())
