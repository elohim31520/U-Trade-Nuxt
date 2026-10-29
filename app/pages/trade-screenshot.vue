<template>
	<div class="px-4 pb-8 pt-5">
		<header class="mb-4 px-1">
			<h1 class="text-sm font-bold uppercase tracking-widest">{{ $t('transaction.upload_screenshot') }}</h1>
		</header>

		<!-- 隱私提醒：AI 會讀取截圖內容，上傳前先看到 -->
		<aside class="row-in mb-4 flex items-start gap-3 rounded-2xl border border-accent-2/20 bg-accent-2/8 px-4 py-3.5">
			<svg
				class="mt-0.5 shrink-0 text-accent-2"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M12 3 5 6v5.5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6l-7-3Z" />
				<path d="m9 12 2.2 2.2L15.5 10" />
			</svg>
			<p class="min-w-0 flex-1 text-[13px] leading-relaxed text-gray-600">{{ $t('transaction.img_upload_tips') }}</p>
			<span class="mt-0.5 rounded-md bg-accent-2/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent-2">
				AI
			</span>
		</aside>

		<section
			class="row-in rounded-3xl border border-gray-100 bg-surface-card p-5 shadow-card-primary"
			:style="{ '--i': 1 }"
		>
			<!-- 預覽改由下方自己繪製，所以關掉 Vant 內建縮圖；選到檔案後 max-count 會自動收起上傳區 -->
			<van-uploader
				v-model="fileList"
				:max-count="1"
				:max-size="MAX_SIZE"
				:preview-image="false"
				:before-read="beforeRead"
				class="uploader"
				@oversize="onOversize"
			>
				<div class="drop-zone group">
					<span
						class="grid size-16 place-items-center rounded-2xl bg-linear-to-br from-accent to-accent-2 shadow-nav-home transition-transform duration-300 group-active:scale-95"
					>
						<svg
							class="text-on-primary"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M12 15.5V4.5M12 4.5 8 8.5M12 4.5l4 4" />
							<path d="M4 15v2.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V15" />
						</svg>
					</span>
					<span class="mt-5 text-[15px] font-semibold">{{ $t('upload.click_to_upload') }}</span>
					<span class="mt-1.5 text-xs text-gray-400">{{ $t('upload.size_limit', { size: '5MB' }) }}</span>
					<span class="mt-4 flex items-center gap-1.5">
						<span
							v-for="format in FORMATS"
							:key="format"
							class="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-semibold leading-none tracking-wide text-gray-500"
						>
							{{ format }}
						</span>
					</span>
				</div>
			</van-uploader>

			<!-- 已選圖片：縮圖（點開看大圖）＋檔名／大小＋移除 -->
			<div v-if="current" class="preview-in">
				<div class="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
					<button
						type="button"
						class="block w-full"
						:disabled="uploading"
						:aria-label="$t('upload.preview')"
						@click="onClickPreview"
					>
						<img :src="previewUrl" :alt="current.name" draggable="false" class="mx-auto block max-h-[380px] w-full object-contain" />
					</button>

					<!-- 上傳中：掃描線掠過整張圖 -->
					<div v-if="uploading" class="scan-overlay pointer-events-none absolute inset-0" aria-hidden="true">
						<span class="scan-line" />
					</div>
				</div>

				<div class="mt-4 flex items-center gap-3">
					<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50">
						<svg
							class="text-emerald-600"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="m5 12.5 4.5 4.5L19 7.5" />
						</svg>
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-medium">{{ current.name }}</span>
						<span class="mt-0.5 block text-xs tabular-nums text-gray-400">
							{{ fileTypeLabel(current) }} · {{ formatFileSize(current.size) }}
						</span>
					</span>
					<button
						type="button"
						class="grid size-9 shrink-0 place-items-center rounded-full border border-gray-100 bg-gray-50 transition active:scale-90 disabled:opacity-40"
						:disabled="uploading"
						:aria-label="$t('upload.remove')"
						@click="onRemove"
					>
						<svg
							class="text-gray-500"
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							aria-hidden="true"
						>
							<path d="m3 3 8 8M11 3l-8 8" />
						</svg>
					</button>
				</div>

				<p v-if="!uploading" class="mt-3 text-xs leading-relaxed text-gray-400">{{ $t('upload.ready_to_submit') }}</p>
			</div>
		</section>

		<!-- 文字樣式放在內層 span：Vant 全域 reset 的 button { color/font: inherit } 沒包在 layer 裡，會蓋掉 button 本身的 text-* -->
		<button
			type="button"
			:disabled="!current || uploading"
			class="row-in mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-accent to-accent-2 py-3.5 shadow-nav-home transition active:scale-[0.985] disabled:opacity-40 disabled:shadow-none"
			:style="{ '--i': 2 }"
			@click="handleSubmit"
		>
			<svg
				v-if="uploading"
				class="size-4 animate-spin text-on-primary"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<path d="M12 3a9 9 0 1 0 9 9" />
			</svg>
			<span class="text-[15px] font-semibold tracking-wide text-on-primary">
				{{ uploading ? $t('upload.uploading') : $t('upload.submit') }}
			</span>
		</button>

		<button
			type="button"
			:disabled="uploading"
			class="row-in mt-3 w-full rounded-2xl border border-gray-200 bg-surface-card py-3.5 transition active:scale-[0.985] disabled:opacity-40"
			:style="{ '--i': 3 }"
			@click="$router.go(-1)"
		>
			<span class="text-[15px] font-medium text-gray-600">{{ $t('common.cancel') }}</span>
		</button>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, watch, onBeforeUnmount } from 'vue'
	import { showToast, showLoadingToast, closeToast, showImagePreview } from 'vant'
	import type { UploaderFileListItem } from 'vant'
	import { useUserStore } from '@/stores/user'
	import { useAiTradeStore } from '@/stores/aiTrade'

	definePageMeta({
		middleware: 'auth',
	})

	const MAX_SIZE = 5 * 1024 * 1024
	const FORMATS = ['JPG', 'PNG', 'WEBP']

	const { t } = useI18n()
	const localePath = useLocalePath()
	const userStore = useUserStore()
	const tradeStore = useAiTradeStore()
	const { $bffApi } = useNuxtApp()

	// 檔案列表
	const fileList = ref<UploaderFileListItem[]>([])
	const uploading = ref(false)

	// 目前選到的檔案（只允許一張）
	const current = computed(() => fileList.value[0]?.file ?? null)

	// 縮圖用 objectURL：不依賴 Vant 的 content，換圖或離開頁面時釋放
	const previewUrl = ref('')
	const releasePreview = () => {
		if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
		previewUrl.value = ''
	}
	watch(current, (file) => {
		releasePreview()
		if (file) previewUrl.value = URL.createObjectURL(file)
	})
	onBeforeUnmount(releasePreview)

	const formatFileSize = (bytes: number) => {
		if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
		return `${Math.max(1, Math.round(bytes / 1024))} KB`
	}
	const fileTypeLabel = (file: File) => (file.type.split('/')[1] ?? '').toUpperCase()

	// 上傳前驗證
	const beforeRead = (file: File) => {
		const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
		if (!validTypes.includes(file.type)) {
			showToast(t('upload.invalid_format'))
			return false
		}

		if (file.size > MAX_SIZE) {
			showToast(t('upload.size_exceed', { size: '5MB' }))
			return false
		}

		return true
	}

	// 檔案超過大小限制
	const onOversize = () => {
		showToast(t('upload.size_exceed', { size: '5MB' }))
	}

	// 移除已選圖片，回到上傳區
	const onRemove = () => {
		fileList.value = []
	}

	// 點擊縮圖，看大圖
	const onClickPreview = () => {
		if (!previewUrl.value) return
		showImagePreview({
			images: [previewUrl.value],
			closeable: true, // 顯示關閉按鈕
			closeOnPopstate: true, // 支援瀏覽器返回鍵關閉
		})
	}

	// 送出表單
	const handleSubmit = async () => {
		if (!userStore.isLogin) {
			showToast(t('transaction.please_login_first'))
			return
		}

		if (fileList.value.length === 0) {
			showToast(t('upload.no_file'))
			return
		}

		uploading.value = true
		showLoadingToast({
			message: t('upload.uploading'),
			forbidClick: true,
			duration: 0,
		})

		try {
			// 取得 File 物件
			const file = fileList.value[0]?.file

			if (!file) {
				throw new Error('No file found')
			}

			const formData = new FormData()
			formData.append('image', file) //後端 multer 期待的欄位名是 image
			const response = await $bffApi.analyzeScreenshot(formData)

			closeToast()

			const jobId = response.data?.jobId
			tradeStore.startTracking(jobId)
			navigateTo(localePath(`/trade-status/${jobId}`))
		} catch (error: any) {
			closeToast()
			console.error('Upload error:', error)

			const errorMsg = error?.data?.message || error?.message || t('upload.failed')
			showToast({
				message: errorMsg,
				type: 'fail',
			})
		} finally {
			uploading.value = false
		}
	}
</script>

<style scoped>
	/* van-uploader 預設是 inline-flex、固定 80px 的方塊；拉成整張卡片寬 */
	.uploader {
		display: block;
		width: 100%;
	}

	.uploader :deep(.van-uploader__wrapper),
	.uploader :deep(.van-uploader__input-wrapper) {
		width: 100%;
	}

	/* 上傳區：虛線框 + 品牌色淡底；整塊都是點擊範圍（隱藏的 input 覆蓋整個 wrapper） */
	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 2px dashed color-mix(in oklch, var(--color-accent-2) 40%, transparent);
		border-radius: 1rem;
		background: color-mix(in oklch, var(--color-accent-2) 5%, transparent);
		padding: 2.5rem 1rem;
		transition:
			border-color 0.2s,
			background-color 0.2s;
	}

	.drop-zone:hover {
		border-color: color-mix(in oklch, var(--color-accent-2) 70%, transparent);
		background: color-mix(in oklch, var(--color-accent-2) 10%, transparent);
	}

	/* 掃描線：由上掃到下再折返，下方拖一層淡淡的光 */
	.scan-overlay {
		background: linear-gradient(
			to bottom,
			transparent 40%,
			color-mix(in oklch, var(--color-accent-2) 14%, transparent)
		);
	}

	.scan-line {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--color-accent-2), transparent);
		box-shadow: 0 0 18px 4px color-mix(in oklch, var(--color-accent-2) 45%, transparent);
		animation: scan 1.6s ease-in-out infinite alternate;
	}

	@keyframes scan {
		to {
			top: calc(100% - 2px);
		}
	}

	/* 進場：區塊依序淡入上移 */
	.row-in {
		animation: row-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i, 0) * 70ms);
	}

	.preview-in {
		animation: row-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drop-zone {
			transition: none;
		}

		.row-in,
		.preview-in {
			animation: none;
		}

		.scan-line {
			animation: none;
			top: 50%;
		}
	}
</style>
