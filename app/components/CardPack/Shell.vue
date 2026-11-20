<template>
	<!-- 頁面寬度（--cp-page-w）置中；站台容器最寬 480px，這裡跟著撐滿。
       站台根容器底部留了 6rem（pb-[6rem]）給固定的底部導覽，用 -mb-24 抵銷，活動的底圖才會延伸到導覽後面，
       不會在頁尾與導覽之間露出一條站台底色；Info 的底部留白（pb-24）補回讓出導覽的空間 -->
	<div ref="containerRef" class="cp-theme mx-auto -mb-24 w-full max-w-(--cp-page-w)" :style="theme">
		<slot :width="width" />
	</div>
</template>

<script setup lang="ts">
	import { useElementSize } from '@vueuse/core'
	import { ref } from 'vue'

	/** 卡包的外殼：套上活動的皮膚（色票與背景圖的 CSS 變數），並量出容器寬給彈窗用 */
	defineProps<{
		/** 皮膚轉成的 CSS 變數（utils/cardPackContent.ts 的 cardPackThemeStyle） */
		theme: Record<string, string>
	}>()

	// 彈窗的寬度要等於容器寬，由這裡量好從 slot 給出去
	const containerRef = ref<HTMLElement | null>(null)
	const { width } = useElementSize(containerRef)
</script>

<style>
	/* 卡包的共用 token（--cp-*）。活動自己的美術配色與背景圖由最外層元素的 inline style 帶入
   （constants/cardPack.ts 的 colors，加上 utils/cardPackContent.ts 的 cardPackThemeStyle 組出的 --cp-img-*），
   不跟站台主題的語意 token；樣式用 Tailwind 的 text-(--cp-xxx) / bg-(--cp-xxx) 與 bg-(image:--cp-img-xxx) 取用。
   這裡只放不隨皮膚變的 */
	.cp-theme {
		/* 分享平台的代表色 */
		--cp-share-line: #06c755;
		--cp-share-facebook: #1877f2;
		--cp-share-x: #14171a;
		--cp-share-whatsapp: #25d366;
		--cp-share-telegram: #229ed9;
		/* 頁面寬度：站台容器 max-w-[480px]，30rem（16px 根字級 = 480px）剛好撐滿。
     設計稿的活動頁是 420px 的 H5，字級與間距都是照它換算，所以頁寬變寬時整頁會等比放大一點 */
		--cp-page-w: 30rem;
		/* 「容器寬的 1%」：設計稿的 vw 量的是 420px 的 iframe，但電腦瀏覽器的 1vw 是整個視窗，
     所以取「視窗 1%」與「頁寬 1%」較小者；手機（視窗比頁寬窄）仍是 1vw。
     不用 container query 是因為它會讓容器變成 position: fixed 子孫的定位基準，結果彈窗會跑掉 */
		--cp-u: min(1vw, calc(var(--cp-page-w) / 100));
	}
</style>
