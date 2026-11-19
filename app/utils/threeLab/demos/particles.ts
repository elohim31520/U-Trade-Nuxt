import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	Color,
	Points,
	PointsMaterial,
	SRGBColorSpace,
} from 'three'
import type { DemoDefinition } from '../types'

const MAX_COUNT = 30000
const ARMS = 5

/** 預設的粒子是方塊；畫一張中心亮、邊緣透明的圓點貼圖讓它變圓、發光 */
function createDotTexture() {
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = 64
	const ctx = canvas.getContext('2d')!
	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
	gradient.addColorStop(0, 'rgba(255,255,255,1)')
	gradient.addColorStop(0.4, 'rgba(255,255,255,0.35)')
	gradient.addColorStop(1, 'rgba(255,255,255,0)')
	ctx.fillStyle = gradient
	ctx.fillRect(0, 0, 64, 64)
	const texture = new CanvasTexture(canvas)
	texture.colorSpace = SRGBColorSpace
	return texture
}

/**
 * 04 · 粒子（螺旋星系）
 * 幾萬個點不能做成幾萬個 Mesh（每個 Mesh 一次 draw call）。
 * 正確做法是一個 Points + 一份 BufferGeometry，所有點的資料塞進同一組陣列，GPU 一次畫完。
 */
const demo: DemoDefinition = {
	id: 'particles',
	title: '粒子',
	summary: '用 Points 與 BufferGeometry 畫出三萬顆星的螺旋星系，並每幀更新位置。',
	concepts: [
		'BufferGeometry + BufferAttribute：自己定義頂點資料（position、color 各是 Float32Array）',
		'陣列是「平的」：每 3 個數字一個點的 x, y, z，所以索引是 i * 3',
		'修改 attribute.array 之後要設 attribute.needsUpdate = true，GPU 才會收到新資料',
		'geometry.setDrawRange(0, n)：只畫前 n 個點，改數量不用重建 geometry',
		'AdditiveBlending + depthWrite: false：重疊的點顏色相加，產生發光感',
	],
	controls: [
		{
			key: 'count',
			label: '數量',
			type: 'range',
			min: 1000,
			max: MAX_COUNT,
			step: 1000,
			value: 15000,
		},
		{ key: 'size', label: '點大小', type: 'range', min: 0.02, max: 0.3, step: 0.01, value: 0.1 },
		{ key: 'speed', label: '旋轉速度', type: 'range', min: 0, max: 1, step: 0.05, value: 0.15 },
		{ key: 'wave', label: '波動幅度', type: 'range', min: 0, max: 1, step: 0.05, value: 0.3 },
		{ key: 'inner', label: '核心顏色', type: 'color', value: '#ffb84d' },
		{ key: 'outer', label: '外圈顏色', type: 'color', value: '#3b82f6' },
	],
	setup({ scene, camera, params }) {
		camera.position.set(0, 4, 7)

		const positions = new Float32Array(MAX_COUNT * 3)
		const colors = new Float32Array(MAX_COUNT * 3)
		// 每顆星在水平面上的位置不會變，波動只改 y；先記下半徑與角度，update 時才算得出 y
		const radii = new Float32Array(MAX_COUNT)
		const angles = new Float32Array(MAX_COUNT)
		const spread = new Float32Array(MAX_COUNT * 2) // x / z 的隨機偏移，讓旋臂有厚度

		for (let i = 0; i < MAX_COUNT; i++) {
			const radius = Math.pow(Math.random(), 1.6) * 5 // 次方讓星星集中在核心
			const arm = ((i % ARMS) / ARMS) * Math.PI * 2
			const angle = arm + radius * 0.9 // 半徑越大轉越多 → 螺旋
			radii[i] = radius
			angles[i] = angle
			const scatter = 0.12 + radius * 0.06
			spread[i * 2] = (Math.random() - 0.5) * scatter * 2
			spread[i * 2 + 1] = (Math.random() - 0.5) * scatter * 2
			positions[i * 3] = Math.cos(angle) * radius + spread[i * 2]!
			positions[i * 3 + 2] = Math.sin(angle) * radius + spread[i * 2 + 1]!
		}

		const geometry = new BufferGeometry()
		geometry.setAttribute('position', new BufferAttribute(positions, 3))
		geometry.setAttribute('color', new BufferAttribute(colors, 3))

		const material = new PointsMaterial({
			size: 0.1,
			map: createDotTexture(),
			vertexColors: true,
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
		})
		const galaxy = new Points(geometry, material)
		scene.add(galaxy)

		const inner = new Color()
		const outer = new Color()
		const mixed = new Color()
		let lastInner = ''
		let lastOuter = ''

		function paintColors() {
			inner.set(params.inner as string)
			outer.set(params.outer as string)
			for (let i = 0; i < MAX_COUNT; i++) {
				mixed.copy(inner).lerp(outer, radii[i]! / 5) // 半徑越大越偏外圈色
				colors[i * 3] = mixed.r
				colors[i * 3 + 1] = mixed.g
				colors[i * 3 + 2] = mixed.b
			}
			geometry.attributes.color!.needsUpdate = true
		}

		return {
			update(_delta, elapsed) {
				galaxy.rotation.y = elapsed * Number(params.speed)
				material.size = Number(params.size)
				geometry.setDrawRange(0, Number(params.count))

				// 顏色改了才重算，三萬顆每幀重算沒有必要
				if (params.inner !== lastInner || params.outer !== lastOuter) {
					lastInner = params.inner as string
					lastOuter = params.outer as string
					paintColors()
				}

				// 只更新畫得到的那些點
				const wave = Number(params.wave)
				const count = Number(params.count)
				for (let i = 0; i < count; i++) {
					positions[i * 3 + 1] = Math.sin(elapsed * 1.5 + radii[i]! * 2 + angles[i]!) * wave * 0.25
				}
				geometry.attributes.position!.needsUpdate = true
			},
		}
	},
}

export default demo
