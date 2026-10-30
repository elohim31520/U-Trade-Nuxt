<template>
	<van-list ref="listRef" v-model:loading="loading" :finished="finished" :finished-text="finished ? finishedText : ''"
		:loading-text="loadingText" :immediate-check="immediateCheck" @load="onLoad">
		<slot :list="list" :loading="loading" :finished="finished"></slot>
	</van-list>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef, nextTick } from 'vue'
import type { ListInstance } from 'vant'

const listRef = useTemplateRef<ListInstance>('listRef')

const list = ref<unknown[]>([])
const loading = ref(false)
const finished = ref(false)

interface Props {
	apiFunction?: (params: Record<string, unknown>) => Promise<unknown>
	size?: number
	immediateCheck?: boolean
	apiParams?: Record<string, unknown>
	finishedText?: string
	loadingText?: string
	dataPath?: string
	initialPage?: number
}

const props = withDefaults(defineProps<Props>(), {
	apiFunction: () => async () => ({}),
	size: 10,
	immediateCheck: true,
	apiParams: () => ({}),
	finishedText: '沒有更多了',
	loadingText: 'loading...',
	dataPath: 'data',
	initialPage: 1,
})

const page = ref(props.initialPage)

const onLoad = async (): Promise<void> => {
	await new Promise<void>((resolve) => setTimeout(resolve, 1000))

	const requestParams: Record<string, unknown> = {
		...props.apiParams,
		page: page.value,
		size: props.size,
	}

	const res = await props.apiFunction(requestParams)
	const newData = _get(res, props.dataPath, []) as unknown[]

	list.value = [...list.value, ...newData]

	if (!newData.length) {
		finished.value = true
	}

	page.value += 1
	loading.value = false
}

const refresh = async (): Promise<void> => {
	list.value = []
	page.value = 1
	finished.value = false
	loading.value = true

	await nextTick()

	loading.value = false
	listRef.value?.check()
}

watch(() => props.apiParams, refresh, { deep: true })

defineExpose({ refresh })
</script>