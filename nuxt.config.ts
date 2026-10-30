const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import tailwindcss from '@tailwindcss/vite'
const API_BASE_URL = process.env.VITE_API_URL
const KV_URL = process.env.VITE_KV_HOST
const WEB_DOMAIN = process.env.WEB_DOMAIN

const generateBlogPostsPlugin = (lang: string) => {
	return {
		name: 'generate-blog-posts',
		async buildStart() {
			// @ts-ignore
			const blogPosts: BlogPost[] = []
			const postsDirectory = path.join(process.cwd(), 'blogs', 'info', lang)
			const files = await fs.promises.readdir(postsDirectory)

			for (const file of files) {
				if (file.endsWith('.md')) {
					const filePath = path.join(postsDirectory, file)
					const fileContent = await fs.promises.readFile(filePath, 'utf-8')

					const { data: meta, content } = matter(fileContent)

					const id = file.replace('.md', '')
					blogPosts.push({
						id,
						title: meta.title || id,
						htmlContent: content,
						excerpt: meta.excerpt,
						image: meta.image || '',
						publishDate: meta.publishDate,
						author: meta.author,
						categories: meta.categories,
						tags: meta.tags,
					})
				}
			}
			fs.writeFileSync(
				path.join(process.cwd(), 'server/data/', `blog-posts-${lang}.json`),
				JSON.stringify(blogPosts, null, 2)
			)
		},
	}
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: false },

	nitro: {
		preset: 'cloudflare-pages',

		cloudflare: {
			deployConfig: true,
			nodeCompat: true,
		},
	},

	modules: [
		'nitro-cloudflare-dev',
		'@nuxtjs/i18n',
		'@pinia/nuxt',
		'@vant/nuxt',
		'@vueuse/nuxt',
		'./modules/nuxt4-lodash',
		'@nuxtjs/sitemap',
		[
			'nuxt-vue3-google-signin',
			{
				clientId: GOOGLE_CLIENT_ID,
			},
		],
	],
	site: {
		url: WEB_DOMAIN
	},
	i18n: {
		locales: [
			{ code: 'en', file: 'en.json', language: 'en-US' },
			{ code: 'zh', file: 'zh-TW.json', language: 'zh-TW' },
		],
		defaultLocale: 'en',
		strategy: 'prefix_except_default',
		detectBrowserLanguage: false,
	},
	devServer: {
		port: 5177,
	},
	vant: {
		lazyload: true,
		importStyle: true,
	},
	lodash4: {
		prefix: '_',
		upperAfterPrefix: false,
	},
	app: {
		baseURL: '/',
	},
	vite: {
		vue: {
			script: {
				defineModel: true,
			},
		},
		plugins: [tailwindcss(), generateBlogPostsPlugin('zh'), generateBlogPostsPlugin('en')],
		base: '/',
		build: {
			assetsDir: '_nuxt',
		},
	},
	typescript: {
		tsConfig: {
			compilerOptions: {
				module: 'esnext',
			},
		},
	},
	css: ['./app/assets/main.css'],
	ssr: true,
	routeRules: (() => {
		// 純 CSR 路由(不需要 SEO,登入態相關頁面)
		const csrRoutes = [
			'/add-transaction',
			'/m7',
			'/my',
			'/portfolio',
			'/records',
			'/market-metrics',
		]

		// 有 swr 快取的路由
		const swrRoutes: Record<string, number | boolean> = {
			'/market-summary': 3600,
			'/companies': 3600,
			'/volatile-stock': true,
		}

		const rules: Record<string, any> = {
			'/posts/**': { prerender: true },
			'/zh/posts/**': { prerender: true },
			'/': { swr: 300 },
			'/zh': { swr: 300 },
			// 登入／註冊改成彈窗，舊網址導回首頁並開彈窗（plugins/authModalFromQuery.client.ts 接手）
			'/login': { redirect: { to: '/?auth=login', statusCode: 302 } },
			'/zh/login': { redirect: { to: '/zh?auth=login', statusCode: 302 } },
			'/register': { redirect: { to: '/?auth=register', statusCode: 302 } },
			'/zh/register': { redirect: { to: '/zh?auth=register', statusCode: 302 } },
		}

		// 補齊 CSR 路由(en 無前綴 + zh 加 /zh 前綴)
		for (const route of csrRoutes) {
			rules[route] = { ssr: false }
			rules[`/zh${route}`] = { ssr: false }
		}

		// 補齊 swr 路由
		for (const [route, value] of Object.entries(swrRoutes)) {
			rules[route] = { swr: value }
			rules[`/zh${route}`] = { swr: value }
		}

		return rules
	})(),
	runtimeConfig: {
		kvUrl: KV_URL,
		apiBaseUrl: API_BASE_URL,
		public: {
			isProduction: !import.meta.dev
		}
	}
})
