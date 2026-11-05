<template>
	<!-- 圖磚：細描邊 + 內側頂部高光 + 分層柔影，各家品牌底色看起來是同一套（與 HotCompanies、VolatileAsset 一致）。尺寸由外層 class 決定（size-11 之類） -->
	<span
		class="relative grid shrink-0 place-items-center overflow-hidden rounded-[22%] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06),0_4px_10px_-3px_rgb(16_24_40/0.14)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.35)]"
	>
		<img
			v-if="!failed"
			:src="`/logo/${symbol.toLowerCase()}.svg`"
			:alt="`${name || symbol} logo`"
			loading="lazy"
			draggable="false"
			class="size-full object-cover"
			@error="failed = true"
		/>
		<SvgIcon v-else name="icon_ghost" size="60%" class="text-gray-300" />
	</span>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'

	const props = defineProps<{
		symbol: string
		name?: string
	}>()

	// logo 載入失敗就退回預設圖示；換成別檔股票時重新嘗試
	const failed = ref(false)
	watch(
		() => props.symbol,
		() => (failed.value = false)
	)
</script>
