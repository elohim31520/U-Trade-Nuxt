<template>
	<div class="px-4">
		<!-- 查看更多連結 -->
		<a class="flex items-center justify-center gap-1 text-primary text-sm font-medium my-5 tracking-wide transition-opacity duration-200 hover:opacity-70"
			target="_blank" :href="infoLink">
			<span>{{ $t('see_more.text') }}</span>
			<SvgIcon name="icon_arrow_right" size="0.875rem" />
		</a>

		<!-- 文章列表 -->
		<ul v-if="fetchedPost?.length" class="flex flex-col gap-5 list-none m-0 p-0">
			<li v-for="(post, index) in fetchedPost" :key="post.id" class="opacity-0 post-item"
				:style="{ animationDelay: `${index * 0.08}s` }">
				<NuxtLink :to="localePath(`/post/${post.id}`)"
					class="block rounded-2xl overflow-hidden no-underline shadow-card-primary transition-transform duration-300 bg-surface-card active:scale-[0.985] post-card">
					<!-- 圖片區塊 -->
					<div class="relative w-full overflow-hidden" style="aspect-ratio: 16/9">
						<img :src="post.image" :alt="post.title"
							class="w-full h-full object-cover transition-transform duration-500 post-image" />
						<!-- 日期 badge -->
						<span
							class="absolute bottom-2 right-3 text-white text-xs font-medium px-2 py-0.5 rounded-full post-date-badge">
							{{ formatDateDisplay(post.publishDate) }}
						</span>
					</div>

					<!-- 文字區域 -->
					<div class="px-4 pt-3 pb-4">
						<h2 class="text-gray-800 font-semibold leading-snug mb-3 truncate-lines-3"
							style="font-size: 0.9375rem">
							{{ post.title }}
						</h2>
						<div class="flex items-center justify-end">
							<span
								class="flex items-center gap-1 text-primary text-xs font-medium tracking-wide transition-opacity duration-200 post-read-more">
								{{ $t('com.read_more') }}
								<SvgIcon name="icon_arrow_right" size="0.75rem"
									class="transition-transform duration-200 post-arrow" />
							</span>
						</div>
					</div>
				</NuxtLink>
			</li>
		</ul>

		<!-- 空狀態 -->
		<div v-else>
			<p class="text-gray-400 text-sm text-center py-10">{{ $t('posts.empty') }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDateDisplay } from '~/utils/date'
import type { BlogPost } from '~/types/blog'

const { locale } = useI18n()
const localePath = useLocalePath()



const infoLink = computed(() => {
	return locale.value === 'zh' ? 'https://lazypod.org/info' : 'https://lazypod.org/info-en/'
})

const { data: fetchedPost } = await useAsyncData<BlogPost[]>(`blog-posts-${locale.value}`, () =>
	$fetch<BlogPost[]>('/api/blog', {
		query: { lang: locale.value }, // ← 傳遞語系參數
	})
)

const { t } = useI18n()

usePageSeo(computed(() => ({
	title: t('posts.meta_title'),
	description: t('posts.meta_description'),
})))
</script>

<style scoped>
h2 {
	font-weight: bold;
	font-size: 1.5rem;
}

/* 入場動畫 */
.post-item {
	animation: fadeSlideUp 0.4s ease forwards;
}

@keyframes fadeSlideUp {
	from {
		opacity: 0;
		transform: translateY(12px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 毛玻璃日期 badge */
.post-date-badge {
	background: rgba(0, 0, 0, 0.38);
	backdrop-filter: blur(4px);
	letter-spacing: 0.02em;
}

/* hover 互動 — 純 CSS 選擇器處理，Tailwind group 無法跨元件層 */
.post-card:hover .post-image {
	transform: scale(1.04);
}

.post-card:hover .post-read-more {
	opacity: 0.7;
}

.post-card:hover .post-arrow {
	transform: translateX(2px);
}
</style>