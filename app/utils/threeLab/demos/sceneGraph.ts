import {
	AmbientLight,
	AxesHelper,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PointLight,
	RingGeometry,
	SphereGeometry,
	DoubleSide,
} from 'three'
import type { DemoDefinition } from '../types'

/**
 * 03 · 場景圖（太陽 / 地球 / 月亮）
 * 物件可以互相包含：子物件的 position / rotation / scale 都是「相對於父物件」。
 * 轉動父物件，底下所有子孫會一起被帶著走。
 */
const demo: DemoDefinition = {
	id: 'sceneGraph',
	title: '場景圖',
	summary: '用父子層級做出太陽、地球、月亮的公轉與自轉。',
	concepts: [
		'Object3D.add(child)：形成父子關係，子物件的座標是相對父物件的區域座標',
		'Group 是沒有形狀的空容器，專門拿來當「樞紐」：轉動它，裡面的東西繞著它公轉',
		'地球「公轉」= 轉 earthPivot；地球「自轉」= 轉 earth 本身，兩件事分開處理',
		'月亮掛在地球樞紐底下，所以會跟著地球繞太陽，同時自己繞地球',
		'Mesh 的 rotation 單位是弧度；一圈是 Math.PI * 2',
	],
	controls: [
		{ key: 'orbit', label: '公轉速度', type: 'range', min: 0, max: 3, step: 0.1, value: 1 },
		{ key: 'spin', label: '自轉速度', type: 'range', min: 0, max: 5, step: 0.1, value: 1.5 },
		{ key: 'axes', label: '顯示座標軸', type: 'checkbox', value: true },
	],
	setup({ scene, camera, params }) {
		camera.position.set(0, 9, 9)

		// 太陽：自己發光、用 MeshBasicMaterial（不受光影響）；真正的光來自它內部的 PointLight
		const sun = new Mesh(new SphereGeometry(1.2, 32, 16), new MeshBasicMaterial({ color: 0xffb84d }))
		const sunLight = new PointLight(0xffffff, 120, 0, 2)
		sun.add(sunLight)

		// 地球的公轉樞紐放在太陽中心，地球本體往外推 5 單位
		const earthPivot = new Group()
		const earth = new Mesh(
			new SphereGeometry(0.5, 24, 16),
			new MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.8 })
		)
		earth.position.x = 5
		earthPivot.add(earth)

		// 月亮的樞紐放在地球身上：它的原點 = 地球中心
		const moonPivot = new Group()
		const moon = new Mesh(new SphereGeometry(0.18, 16, 12), new MeshStandardMaterial({ color: 0xcbd5e1, roughness: 1 }))
		moon.position.x = 1.1
		moonPivot.add(moon)
		earth.add(moonPivot)

		// 軌道環只是裝飾，躺平在 XZ 平面
		const ring = new Mesh(
			new RingGeometry(4.98, 5.02, 96),
			new MeshBasicMaterial({ color: 0x30363d, side: DoubleSide })
		)
		ring.rotation.x = -Math.PI / 2

		const axes = [new AxesHelper(1.8), new AxesHelper(1), new AxesHelper(0.5)]
		sun.add(axes[0]!)
		earth.add(axes[1]!)
		moon.add(axes[2]!)

		scene.add(sun, earthPivot, ring, new AmbientLight(0xffffff, 0.25))

		return {
			update(delta) {
				const orbit = Number(params.orbit)
				const spin = Number(params.spin)
				earthPivot.rotation.y += delta * 0.5 * orbit // 地球繞太陽
				earth.rotation.y += delta * spin // 地球自轉
				moonPivot.rotation.y += delta * 2 * orbit // 月亮繞地球
				for (const axis of axes) axis.visible = Boolean(params.axes)
			},
		}
	},
}

export default demo
