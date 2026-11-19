import { AxesHelper, BoxGeometry, GridHelper, Mesh, MeshNormalMaterial } from 'three'
import type { DemoDefinition } from '../types'

/**
 * 01 · 第一個方塊
 * three.js 的世界由三樣東西組成：Geometry（形狀）+ Material（表面）= Mesh（可被渲染的物件）。
 * scene / camera / renderer 與 render loop 在 runner.ts，這裡只負責「往場景裡放東西」。
 */
const demo: DemoDefinition = {
	id: 'helloCube',
	title: '第一個方塊',
	summary: '最小的 three.js 場景：一個 Mesh、一個每幀更新的旋轉。',
	concepts: [
		'Mesh = Geometry（形狀）+ Material（表面）',
		'Scene 是放物件的世界，Camera 決定從哪看，Renderer 把畫面畫到 canvas',
		'update(delta) 的 delta 是秒數：用 速度 × delta 轉動，幀率不同速度也一致',
		'AxesHelper：紅 X、綠 Y、藍 Z；GridHelper 是地面參考線',
		'MeshNormalMaterial 依表面朝向上色，不需要光源，適合快速檢視形狀',
	],
	controls: [
		{ key: 'speed', label: '轉速', type: 'range', min: 0, max: 3, step: 0.1, value: 1 },
		{ key: 'size', label: '大小', type: 'range', min: 0.5, max: 2, step: 0.1, value: 1 },
		{ key: 'wireframe', label: '線框', type: 'checkbox', value: false },
	],
	setup({ scene, params }) {
		const material = new MeshNormalMaterial()
		const cube = new Mesh(new BoxGeometry(1.5, 1.5, 1.5), material)
		scene.add(cube)
		scene.add(new AxesHelper(3), new GridHelper(10, 10, 0x30363d, 0x21262d))

		return {
			update(delta) {
				// 旋轉單位是弧度；乘上 delta 讓速度與幀率無關
				cube.rotation.x += delta * Number(params.speed) * 0.6
				cube.rotation.y += delta * Number(params.speed)
				cube.scale.setScalar(Number(params.size))
				material.wireframe = Boolean(params.wireframe)
			},
		}
	},
}

export default demo
