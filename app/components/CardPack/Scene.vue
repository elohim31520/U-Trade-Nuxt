<template>
	<!-- 3D 選擇區：畫布高為基準的 1.32 倍，上方留空間給封條飛出。拖曳／箭頭轉環形，點某一包就是選它 -->
	<div
		class="cp-scene relative -mx-4 mt-2 touch-pan-y outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-(--cp-accent)"
		:class="flat ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'"
		role="group"
		tabindex="0"
		:aria-label="$t('card_pack.scene_aria')"
		@keydown="onKeydown"
	>
		<!-- three.js 的畫布掛在這裡；貼圖載完前先藏起來，避免包裝先白一下再上圖 -->
		<div
			ref="host"
			class="absolute inset-0 z-1 transition-opacity duration-300"
			:class="loaded ? 'opacity-100' : 'opacity-0'"
		/>

		<!-- WebGL 不可用：顯示 2D 正面圖，流程照樣用點擊完成 -->
		<template v-if="flat">
			<img
				class="cp-flat absolute top-1/2 left-1/2 z-1 w-(--cp-flat-w) -translate-x-1/2 -translate-y-1/2 cursor-pointer drop-shadow-xl"
				:class="{ 'cp-flat--opening': phase === 'opening' }"
				:src="flatSrc"
				alt=""
				@click="emit('pick', 0)"
			/>
			<p
				class="absolute inset-x-4 bottom-8 text-xs"
				:class="cosmic ? 'cp-text-shadow text-(--cp-on-primary)' : 'text-(--cp-text-2)'"
			>
				{{ $t('card_pack.status_no3d') }}
			</p>
		</template>

		<template v-else>
			<button
				v-show="showArrows"
				type="button"
				:class="[ARROW_CLASS, cosmic ? 'cp-arrow cp-arrow--prev' : 'rounded-full shadow-(--cp-shadow-btn)', 'left-3']"
				:aria-label="$t('card_pack.prev')"
				@click="move(1)"
			>
				<img v-if="!cosmic" class="size-full -scale-x-100" :src="arrowSrc" alt="" />
			</button>
			<button
				v-show="showArrows"
				type="button"
				:class="[ARROW_CLASS, cosmic ? 'cp-arrow' : 'rounded-full shadow-(--cp-shadow-btn)', 'right-3']"
				:aria-label="$t('card_pack.next')"
				@click="move(-1)"
			>
				<img v-if="!cosmic" class="size-full" :src="arrowSrc" alt="" />
			</button>
		</template>

		<p
			class="pointer-events-none absolute bottom-1 left-1/2 z-2 -translate-x-1/2 text-[0.6875rem] font-bold tracking-widest whitespace-nowrap uppercase transition-opacity"
			:class="[
				cosmic ? 'cp-text-shadow text-(--cp-on-primary)' : 'text-(--cp-text-2)',
				{ 'opacity-0': phase !== 'select' },
			]"
			aria-live="polite"
		>
			{{ label }}
		</p>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
	import type { CardPackPhase, CardPackSceneApi, CardPackSceneConfig } from '@/types/cardPack'
	import type { CardPackSceneHandle } from '@/utils/cardPackScene'

	const props = defineProps<{
		/** 流程階段：只有 select 時環可以轉、箭頭才顯示 */
		phase: CardPackPhase
		/** 素材資料夾與平面圖的副檔名（3D 貼圖在 imgDir/3d/ 底下） */
		imgDir: string
		imgExt: string
		scene: CardPackSceneConfig
		/** 目前正前方那一包的標示（PACK 01） */
		label: string
		/** 宇宙魔幻版的外觀：方形玻璃箭頭、白字加暈影（預設是珍珠薰衣草版） */
		cosmic?: boolean
	}>()

	const emit = defineEmits<{
		/** 環轉到另一包（拖曳放開、按箭頭） */
		select: [index: number]
		/** 點選了第 index 包（3D 不能用時固定是 0） */
		pick: [index: number]
		/** 選定後橫向滑過封條：撕開 */
		swipeOpen: []
		/** 在場景上按 Enter／空白鍵：選定目前這一包 */
		choose: []
	}>()

	/** 左右箭頭：珍珠版是圖（向右的箭頭，往左的那顆翻轉），宇宙版是 CSS 畫的方形玻璃鈕（見下方 .cp-arrow） */
	const ARROW_CLASS =
		'absolute top-1/2 z-2 size-11 -translate-y-1/2 cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--cp-accent)'

	const host = ref<HTMLElement | null>(null)
	let handle: CardPackSceneHandle | null = null
	/** 沒有 WebGL */
	const flat = ref(false)
	/** 貼圖都載完了（或沒有 3D 時固定 true）：畫布這時才淡入 */
	const loaded = ref(false)

	const showArrows = computed(() => props.phase === 'select' && loaded.value)
	const arrowSrc = computed(() => `${props.imgDir}/btn-arrow.${props.imgExt}`)
	const flatSrc = computed(() => `${props.imgDir}/3d/${props.scene.fronts[0]}`)

	onMounted(async () => {
		// three.js 只在這頁用到，進頁面後才載入，不拖慢其他頁面
		const { createCardPackScene } = await import('@/utils/cardPackScene')
		if (!host.value) return // 載入期間已經離開頁面
		const { imgDir, scene } = props
		const textureUrl = (file: string) => `${imgDir}/3d/${file}`
		const created = createCardPackScene(host.value, {
			fronts: scene.fronts.map(textureUrl),
			back: textureUrl(scene.back),
			crimp: textureUrl(scene.crimp),
			material: scene.material,
			scale: scene.scale,
			itemColors: scene.itemColors,
			accent: scene.accent,
			ground: scene.ground,
			shadow: scene.shadow,
			onSelect: (index) => emit('select', index),
			onSwipeOpen: () => emit('swipeOpen'),
			onPick: (index) => emit('pick', index),
		})
		if (!created) {
			flat.value = true
			loaded.value = true
			return
		}
		handle = created
		void created.ready.then(() => {
			loaded.value = true
		})
	})

	onBeforeUnmount(() => {
		handle?.destroy()
		handle = null
		clearTimeout(flatTimer)
	})

	// ---------- 沒有 3D 時，撕開動畫用一小段等待取代 ----------
	const FLAT_OPEN_MS = 600
	let flatTimer: ReturnType<typeof setTimeout> | undefined
	let flatDone: (() => void) | null = null

	function openFlat() {
		return new Promise<void>((resolve) => {
			flatDone = resolve
			flatTimer = setTimeout(finishFlat, FLAT_OPEN_MS)
		})
	}
	function finishFlat() {
		clearTimeout(flatTimer)
		const done = flatDone
		flatDone = null
		done?.()
	}

	/** 往右（正）或左（負）翻 n 包 */
	function move(n: number) {
		handle?.move(n)
	}

	function onKeydown(event: KeyboardEvent) {
		if (props.phase !== 'select') return
		if (event.key === 'ArrowLeft') move(1)
		else if (event.key === 'ArrowRight') move(-1)
		else if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
			event.preventDefault()
			emit('choose')
		}
	}

	/** 給 useCardPack 驅動流程用；沒有 3D（或還沒載好）時一律退回 2D 的行為 */
	defineExpose<CardPackSceneApi>({
		selected: () => handle?.selected() ?? 0,
		move,
		goTo: (index) => handle?.goTo(index) ?? false,
		setMode: (mode) => handle?.setMode(mode),
		open: (ms) => (handle ? handle.open(ms) : openFlat()),
		skip: () => (handle ? handle.skip() : finishFlat()),
	})
</script>

<style scoped>
	/* 宇宙魔幻版：文字壓在背景圖上，加一圈深色暈影才讀得清楚 */
	.cp-text-shadow {
		text-shadow: 0 1px 0.25rem var(--cp-bg);
	}

	/* 宇宙魔幻版的左右箭頭：深色方塊、青色細框與內發光，箭頭是一個轉 45 度的 L 形邊框 */
	.cp-arrow {
		border: 1px solid var(--cp-cyan);
		border-radius: 0.1875rem;
		background: var(--cp-bg);
		box-shadow: inset 0 0 0.625rem var(--cp-ui-glint);
		color: var(--cp-cyan);
	}
	.cp-arrow::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 46%;
		width: 0.75rem;
		height: 0.75rem;
		border: solid currentcolor;
		border-width: 2px 2px 0 0;
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.cp-arrow--prev::after {
		left: 54%;
		transform: translate(-50%, -50%) rotate(-135deg);
	}

	/* 場景同時受寬與高限制：矮螢幕也要在第一屏看到包裝＋主按鈕（跟設計稿嵌入站台時同一組規則：
   寬的 84%、最大 23.75rem、高度預算 (100svh - 21.25rem) / 1.32，但至少 66% 寬） */
	.cp-scene {
		--cp-scene-size: min(
			calc(84 * var(--cp-u)),
			23.75rem,
			max(calc((100svh - 21.25rem) / 1.32), calc(66 * var(--cp-u)))
		);
		--cp-flat-w: calc(var(--cp-scene-size) * 0.46);
		height: calc(var(--cp-scene-size) * 1.32);
	}

	.cp-flat--opening {
		animation: cp-flat-open 0.6s ease-in forwards;
	}
	@keyframes cp-flat-open {
		to {
			transform: translate(-50%, -60%) scale(1.15);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cp-flat--opening {
			animation: none !important;
		}
	}
</style>
