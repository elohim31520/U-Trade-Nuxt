<template>
	<div class="px-4 pb-6 pt-4">
		<header class="mb-5 flex items-end justify-between gap-3 px-1">
			<div class="min-w-0">
				<h1 class="text-[26px] font-bold leading-tight tracking-tight text-gray-900">{{ $t('posts.title') }}</h1>
				<p class="mt-1.5 text-[13px] leading-snug text-gray-500">{{ $t('posts.subtitle') }}</p>
			</div>

			<!-- 外部文章庫，另開分頁 -->
			<a
				:href="infoLink"
				target="_blank"
				rel="noopener"
				class="group inline-flex shrink-0 items-center gap-0.5 rounded-full py-1 pl-2 pr-0.5 text-xs font-medium tracking-[0.04em] text-primary-600 transition-opacity duration-200 [-webkit-tap-highlight-color:transparent] active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
			>
				<span>{{ $t('see_more.text') }}</span>
				<SvgIcon
					name="icon_chevron_right"
					size="0.875rem"
					class="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
				/>
			</a>
		</header>

		<!-- 文章列表：最新一篇放大當主角，其餘縮圖橫列 -->
		<ul v-if="fetchedPost?.length" class="flex flex-col gap-3.5">
			<li
				v-for="(post, index) in fetchedPost"
				:key="post.id"
				class="motion-safe:animate-row-in"
				:style="{ animationDelay: `${Math.min(index, 6) * 70}ms` }"
			>
				<!-- 主角：滿版圖 + 漸層遮罩，標題壓在圖上 -->
				<NuxtLink
					v-if="index === 0"
					:to="localePath(`/post/${post.id}`)"
					class="group relative isolate block aspect-5/4 overflow-hidden rounded-3xl bg-gray-100 shadow-card-soft outline-hidden transition duration-300 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				>
					<img
						v-if="post.image"
						:src="post.image"
						:alt="post.title"
						fetchpriority="high"
						class="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
					/>
					<span v-else class="absolute inset-0 bg-linear-to-br from-primary/40 to-accent-2/40" aria-hidden="true" />
					<span class="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" aria-hidden="true" />

					<div class="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5">
						<div class="flex flex-wrap items-center gap-1.5">
							<span class="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-on-primary">
								{{ $t('posts.latest') }}
							</span>
							<time
								:datetime="post.publishDate"
								class="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-md"
							>
								{{ formatDateDisplay(post.publishDate) }}
							</time>
						</div>
						<h2 class="line-clamp-3 break-words text-xl font-semibold leading-snug tracking-tight text-white">
							{{ post.title }}
						</h2>
						<div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
							<span
								v-for="tag in post.tags.slice(0, 3)"
								:key="tag"
								class="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur-md"
							>
								{{ tag }}
							</span>
						</div>
					</div>
				</NuxtLink>

				<!-- 一般文章：左縮圖、右標題 + 日期 + 標籤 -->
				<NuxtLink
					v-else
					:to="localePath(`/post/${post.id}`)"
					class="group flex gap-3.5 rounded-2xl border border-gray-100 bg-surface-card p-3 shadow-card-soft outline-hidden transition duration-200 hover:border-gray-200 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
				>
					<div class="relative size-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
						<img
							v-if="post.image"
							:src="post.image"
							:alt="post.title"
							loading="lazy"
							decoding="async"
							class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
						/>
						<span v-else class="absolute inset-0 bg-linear-to-br from-primary/25 to-accent-2/25" aria-hidden="true" />
					</div>

					<div class="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
						<h2 class="line-clamp-3 break-words text-[14px] font-semibold leading-snug text-gray-900">
							{{ post.title }}
						</h2>
						<div class="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-gray-400">
							<time :datetime="post.publishDate" class="shrink-0 tabular-nums">
								{{ formatDateDisplay(post.publishDate) }}
							</time>
							<template v-if="post.tags?.length">
								<span class="size-[3px] shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
								<span
									v-for="tag in post.tags.slice(0, 2)"
									:key="tag"
									class="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600"
								>
									{{ tag }}
								</span>
							</template>
						</div>
					</div>
				</NuxtLink>
			</li>
		</ul>

		<!-- 空狀態 -->
		<div v-else class="flex flex-col items-center gap-3 py-20 text-gray-400">
			<SvgIcon name="icon_ghost" size="2.5rem" class="text-gray-300" />
			<p class="text-sm">{{ $t('posts.empty') }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { formatDateDisplay } from '~/utils/date'
	import type { BlogPost } from '~/types/blog'

	const { locale, t } = useI18n()
	const localePath = useLocalePath()

	const infoLink = computed(() => {
		return locale.value === 'zh' ? 'https://lazypod.org/info' : 'https://lazypod.org/info-en/'
	})

	const { data: fetchedPost } = await useAsyncData<BlogPost[]>(`blog-posts-${locale.value}`, () =>
		$fetch<BlogPost[]>('/api/blog', {
			query: { lang: locale.value }, // ← 傳遞語系參數
		})
	)

	usePageSeo(
		computed(() => ({
			title: t('posts.meta_title'),
			description: t('posts.meta_description'),
		}))
	)
</script>
