import {
	AmbientLight,
	BoxGeometry,
	Color,
	DirectionalLight,
	Mesh,
	MeshStandardMaterial,
	Raycaster,
	Vector2,
} from 'three'
import type { DemoDefinition } from '../types'

const GRID = 6
const SPACING = 1.1
/** 按下到放開位移小於這個像素才算「點擊」，否則是在拖曳旋轉視角 */
const CLICK_MAX_MOVE = 4
const BASE_COLOR = '#30363d'
const PICKED_COLOR = '#58a6ff'

/**
 * 06 · 滑鼠互動（Raycaster）
 * 螢幕是 2D，場景是 3D：要知道滑鼠指到哪個物件，要從相機朝滑鼠位置「射一條射線」，
 * 看它先撞到哪個 Mesh。這就是 Raycaster。
 */
const demo: DemoDefinition = {
	id: 'raycaster',
	title: '滑鼠互動',
	summary: '用 Raycaster 偵測 hover 與點擊；拖曳畫面仍可旋轉視角。',
	concepts: [
		'Raycaster.setFromCamera(pointer, camera)：由相機穿過滑鼠位置射出射線',
		'滑鼠座標要轉成 NDC（標準化裝置座標）：x、y 都落在 -1 ~ 1，且 y 軸向上',
		'intersectObjects(list) 回傳依距離由近到遠排序的結果，第 0 個就是最前面的物件',
		'用 pointerdown / pointerup 的位移區分「點擊」與「拖曳」，避免旋轉視角時誤觸',
		'平滑過渡：每幀 lerp 一點點往目標值靠近，不要瞬間跳變',
		'Mesh 的 userData 可以掛自己的資料，這裡存每個方塊的格子座標與選取狀態',
	],
	controls: [
		{ key: 'lift', label: 'hover 抬升', type: 'range', min: 0, max: 1.5, step: 0.1, value: 0.6 },
		{ key: 'hover', label: 'hover 顏色', type: 'color', value: '#f0883e' },
	],
	setup({ scene, camera, canvas, params, setStatus }) {
		camera.position.set(0, 7, 8)

		const cubes: Mesh<BoxGeometry, MeshStandardMaterial>[] = []
		const geometry = new BoxGeometry(1, 1, 1)
		const offset = ((GRID - 1) * SPACING) / 2
		for (let row = 0; row < GRID; row++) {
			for (let col = 0; col < GRID; col++) {
				const cube = new Mesh(geometry, new MeshStandardMaterial({ color: BASE_COLOR }))
				cube.position.set(col * SPACING - offset, 0, row * SPACING - offset)
				cube.userData = { row, col, picked: false }
				scene.add(cube)
				cubes.push(cube)
			}
		}
		scene.add(new AmbientLight(0xffffff, 0.8))
		const sun = new DirectionalLight(0xffffff, 2.2)
		sun.position.set(3, 8, 4)
		scene.add(sun)

		const raycaster = new Raycaster()
		const pointer = new Vector2(2, 2) // 一開始放在畫面外（NDC 範圍是 -1~1），避免誤判 hover
		let hovered: (typeof cubes)[number] | null = null
		let downX = 0
		let downY = 0

		/** 把滑鼠位置換成 NDC：先除以 canvas 尺寸變 0~1，再展開成 -1~1，y 軸翻轉 */
		function updatePointer(event: PointerEvent) {
			const rect = canvas.getBoundingClientRect()
			pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
			pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
		}

		function onPointerMove(event: PointerEvent) {
			updatePointer(event)
		}
		function onPointerLeave() {
			pointer.set(2, 2)
		}
		function onPointerDown(event: PointerEvent) {
			downX = event.clientX
			downY = event.clientY
		}
		function onPointerUp(event: PointerEvent) {
			if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_MAX_MOVE) return
			if (!hovered) return
			hovered.userData.picked = !hovered.userData.picked
			const picked = cubes.filter((cube) => cube.userData.picked).length
			setStatus(`已選取 ${picked} 個方塊`)
		}

		canvas.addEventListener('pointermove', onPointerMove)
		canvas.addEventListener('pointerleave', onPointerLeave)
		canvas.addEventListener('pointerdown', onPointerDown)
		canvas.addEventListener('pointerup', onPointerUp)

		const target = new Color()
		const hoverColor = new Color()

		return {
			update(delta) {
				raycaster.setFromCamera(pointer, camera)
				const hit = raycaster.intersectObjects(cubes)[0]
				const next = (hit?.object as (typeof cubes)[number] | undefined) ?? null
				if (next !== hovered) {
					hovered = next
					canvas.style.cursor = next ? 'pointer' : ''
					if (next) setStatus(`指到第 ${next.userData.row + 1} 列、第 ${next.userData.col + 1} 行`)
				}

				hoverColor.set(params.hover as string)
				// 1 - e^(-k·delta) 的平滑係數：不管幀率多少，過渡時間都一樣
				const ease = 1 - Math.exp(-12 * delta)
				for (const cube of cubes) {
					const isHover = cube === hovered
					const targetY = isHover ? Number(params.lift) : 0
					cube.position.y += (targetY - cube.position.y) * ease
					target.set(isHover ? hoverColor : cube.userData.picked ? PICKED_COLOR : BASE_COLOR)
					cube.material.color.lerp(target, ease)
				}
			},
			dispose() {
				canvas.style.cursor = ''
				canvas.removeEventListener('pointermove', onPointerMove)
				canvas.removeEventListener('pointerleave', onPointerLeave)
				canvas.removeEventListener('pointerdown', onPointerDown)
				canvas.removeEventListener('pointerup', onPointerUp)
			},
		}
	},
}

export default demo
