/**
 * three.js 的「外框」：renderer、camera、OrbitControls、resize、render loop 與釋放資源。
 * demo 只管往 scene 裡加東西，這些每個專案都一樣的雜務集中在這裡。
 *
 * 一個 three.js 程式的最小骨架就是這四樣：
 *   scene（放東西的世界）+ camera（從哪看）+ renderer（畫到 canvas）+ render loop（每幀重畫）
 * 想看最精簡的版本，直接看 demos/helloCube.ts 加上本檔的 frame() 即可。
 */
import { Color, Mesh, PCFSoftShadowMap, PerspectiveCamera, Points, Scene, Timer, WebGLRenderer } from 'three'
import type { Material, Texture } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { DemoDefinition, DemoInstance, Params } from './types'

const BACKGROUND = '#0d1117'

/** 釋放場景裡所有 geometry / material / texture；three.js 的 GPU 資源不會被 JS 垃圾回收 */
function disposeScene(scene: Scene) {
	scene.traverse((object) => {
		if (!(object instanceof Mesh || object instanceof Points)) return
		object.geometry.dispose()
		const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material]
		for (const material of materials) {
			// 材質上的貼圖（map、normalMap …）也要一併釋放
			for (const value of Object.values(material)) {
				if ((value as Texture | undefined)?.isTexture) (value as Texture).dispose()
			}
			material.dispose()
		}
	})
}

export interface Lab {
	load: (demo: DemoDefinition, params: Params) => void
	destroy: () => void
}

export function createLab(canvas: HTMLCanvasElement, host: HTMLElement, onStatus: (text: string) => void): Lab {
	const renderer = new WebGLRenderer({ canvas, antialias: true })
	// 高 DPR 螢幕上畫 3 倍像素很吃效能，限制在 2 倍
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = PCFSoftShadowMap

	const camera = new PerspectiveCamera(50, 1, 0.1, 200)
	// 拖曳旋轉、滾輪縮放、右鍵平移；每個 demo 都能用滑鼠環顧
	const controls = new OrbitControls(camera, canvas)
	controls.enableDamping = true

	// Clock 在 r183 之後棄用，改用 Timer
	const timer = new Timer()

	let scene = new Scene()
	let instance: DemoInstance | undefined
	let frameId = 0
	let elapsed = 0

	function resize() {
		const { clientWidth: width, clientHeight: height } = host
		if (!width || !height) return
		// 第三個參數 false：不要讓 three.js 去改 canvas 的 CSS 尺寸，版面交給 CSS
		renderer.setSize(width, height, false)
		// 視窗比例變了，投影矩陣要跟著更新，否則畫面會被拉伸
		camera.aspect = width / height
		camera.updateProjectionMatrix()
	}
	const observer = new ResizeObserver(resize)
	observer.observe(host)
	resize()

	function frame(timestamp: number) {
		frameId = requestAnimationFrame(frame)
		timer.update(timestamp)
		const delta = timer.getDelta()
		elapsed += delta
		instance?.update?.(delta, elapsed)
		controls.update()
		renderer.render(scene, camera)
	}
	frameId = requestAnimationFrame(frame)

	function unload() {
		instance?.dispose?.()
		instance = undefined
		disposeScene(scene)
		scene.clear()
	}

	function load(demo: DemoDefinition, params: Params) {
		unload()
		scene = new Scene()
		scene.background = new Color(BACKGROUND)
		elapsed = 0
		onStatus('')

		// 每個 demo 從同一個預設視角開始，demo 自己想要別的再改
		camera.position.set(4, 3, 6)
		controls.target.set(0, 0, 0)
		controls.update()

		instance = demo.setup({
			scene,
			camera,
			renderer,
			canvas,
			controls,
			params,
			setStatus: onStatus,
		})
	}

	function destroy() {
		cancelAnimationFrame(frameId)
		observer.disconnect()
		unload()
		controls.dispose()
		timer.dispose()
		renderer.dispose()
	}

	return { load, destroy }
}
