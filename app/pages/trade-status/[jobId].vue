<template>
	<div class="px-4 pb-8 pt-5">
		<header class="mb-4 px-1">
			<h1 class="text-sm font-bold uppercase tracking-widest">{{ $t('trade_status.title') }}</h1>
		</header>

		<!-- 載入中：與正式內容同結構的骨架屏 -->
		<div v-if="!job" class="flex flex-col gap-4" aria-hidden="true">
			<section class="rounded-3xl border border-gray-100 bg-surface-card px-5 pb-6 pt-8 shadow-card-primary">
				<div class="flex flex-col items-center">
					<span class="animate-gray size-24 rounded-full" />
					<span class="animate-gray mt-5 block h-5 w-28 rounded-md" />
					<span class="animate-gray mt-2.5 block h-3.5 w-48 rounded-md" />
				</div>
				<div class="mt-8 flex justify-between px-6">
					<span v-for="n in 3" :key="n" class="animate-gray size-7 rounded-full" />
				</div>
			</section>
			<section class="rounded-2xl border border-gray-100 bg-surface-card px-4 py-4">
				<span class="animate-gray block h-3 w-20 rounded-md" />
				<span v-for="n in 3" :key="n" class="animate-gray mt-4 block h-4 w-full rounded-md" />
			</section>
		</div>

		<div v-else class="flex flex-col gap-4">
			<!-- 狀態主卡：光暈 + 圓環狀態圖 + 三段進度 -->
			<section
				class="animate-row-in motion-reduce:animate-none relative overflow-hidden rounded-3xl border border-gray-100 bg-surface-card px-5 pb-6 pt-8 shadow-card-primary"
			>
				<span
					aria-hidden="true"
					class="pointer-events-none absolute -top-20 left-1/2 size-60 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700"
					:class="tone.glow"
				/>

				<div class="relative flex flex-col items-center text-center">
					<!-- 狀態圖：底圈永遠在，處理中多一段旋轉弧線與向外擴散的光圈，完成／失敗只閃一次 -->
					<div class="relative grid size-24 place-items-center" :class="tone.text">
						<span aria-hidden="true" class="absolute inset-0 rounded-full border-[3px] border-current opacity-15" />
						<template v-if="status === 'pending'">
							<span
								v-for="delay in ['0s', '1.2s']"
								:key="delay"
								aria-hidden="true"
								class="absolute inset-1 animate-ring-pulse rounded-full border-[1.5px] border-current opacity-0 motion-reduce:animate-none"
								:style="{ animationDelay: delay }"
							/>
							<span
								aria-hidden="true"
								class="absolute inset-0 animate-spin rounded-full bg-conic from-transparent from-30% to-current mask-[radial-gradient(farthest-side,transparent_calc(100%_-_3px),#000_calc(100%_-_3px))] motion-reduce:animate-none"
							/>
						</template>
						<span
							v-else
							aria-hidden="true"
							class="absolute inset-1 animate-ring-burst rounded-full border-2 border-current opacity-0 motion-reduce:animate-none"
						/>

						<span
							:key="status"
							class="relative grid size-18 place-items-center rounded-full motion-reduce:animate-none"
							:class="[tone.disc, status === 'failed' ? 'animate-shake' : 'animate-pop']"
						>
							<span
								v-if="status === 'pending'"
								class="text-[22px] font-black leading-none tracking-wider text-on-primary"
							>
								AI
							</span>
							<SvgIcon v-else-if="status === 'success'" name="icon_check" size="34px" class="text-on-primary" />
							<SvgIcon v-else name="icon_close" size="26px" class="text-on-primary" />
						</span>
					</div>

					<div aria-live="polite">
						<h2 class="mt-5 text-xl font-bold tracking-tight">{{ statusText.label }}</h2>
						<p class="mt-1.5 text-[13px] leading-relaxed text-gray-500">{{ statusText.hint }}</p>
					</div>

					<!-- 處理中：不定長度的進度條 -->
					<div
						v-if="status === 'pending'"
						role="progressbar"
						aria-busy="true"
						class="mt-5 h-1 w-full max-w-56 overflow-hidden rounded-full bg-gray-100"
					>
						<span
							class="block h-full w-2/5 animate-sweep rounded-full bg-linear-to-r from-accent to-accent-2 motion-reduce:animate-none"
						/>
					</div>

					<!-- 三段進度：上傳 → AI 解析 → 完成。ol 本身的 margin 會被 Vant 全域 reset（未分層）蓋掉，間距放在外層 -->
					<div class="mt-8 w-full">
						<ol class="flex w-full items-start">
							<li
								v-for="(step, index) in steps"
								:key="step.key"
								class="relative flex flex-1 flex-col items-center gap-2"
								:aria-current="step.state === 'active' ? 'step' : undefined"
							>
								<!-- 從前一個圓點中心拉到這個圓點中心，圓點用 ring 蓋住線頭；通往下一步時加一段流動的亮條 -->
								<span
									v-if="index > 0"
									aria-hidden="true"
									class="absolute right-1/2 top-[13px] h-0.5 w-full overflow-hidden rounded-full transition-colors duration-500"
									:class="step.line"
								>
									<span
										v-if="step.flow"
										class="absolute inset-y-0 left-0 w-[45%] animate-sweep bg-linear-to-r from-transparent via-accent-2 to-transparent motion-reduce:animate-none"
									/>
								</span>
								<span
									class="relative z-10 grid size-7 place-items-center rounded-full ring-4 ring-surface-card transition-colors duration-500"
									:class="step.dot"
								>
									<SvgIcon v-if="step.state === 'done'" name="icon_check" size="15px" class="text-on-primary" />
									<SvgIcon v-else-if="step.state === 'error'" name="icon_close" size="11px" class="text-on-primary" />
									<span v-else-if="step.state === 'active'" class="size-2 animate-pulse rounded-full bg-current" />
								</span>
								<span class="text-[11px] leading-none" :class="step.text">{{ step.label }}</span>
							</li>
						</ol>
					</div>

					<!-- AI 回覆／錯誤訊息 -->
					<div v-if="job.message" class="mt-6 w-full rounded-2xl border px-4 py-3.5 text-left" :class="tone.panel">
						<p class="text-[11px] font-semibold uppercase tracking-widest" :class="tone.text">
							{{ $t('trade_status.message') }}
						</p>
						<p class="mt-1.5 whitespace-pre-line break-words text-[13px] leading-relaxed text-gray-700">
							{{ job.message }}
						</p>
					</div>

					<p
						v-if="status === 'pending'"
						class="mt-6 flex w-full items-start gap-2 border-t border-gray-100 pt-4 text-left text-xs leading-relaxed text-gray-400"
					>
						<SvgIcon name="icon_info" size="14px" class="mt-0.5 shrink-0" />
						{{ $t('trade_status.leave_hint') }}
					</p>
				</div>
			</section>

			<!-- 處理時間軸 -->
			<section
				class="animate-row-in motion-reduce:animate-none rounded-2xl border border-gray-100 bg-surface-card px-4 py-4"
				style="animation-delay: 70ms"
			>
				<h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
					{{ $t('trade_status.timeline') }}
				</h2>
				<ol>
					<li
						v-for="(row, index) in timeline"
						:key="row.key"
						class="relative flex items-baseline justify-between gap-4 pb-4 pl-6 last:pb-0"
					>
						<span
							v-if="index < timeline.length - 1"
							aria-hidden="true"
							class="absolute -bottom-[3px] left-1 top-[17px] w-0.5 rounded-full bg-gray-100"
						/>
						<span
							aria-hidden="true"
							class="absolute left-0 top-[5px] size-2.5 rounded-full border-2 transition-colors duration-500"
							:class="row.dot"
						/>
						<span class="text-[13px] text-gray-500">{{ row.label }}</span>
						<span class="text-sm font-medium tabular-nums">{{ row.value }}</span>
					</li>
				</ol>
			</section>

			<!-- Job ID：整列都能點來複製 -->
			<button
				type="button"
				class="animate-row-in motion-reduce:animate-none flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-surface-card px-4 py-3.5 text-left transition active:scale-[0.985]"
				style="animation-delay: 140ms"
				:aria-label="$t('trade_status.copy')"
				@click="copyJobId"
			>
				<span class="min-w-0 flex-1">
					<span class="block text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
						{{ $t('trade_status.job_id') }}
					</span>
					<span class="mt-1 block break-all text-left font-mono text-[13px] leading-snug text-gray-600">
						{{ jobId }}
					</span>
				</span>
				<span
					class="grid size-9 shrink-0 place-items-center rounded-full border border-gray-100 bg-gray-50 transition-colors duration-300"
					:class="copied ? 'text-emerald-600' : 'text-gray-500'"
				>
					<SvgIcon :name="copied ? 'icon_check' : 'icon_copy'" size="16px" />
				</span>
			</button>

			<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
			<div class="animate-row-in motion-reduce:animate-none mt-1 flex flex-col gap-3" style="animation-delay: 210ms">
				<button
					v-if="status === 'failed'"
					type="button"
					class="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-accent to-accent-2 py-3.5 shadow-nav-home transition active:scale-[0.985]"
					@click="handleRetry"
				>
					<span class="text-[15px] font-semibold tracking-wide text-on-primary">{{ $t('trade_status.retry') }}</span>
				</button>

				<NuxtLink
					v-else-if="status === 'success'"
					:to="localePath('/records')"
					class="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-accent to-accent-2 py-3.5 shadow-nav-home transition active:scale-[0.985]"
				>
					<span class="text-[15px] font-semibold tracking-wide text-on-primary">
						{{ $t('trade_status.view_records') }}
					</span>
				</NuxtLink>

				<NuxtLink
					:to="localePath(status === 'success' ? '/trade-screenshot' : '/records')"
					class="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-surface-card py-3.5 transition active:scale-[0.985]"
				>
					<span class="text-[15px] font-medium text-gray-600">
						{{ status === 'success' ? $t('trade_status.upload_another') : $t('trade_status.back_to_records') }}
					</span>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { showToast, showNotify } from 'vant'
	import { useAiTradeStore } from '@/stores/aiTrade'
	import type { JobStatus } from '@/stores/aiTrade'
	import { useRoute } from 'vue-router'
	import { formatTime } from '@/utils/date'

	definePageMeta({
		middleware: 'auth',
	})

	type StepState = 'done' | 'active' | 'error' | 'todo'

	// 每個狀態的色票：完整寫出 class 字串，Tailwind 才掃得到
	const TONES = {
		pending: {
			text: 'text-accent-2',
			disc: 'bg-linear-to-br from-accent to-accent-2 shadow-nav-home',
			glow: 'bg-accent-2/20',
			panel: 'border-accent-2/20 bg-accent-2/8',
		},
		success: {
			text: 'text-emerald-500',
			disc: 'bg-linear-to-br from-emerald-400 to-emerald-600 shadow-[0_8px_20px_-4px_color-mix(in_oklch,var(--color-emerald-500)_60%,transparent)]',
			glow: 'bg-emerald-500/20',
			panel: 'border-emerald-500/20 bg-emerald-500/8',
		},
		failed: {
			text: 'text-red-500',
			disc: 'bg-linear-to-br from-red-400 to-red-600 shadow-[0_8px_20px_-4px_color-mix(in_oklch,var(--color-red-500)_60%,transparent)]',
			glow: 'bg-red-500/20',
			panel: 'border-red-500/20 bg-red-500/8',
		},
	} as const

	const STEP_DOT: Record<StepState, string> = {
		done: 'bg-emerald-500',
		active: 'border-2 border-accent-2 bg-surface-card text-accent-2',
		error: 'bg-red-500',
		todo: 'border-2 border-gray-200 bg-surface-card',
	}

	const STEP_TEXT: Record<StepState, string> = {
		done: 'font-medium text-gray-500',
		active: 'font-semibold',
		error: 'font-semibold text-red-500',
		todo: 'font-medium text-gray-400',
	}

	const { t } = useI18n()
	const localePath = useLocalePath()
	const route = useRoute()
	const jobId = route.params.jobId as string

	const store = useAiTradeStore()
	const job = computed(() => store.getJob(jobId))
	const status = computed<JobStatus>(() => job.value?.status ?? 'pending')
	const tone = computed(() => TONES[status.value])

	onMounted(() => {
		// 告訴 store 當前頁面在看這個 job（避免彈出通知）
		store.setActivePageJobId(jobId)
		if (_isEmpty(jobId)) {
			showNotify({
				message: t('trade_status.missing_job_id'),
				background: '#ef4444',
				color: '#fff',
			})
		} else {
			// 若 store 沒有這個 job，開始追蹤
			if (!store.getJob(jobId)) {
				store.startTracking(jobId)
			}
		}
	})

	onUnmounted(() => {
		store.setActivePageJobId(null)
	})

	// 處理中才需要每秒跳動的時鐘；完成後暫停，耗時固定為 updatedAt - createdAt
	const { now, pause, resume } = useNow({ interval: 1000, controls: true })
	watch(
		() => job.value?.status,
		(value) => (value === 'pending' ? resume() : pause()),
		{ immediate: true }
	)

	const statusText = computed(() => ({
		label: t(`trade_status.${status.value}`),
		hint: t(`trade_status.${status.value}_hint`),
	}))

	// 上傳 → AI 解析 → 完成；連接線的顏色跟著它「通往」的那一步走，處理中時通往下一步的線會流動
	const steps = computed(() => {
		const analyze: StepState = { pending: 'active', success: 'done', failed: 'error' }[status.value] as StepState
		const finish: StepState = status.value === 'success' ? 'done' : 'todo'
		const states: StepState[] = ['done', analyze, finish]
		const labels = [t('trade_status.step_upload'), t('trade_status.step_analyze'), t('trade_status.step_done')]
		const lineColor: Record<StepState, string> = {
			done: 'bg-emerald-500',
			active: 'bg-accent-2',
			error: 'bg-red-500',
			todo: 'bg-gray-200',
		}

		return states.map((state, index) => ({
			key: labels[index],
			label: labels[index],
			state,
			dot: STEP_DOT[state],
			text: STEP_TEXT[state],
			line: lineColor[state],
			flow: state === 'todo' && states[index - 1] === 'active',
		}))
	})

	const formatElapsed = (ms: number, live = false) => {
		if (ms < 1000) return live ? '0s' : `${ms}ms`
		if (ms < 60_000) return live ? `${Math.floor(ms / 1000)}s` : `${(ms / 1000).toFixed(1)}s`
		return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`
	}

	const timeline = computed(() => {
		if (!job.value) return []
		const { createdAt, updatedAt } = job.value
		const pending = status.value === 'pending'
		const elapsed = Math.max(0, (pending ? now.value.getTime() : updatedAt) - createdAt)

		return [
			{
				key: 'created',
				label: t('trade_status.created_at'),
				value: formatTime(createdAt),
				dot: 'border-gray-300 bg-surface-card',
			},
			{
				key: 'updated',
				label: t('trade_status.updated_at'),
				value: formatTime(updatedAt),
				dot: pending ? 'animate-pulse border-accent-2 bg-accent-2/30' : 'border-gray-300 bg-surface-card',
			},
			{
				key: 'elapsed',
				label: pending ? t('trade_status.waiting') : t('trade_status.elapsed'),
				value: formatElapsed(elapsed, pending),
				dot: pending
					? 'border-gray-300 bg-surface-card'
					: status.value === 'success'
						? 'border-emerald-500 bg-emerald-500'
						: 'border-red-500 bg-red-500',
			},
		]
	})

	const { copy, copied } = useClipboard({ legacy: true, copiedDuring: 1800 })

	async function copyJobId() {
		await copy(jobId)
		if (copied.value) showToast({ message: t('trade_status.copied'), icon: 'success' })
	}

	function handleRetry() {
		store.removeJob(jobId)
		store.startTracking(jobId)
		showNotify({ type: 'primary', message: t('trade_status.retrying'), duration: 2000 })
	}
</script>
