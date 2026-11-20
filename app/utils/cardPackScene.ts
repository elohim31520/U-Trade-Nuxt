/**
 * 卡包的 3D 選擇區（three.js）：六個卡包排成環形，可拖曳或用箭頭切換；選定後播放抖動蓄力＋封條飛出的撕開動畫。
 * 移植自設計站拆卡包活動的 scene.js（只留卡包，沒有盲盒與吉祥物）。
 *
 * 這支檔案只管 WebGL 畫面，不碰 Vue；流程（挑選、撕開、揭曉）在 composables/useCardPack.ts。
 * 要用 three.js 的地方一律具名 import，打包時才能只留用到的部分；整支檔案由 CardPack/Scene.vue
 * 在進頁面後才動態載入，所以不會拖慢其他頁面。
 * WebGL 無法啟動時回傳 null，由呼叫端改用 2D 圖片。
 */
import {
	BoxGeometry,
	CanvasTexture,
	DirectionalLight,
	Group,
	HemisphereLight,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	PointLight,
	Raycaster,
	Scene,
	SRGBColorSpace,
	TextureLoader,
	Vector2,
	WebGLRenderer,
} from 'three'
import type { Texture } from 'three'
import type { CardPackSceneApi } from '@/types/cardPack'
import {
	DRAG_RADIANS_PER_PX,
	DRAG_SWITCH_PX,
	DRAG_TEAR_PX,
	PACK_COUNT,
	PACK_LID_Y,
	PACK_RADIUS,
	PACK_STEP,
	TAP_MAX_PX,
	packIdleSway,
	packLidPose,
	packShake,
	selectedPackIndex,
	shortestPackTurn,
} from './cardPack'

export interface CardPackSceneOptions {
	/** 卡包正面貼圖網址，環上六包依序輪流 */
	fronts: string[]
	back: string
	crimp: string
	/** 正面貼圖的材質 */
	material: { metalness: number; roughness: number }
	/** 整個環形的縮放倍率 */
	scale: number
	/** 環上六包的側邊與封條色（依位置） */
	itemColors: readonly string[]
	accent: string
	ground: string
	shadow: string
	/** 轉到另一包時（拖曳放開、按箭頭） */
	onSelect?: (index: number) => void
	/** 在選定後橫向滑過封條：撕開 */
	onSwipeOpen?: () => void
	/** 點選某一包 */
	onPick?: (index: number) => void
}

/** select：挑選中（環可轉）；ready：已選定，等著撕開；opening：撕開動畫中；opened：動畫結束 */
export type CardPackSceneMode = 'select' | 'ready' | 'opening' | 'opened'

export interface CardPackSceneHandle extends CardPackSceneApi {
	/** 所有貼圖載完（成功或失敗）才 resolve，給 loading 畫面用 */
	ready: Promise<void>
	destroy: () => void
}

/** 接地陰影由程式畫（素材不畫地面陰影）：中心實、邊緣透明的壓扁橢圓 */
function createShadowTexture() {
	const canvas = document.createElement('canvas')
	canvas.width = 256
	canvas.height = 128
	const g = canvas.getContext('2d')!
	const gradient = g.createRadialGradient(128, 64, 4, 128, 64, 124)
	gradient.addColorStop(0, 'rgba(255,255,255,1)')
	gradient.addColorStop(1, 'rgba(255,255,255,0)')
	g.fillStyle = gradient
	g.setTransform(1, 0, 0, 0.5, 0, 32)
	g.fillRect(0, 0, 256, 256)
	return new CanvasTexture(canvas)
}

/** 瀏覽器有沒有 WebGL2（three.js 只支援 WebGL2）；失敗原因寫在 console.info，回報「3D 無法啟用」時用來判斷 */
function hasWebGL2() {
	const probe = document.createElement('canvas')
	if (window.WebGL2RenderingContext && probe.getContext('webgl2')) return true
	const gl1 = !!(window.WebGLRenderingContext && document.createElement('canvas').getContext('webgl'))
	console.info(`[card-pack] 2D fallback: ${gl1 ? 'WebGL2 unavailable (WebGL1 only)' : 'WebGL unavailable'}`)
	return false
}

/** 卡包尺寸對應設計稿比例：正面 2:3（512×768）、封條 512×64 */
const PACK_SIZE = { width: 1.48, height: 2.22, depth: 0.065 }
const CRIMP_SIZE = { width: 1.48, height: 0.18, depth: 0.07 }
/** 地板高度：接地陰影放這裡 */
const FLOOR_Y = -1.45

export function createCardPackScene(host: HTMLElement, opts: CardPackSceneOptions): CardPackSceneHandle | null {
	if (!hasWebGL2()) return null
	let renderer: WebGLRenderer
	try {
		renderer = new WebGLRenderer({ antialias: true, alpha: true })
	} catch (error) {
		console.info(`[card-pack] 2D fallback: renderer failed: ${(error as Error)?.message}`)
		return null
	}

	const disposables: Array<{ dispose: () => void }> = []
	const keep = <T extends { dispose: () => void }>(item: T): T => {
		disposables.push(item)
		return item
	}

	const scene = new Scene()
	const camera = new PerspectiveCamera(35, 1, 0.1, 100)
	camera.position.set(0, 2.3, 7.6)
	camera.lookAt(0, 0.3, 0)

	const hemi = new HemisphereLight(0xffffff, opts.ground, 2)
	const key = new DirectionalLight(0xffffff, 3)
	key.position.set(-3, 6, 5)
	const accent = new PointLight(opts.accent, 35)
	accent.position.set(4, 2, 1)
	scene.add(hemi, key, accent)

	// world：整個環形一起縮放，opts.scale 調整卡包在畫面上的大小
	const world = new Group()
	world.scale.setScalar(opts.scale || 1)
	scene.add(world)
	const ring = new Group()
	world.add(ring)

	// 同一張圖只載一次；全部載完（成功或失敗）時 ready 才 resolve，給 loading 畫面計算進度
	const loader = new TextureLoader()
	const cache = new Map<string, Promise<Texture | null>>()
	function loadTexture(src: string) {
		let promise = cache.get(src)
		if (!promise) {
			promise = new Promise<Texture | null>((resolve) => {
				loader.load(
					src,
					(texture) => {
						texture.colorSpace = SRGBColorSpace
						texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
						keep(texture)
						resolve(texture)
					},
					undefined,
					() => resolve(null)
				)
			})
			cache.set(src, promise)
		}
		return promise
	}
	function withMap<M extends MeshStandardMaterial>(material: M, src: string | undefined) {
		if (src) {
			void loadTexture(src).then((texture) => {
				if (!texture) return
				material.map = texture
				material.needsUpdate = true
			})
		}
		return material
	}
	const art = (src: string | undefined) =>
		withMap(
			keep(
				new MeshStandardMaterial({
					color: 0xffffff,
					metalness: opts.material.metalness,
					roughness: opts.material.roughness,
				})
			),
			src
		)

	const shadowTexture = keep(createShadowTexture())
	const shadowGeometry = keep(new PlaneGeometry(2.2, 0.9))
	const bodyGeometry = keep(new BoxGeometry(PACK_SIZE.width, PACK_SIZE.height, PACK_SIZE.depth))
	const crimpGeometry = keep(new BoxGeometry(CRIMP_SIZE.width, CRIMP_SIZE.height, CRIMP_SIZE.depth))
	const backMaterial = art(opts.back)
	const crimpMaterial = art(opts.crimp)

	interface PackItem {
		group: Group
		body: Group
		lid: Mesh
	}
	const items: PackItem[] = []
	for (let i = 0; i < PACK_COUNT; i++) {
		const group = new Group()
		const body = new Group()
		group.add(body)

		// 側面不貼圖，只乘上該位置的色票，讓六個包裝顏色不同；正面圖保留原色
		const side = keep(new MeshStandardMaterial({ metalness: 0.48, roughness: 0.3 }))
		side.color.set(opts.itemColors[i % opts.itemColors.length] ?? '#b8b4f3')

		// BoxGeometry 的面依序是 +x、-x、+y、-y、+z（正面）、-z（背面）
		const face = art(opts.fronts[i % opts.fronts.length])
		const pack = new Mesh(bodyGeometry, [side, side, side, side, face, backMaterial])
		const lid = new Mesh(crimpGeometry, [side, side, side, side, crimpMaterial, crimpMaterial])
		lid.position.y = PACK_LID_Y
		const bottom = new Mesh(crimpGeometry, [side, side, side, side, crimpMaterial, crimpMaterial])
		bottom.position.y = -PACK_LID_Y
		body.add(pack, lid, bottom)

		const shadowMaterial = keep(
			new MeshBasicMaterial({
				map: shadowTexture,
				color: opts.shadow,
				transparent: true,
				depthWrite: false,
				opacity: 0.35,
			})
		)
		const shadow = new Mesh(shadowGeometry, shadowMaterial)
		shadow.rotation.x = -Math.PI / 2
		shadow.position.y = FLOOR_Y
		group.add(shadow)

		const angle = i * PACK_STEP
		group.position.set(Math.sin(angle) * PACK_RADIUS, 0, Math.cos(angle) * PACK_RADIUS - PACK_RADIUS)
		group.rotation.y = angle
		ring.add(group)
		items.push({ group, body, lid })
	}

	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
	renderer.setClearColor(0x000000, 0)
	const canvas = renderer.domElement
	canvas.style.display = 'block'
	host.appendChild(canvas)
	const resizeObserver = new ResizeObserver(() => {
		const rect = host.getBoundingClientRect()
		if (!rect.width || !rect.height) return
		renderer.setSize(rect.width, rect.height)
		camera.aspect = rect.width / rect.height
		camera.updateProjectionMatrix()
	})
	resizeObserver.observe(host)

	let mode: CardPackSceneMode = 'select'
	let selected = 0
	/** 環目前的角度（拖曳時跟著手指、放開後往 target 靠近）與目標角度 */
	let angle = 0
	let target = 0
	let startX: number | null = null
	let drag = 0
	let progress = 0
	let openMs = 1800
	let openDone: (() => void) | null = null
	const abort = new AbortController()
	const on = <K extends keyof HTMLElementEventMap>(name: K, handler: (event: HTMLElementEventMap[K]) => void) =>
		host.addEventListener(name, handler, { signal: abort.signal })

	function move(n: number) {
		if (mode !== 'select') return
		target += n * PACK_STEP
		selected = selectedPackIndex(target)
		opts.onSelect?.(selected)
	}

	// 點選：用射線找出指到的是哪一包（看得見的包裝才算），回傳索引；沒點到回傳 -1
	const raycaster = new Raycaster()
	const pointer = new Vector2()
	function pickAt(clientX: number, clientY: number) {
		const rect = canvas.getBoundingClientRect()
		pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
		raycaster.setFromCamera(pointer, camera)
		const hit = raycaster.intersectObjects(
			items.filter((item) => item.group.visible).map((item) => item.body),
			true
		)[0]
		if (!hit) return -1
		return items.findIndex((item) => {
			for (let node = hit.object; node; node = node.parent as typeof node) {
				if (node === item.body) return true
			}
			return false
		})
	}

	function goTo(index: number) {
		const turn = shortestPackTurn(selected, index)
		if (turn) move(-turn)
		return turn !== 0
	}

	on('pointerdown', (event) => {
		if (mode !== 'select' && mode !== 'ready') return
		if (event.target !== canvas) return
		startX = event.clientX
		drag = 0
		host.setPointerCapture(event.pointerId)
	})
	on('pointermove', (event) => {
		if (startX === null) {
			// 滑鼠移到包裝上顯示手指游標，表示可以點選
			if (event.pointerType === 'mouse' && mode === 'select' && event.target === canvas) {
				canvas.style.cursor = pickAt(event.clientX, event.clientY) >= 0 ? 'pointer' : ''
			}
			return
		}
		drag = event.clientX - startX
		if (mode === 'select') angle = target + drag * DRAG_RADIANS_PER_PX
	})
	on('pointerup', (event) => {
		if (startX === null) return
		if (mode === 'select' && Math.abs(drag) > DRAG_SWITCH_PX) move(drag > 0 ? 1 : -1)
		else if (mode === 'ready' && Math.abs(drag) > DRAG_TEAR_PX) opts.onSwipeOpen?.()
		else if (mode === 'select' && Math.abs(drag) < TAP_MAX_PX) {
			// 沒有拖曳＝點選：點到哪一包就選哪一包
			const index = pickAt(event.clientX, event.clientY)
			if (index >= 0) opts.onPick?.(index)
		}
		startX = null
	})
	on('pointercancel', () => {
		startX = null
	})

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
	let last = performance.now()
	let raf = 0
	let disposed = false

	function finishOpen() {
		progress = 1
		mode = 'opened'
		const done = openDone
		openDone = null
		done?.()
	}

	function frame(now: number) {
		const dt = Math.min((now - last) / 1000, 0.05)
		last = now
		if (mode === 'opening') {
			progress += dt / ((reduced.matches ? 300 : openMs) / 1000)
			if (progress >= 1) finishOpen()
		}
		// 拖曳中（select 且手指按著）環跟著手指；其餘時候往目標角度靠近
		if (startX === null || mode !== 'select') {
			angle += (target - angle) * (reduced.matches ? 1 : Math.min(1, dt * 8))
		}
		ring.rotation.y = angle
		ring.position.x = PACK_RADIUS * Math.sin(angle)
		ring.position.z = PACK_RADIUS * (Math.cos(angle) - 1)
		items.forEach((item, k) => {
			const mine = k === selected
			// 選定後只留被選中的那一包
			item.group.visible = mode === 'select' || mine
			const p = mine ? Math.min(progress, 1) : 0
			const shake = mine && mode === 'opening' && !reduced.matches ? packShake(p, now) : 0
			const sway = mode === 'select' && !reduced.matches ? packIdleSway(now, k) : 0
			item.body.rotation.z = sway + shake
			const lid = packLidPose(p)
			item.lid.position.x = lid.x
			item.lid.position.y = lid.y
			item.lid.rotation.z = lid.rotationZ
		})
		if (!document.hidden && host.offsetParent !== null) renderer.render(scene, camera)
		if (!disposed) raf = requestAnimationFrame(frame)
	}
	raf = requestAnimationFrame(frame)

	return {
		ready: Promise.all([...opts.fronts, opts.back, opts.crimp].map((src) => loadTexture(src))).then(() => undefined),
		selected: () => selected,
		move,
		goTo,
		setMode: (next) => {
			mode = next
			if (next === 'select') {
				progress = 0
				openDone = null
			}
		},
		open: (ms) => {
			openMs = ms || openMs
			mode = 'opening'
			progress = 0
			return new Promise<void>((resolve) => {
				openDone = resolve
			})
		},
		skip: () => {
			if (mode === 'opening') finishOpen()
		},
		destroy: () => {
			disposed = true
			cancelAnimationFrame(raf)
			abort.abort()
			resizeObserver.disconnect()
			disposables.forEach((item) => item.dispose())
			renderer.dispose()
			canvas.remove()
		},
	}
}
