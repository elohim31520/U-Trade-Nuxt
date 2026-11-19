/**
 * three.js Lab 的 demo 清單。新增一個 demo：
 *   1. 複製 demos/ 底下任一檔，改 id（要等於檔名）、title、controls 與 setup()
 *   2. 在下面 import 它並加進 DEMOS
 * 頁面（pages/dev/three.vue）會自動多一個分頁、控制面板，並在「原始碼」分頁顯示這個檔案。
 */
import type { DemoDefinition } from './types'
import helloCube from './demos/helloCube'
import lightsMaterials from './demos/lightsMaterials'
import sceneGraph from './demos/sceneGraph'
import particles from './demos/particles'
import shader from './demos/shader'
import raycaster from './demos/raycaster'

export const DEMOS: DemoDefinition[] = [helloCube, lightsMaterials, sceneGraph, particles, shader, raycaster]

// ?raw 會把檔案當成字串載入，讓頁面能顯示 demo 的原始碼；用到才載入，不會一次全抓
const sourceLoaders = import.meta.glob('./demos/*.ts', {
	query: '?raw',
	import: 'default',
}) as Record<string, () => Promise<string>>

export async function loadDemoSource(id: string): Promise<string> {
	return (await sourceLoaders[`./demos/${id}.ts`]?.()) ?? ''
}
