import {
	AmbientLight,
	DirectionalLight,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
	PMREMGenerator,
	PointLight,
	SphereGeometry,
	TorusKnotGeometry,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { DemoDefinition } from '../types'

/**
 * 02 · 光源與材質
 * MeshStandardMaterial 是 PBR（物理基礎渲染）材質：外觀由 metalness / roughness 決定，
 * 而且「需要光」才看得到，沒有光就是一片黑。
 */
const demo: DemoDefinition = {
	id: 'lightsMaterials',
	title: '光源與材質',
	summary: '調整金屬度與粗糙度，看光源、陰影與環境反射如何影響外觀。',
	concepts: [
		'PBR 材質：metalness（0 塑膠～1 金屬）、roughness（0 鏡面～1 霧面）',
		'AmbientLight 均勻補光、DirectionalLight 像太陽的平行光、PointLight 像燈泡',
		'陰影要三處都開：renderer.shadowMap.enabled、light.castShadow、mesh.castShadow / receiveShadow',
		'金屬只反射周圍環境：沒有 scene.environment 時 metalness = 1 會接近全黑',
		'PMREMGenerator 把環境（這裡是 RoomEnvironment 的假攝影棚）預先模糊成各粗糙度的反射貼圖',
	],
	controls: [
		{ key: 'color', label: '顏色', type: 'color', value: '#e5484d' },
		{ key: 'metalness', label: '金屬度', type: 'range', min: 0, max: 1, step: 0.01, value: 0.6 },
		{ key: 'roughness', label: '粗糙度', type: 'range', min: 0, max: 1, step: 0.01, value: 0.3 },
		{ key: 'light', label: '點光源強度', type: 'range', min: 0, max: 80, step: 1, value: 40 },
		{ key: 'orbit', label: '點光源繞行', type: 'checkbox', value: true },
		{ key: 'env', label: '環境反射', type: 'checkbox', value: true },
	],
	setup({ scene, renderer, camera, params }) {
		camera.position.set(3, 2.5, 5)

		const material = new MeshStandardMaterial({ color: params.color as string })
		const knot = new Mesh(new TorusKnotGeometry(0.9, 0.3, 160, 24), material)
		knot.position.y = 1.4
		knot.castShadow = true

		const floor = new Mesh(new PlaneGeometry(12, 12), new MeshStandardMaterial({ color: 0x21262d, roughness: 0.9 }))
		floor.rotation.x = -Math.PI / 2 // PlaneGeometry 預設立在 XY 平面，轉 -90° 躺到地上
		floor.receiveShadow = true

		// 小球標示點光源位置，不然看不出光從哪來
		const bulb = new Mesh(new SphereGeometry(0.08), new MeshStandardMaterial({ emissive: 0xffffff }))
		const pointLight = new PointLight(0xffffff, 40, 20)
		pointLight.castShadow = true
		pointLight.add(bulb)

		const sun = new DirectionalLight(0xffffff, 1.2)
		sun.position.set(-4, 6, 3)
		sun.castShadow = true

		scene.add(knot, floor, pointLight, sun, new AmbientLight(0xffffff, 0.15))

		const pmrem = new PMREMGenerator(renderer)
		const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

		return {
			update(_delta, elapsed) {
				material.color.set(params.color as string)
				material.metalness = Number(params.metalness)
				material.roughness = Number(params.roughness)
				pointLight.intensity = Number(params.light)
				scene.environment = params.env ? environment : null

				if (params.orbit) {
					pointLight.position.set(Math.cos(elapsed) * 2.5, 2.2, Math.sin(elapsed) * 2.5)
				}
				knot.rotation.y = elapsed * 0.3
			},
			dispose() {
				// 環境貼圖與 PMREMGenerator 不在場景的物件樹上，runner 掃不到，要自己釋放
				scene.environment = null
				environment.dispose()
				pmrem.dispose()
			},
		}
	},
}

export default demo
