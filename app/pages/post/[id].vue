<template>
	<div class="post-con px-4">
		<div v-if="fetchedPost">
			<h2>{{ fetchedPost.title }}</h2>
			<img :src="fetchedPost.image" :alt="fetchedPost.title" class="object-fit" />
			<div v-html="fetchedPost.htmlContent"></div>
		</div>
		<div v-else>
			<p>Loading post...</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { BlogPost } from '~/types/blog'

const route = useRoute()
const { locale, t } = useI18n()
const { data: fetchedPost } = await useAsyncData(`blog-post-${route.params.id as string}`, async () => {
	const allPosts = await $fetch<BlogPost[]>('/api/blog', {
		query: { lang: locale.value }, // ← 傳遞語系參數
	})
	return allPosts.find((p) => p.id === (route.params.id as string)) || null
})

usePageSeo(computed(() => ({
	title: fetchedPost.value
		? `${fetchedPost.value.title} - UrTrade`
		: t('posts.meta_title'),
	description: fetchedPost.value?.excerpt ?? t('posts.meta_description'),
	ogImage: fetchedPost.value?.image,
	ogType: 'article',
})))
</script>

<style lang="scss">
.post-con {
	h1 {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
		margin: 2rem 0 1rem;
		color: var(--c-text, #1a1a1a);
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.3;
		margin: 1.5rem 0 0.75rem;
		color: var(--c-text, #2c3e50);
	}

	h3 {
		font-size: 1.2rem;
		font-weight: 500;
		line-height: 1.4;
		margin: 1.25rem 0 0.5rem;
		color: var(--c-text, #34495e);
	}

	i,
	em {
		font-style: italic;
		color: var(--c-text-mid, #4a4a4a);
		font-weight: 400;
	}

	img {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 1rem auto;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	p {
		font-size: 1rem;
		line-height: 1.6;
		margin: 1rem 0;
		color: var(--c-text, #333);
	}

	ol {
		margin: 0 0 1rem 0;
		padding: 0 0 0 1.5rem;
		list-style-position: outside;
		list-style-type: decimal;

		ol {
			margin: 0.5rem 0;
			list-style-type: lower-alpha;

			ol {
				list-style-type: lower-roman;
			}
		}
	}

	li {
		margin: 0 0 0.5rem 0;
		padding: 0;
		line-height: 1.6;

		&:last-child {
			margin-bottom: 0;
		}

		ol,
		ul {
			margin-top: 0.5rem;
		}
	}

	ul {
		margin: 0 0 1rem 0;
		padding: 0 0 0 1.5rem;
		list-style-position: outside;
		list-style-type: disc;

		ul {
			margin: 0.5rem 0;
			list-style-type: circle;

			ul {
				list-style-type: square;
			}
		}
	}

	li {
		margin: 0 0 0.5rem 0;
		padding: 0;
		line-height: 1.6;

		&:last-child {
			margin-bottom: 0;
		}

		ul,
		ol {
			margin-top: 0.5rem;
		}
	}
}
</style>
