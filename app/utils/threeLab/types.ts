import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'

/** 控制面板上的參數值；頁面把它做成 reactive，demo 在 update() 裡每幀讀最新值。 */
export type ParamValue = number | string | boolean
export type Params = Record<string, ParamValue>

/** 控制面板的一個控制項，頁面依 type 畫成滑桿／色票／勾選框。 */
export type ControlDef =
	| {
			key: string
			label: string
			type: 'range'
			min: number
			max: number
			step: number
			value: number
	  }
	| { key: string; label: string; type: 'color'; value: string }
	| { key: string; label: string; type: 'checkbox'; value: boolean }

/** runner 交給 demo 的東西：場景是空的，demo 自己往裡面加東西。 */
export interface DemoContext {
	scene: Scene
	camera: PerspectiveCamera
	renderer: WebGLRenderer
	canvas: HTMLCanvasElement
	controls: OrbitControls
	params: Params
	/** 在畫布下方的狀態列顯示一行字（例如 hover 到哪個物件） */
	setStatus: (text: string) => void
}

export interface DemoInstance {
	/** 每幀呼叫；delta 是距離上一幀的秒數，elapsed 是 demo 載入後經過的秒數 */
	update?: (delta: number, elapsed: number) => void
	/**
	 * 切換 demo 時呼叫。場景裡的 geometry / material / texture 由 runner 統一釋放，
	 * 這裡只需要清「three.js 不知道的東西」：事件監聽、PMREMGenerator、scene.environment 等。
	 */
	dispose?: () => void
}

export interface DemoDefinition {
	/** 同時是 demos/ 底下的檔名（不含 .ts），頁面用它撈原始碼 */
	id: string
	title: string
	summary: string
	/** 這個 demo 要學的概念，一條一行 */
	concepts: string[]
	controls: ControlDef[]
	setup: (ctx: DemoContext) => DemoInstance | undefined
}
