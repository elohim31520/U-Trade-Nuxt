<template>
	<div class="flex w-full flex-col gap-4 p-4 text-gray-900">
		<header class="flex flex-col gap-1">
			<h1 class="text-xl font-bold">three.js Lab</h1>
			<p class="text-sm text-gray-500">
				學習與 demo 用頁面。只在
				<code class="font-mono">nuxt dev</code>
				存在，正式建置不會包含。 新增 demo 的方式見
				<code class="font-mono">app/utils/threeLab/registry.ts</code>
				。
			</p>
		</header>

		<nav class="flex flex-wrap gap-2" aria-label="demo 清單">
			<button
				v-for="(demo, index) in DEMOS"
				:key="demo.id"
				type="button"
				class="rounded-md border px-3 py-1.5 text-sm transition-colors"
				:class="
					demo.id === current.id
						? 'border-primary bg-primary text-on-primary'
						: 'border-gray-200 bg-surface-card text-gray-600 hover:border-gray-300'
				"
				:aria-current="demo.id === current.id ? 'page' : undefined"
				@click="selectDemo(demo.id)"
			>
				<span class="font-mono text-xs opacity-70">{{ String(index + 1).padStart(2, '0') }}</span>
				{{ demo.title }}
			</button>
		</nav>

		<section class="flex min-w-0 flex-col gap-3">
			<div ref="hostEl" class="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
				<canvas ref="canvasEl" class="absolute inset-0 size-full touch-none" />
				<p v-if="error" class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-400">
					{{ error }}
				</p>
			</div>
			<p class="min-h-6 text-sm text-gray-500" aria-live="polite">{{ status }}</p>

			<div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-surface-card p-4">
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-bold">參數</h2>
					<button
						type="button"
						class="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-gray-300"
						@click="resetParams"
					>
						重設
					</button>
				</div>
				<p v-if="!current.controls.length" class="text-sm text-gray-500">這個 demo 沒有參數。</p>
				<label v-for="control in current.controls" :key="control.key" class="flex items-center gap-3 text-sm">
					<span class="w-28 shrink-0 text-gray-500">{{ control.label }}</span>
					<template v-if="control.type === 'range'">
						<input
							v-model.number="params[control.key]"
							type="range"
							class="min-w-0 flex-1 accent-primary"
							:min="control.min"
							:max="control.max"
							:step="control.step"
						/>
						<span class="w-14 text-right font-mono text-xs">{{ params[control.key] }}</span>
					</template>
					<input
						v-else-if="control.type === 'color'"
						v-model="params[control.key]"
						type="color"
						class="h-7 w-12 cursor-pointer rounded border border-gray-200 bg-transparent"
					/>
					<input v-else v-model="params[control.key]" type="checkbox" class="size-4 accent-primary" />
				</label>
			</div>
		</section>

		<aside class="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-surface-card">
			<div class="flex gap-1 border-b border-gray-200 p-2" role="tablist">
				<button
					v-for="item in TABS"
					:key="item.key"
					type="button"
					role="tab"
					class="rounded-md px-3 py-1 text-sm"
					:class="tab === item.key ? 'bg-gray-100 text-gray-900' : 'text-gray-500'"
					:aria-selected="tab === item.key"
					@click="tab = item.key"
				>
					{{ item.label }}
				</button>
			</div>

			<div v-if="tab === 'guide'" class="flex flex-col gap-3 p-4">
				<h2 class="text-lg font-bold">{{ current.title }}</h2>
				<p class="text-sm text-gray-600">{{ current.summary }}</p>
				<h3 class="text-sm font-bold">學習重點</h3>
				<ul class="flex list-disc flex-col gap-2 pl-5 text-sm text-gray-600">
					<li v-for="concept in current.concepts" :key="concept">{{ concept }}</li>
				</ul>
				<p class="text-xs text-gray-500">滑鼠左鍵拖曳旋轉、滾輪縮放、右鍵拖曳平移。</p>
			</div>

			<pre
				v-else
				class="max-h-160 overflow-auto p-4 font-mono text-xs leading-relaxed text-gray-600"
			><code>{{ source || '載入中…' }}</code></pre>
		</aside>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
	import { DEMOS, loadDemoSource } from '@/utils/threeLab/registry'
	import { createLab } from '@/utils/threeLab/runner'
	import type { Lab } from '@/utils/threeLab/runner'
	import type { Params } from '@/utils/threeLab/types'

	// 這頁只在 nuxt dev 存在（見 nuxt.config.ts 的 pages:extend），不需要登入
	usePageSeo({ title: 'three.js Lab', robots: 'noindex' })

	const TABS = [
		{ key: 'guide', label: '說明' },
		{ key: 'source', label: '原始碼' },
	] as const

	const route = useRoute()
	const router = useRouter()

	// 目前的 demo 記在網址 ?demo=<id>：重新整理、HMR 後都會停在同一個
	const current = computed(() => DEMOS.find((demo) => demo.id === route.query.demo) ?? DEMOS[0]!)

	// 整個頁面只有這一份 params 物件，demo 在 setup 時拿到的就是它；
	// 切換 demo 時是清空再填入新的預設值，不能換成新物件
	const params = reactive<Params>({})
	const status = ref('')
	const tab = ref<(typeof TABS)[number]['key']>('guide')
	const source = ref('')
	const error = ref('')
	const hostEl = ref<HTMLElement>()
	const canvasEl = ref<HTMLCanvasElement>()
	let lab: Lab | undefined

	function selectDemo(id: string) {
		router.replace({ query: { ...route.query, demo: id } })
	}

	function resetParams() {
		for (const key of Object.keys(params)) Reflect.deleteProperty(params, key)
		for (const control of current.value.controls) params[control.key] = control.value
	}

	async function loadSource() {
		const { id } = current.value
		source.value = ''
		const text = await loadDemoSource(id)
		// 載入期間又切到別的 demo 的話，丟掉這份過期的結果
		if (id === current.value.id) source.value = text
	}

	function mountDemo() {
		resetParams()
		lab?.load(current.value, params)
		void loadSource()
	}

	watch(current, mountDemo)

	onMounted(() => {
		try {
			lab = createLab(canvasEl.value!, hostEl.value!, (text) => (status.value = text))
		} catch {
			// 沒有 WebGL（例如瀏覽器停用硬體加速）時 new WebGLRenderer 會丟錯
			error.value = '無法建立 WebGL，請確認瀏覽器已開啟硬體加速。'
			return
		}
		mountDemo()
	})

	onBeforeUnmount(() => lab?.destroy())
</script>
