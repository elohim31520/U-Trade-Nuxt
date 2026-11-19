import { Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { DemoDefinition } from '../types'

// 頂點著色器：每個「頂點」跑一次，決定頂點最後落在螢幕哪裡。
// 這裡把頂點沿 z（平面的法線方向）抬高，抬多高由兩個方向的正弦波相加決定。
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFrequency;
  uniform float uAmplitude;
  varying float vHeight; // varying：頂點著色器算出來，GPU 插值後交給片段著色器

  void main() {
    vec3 pos = position;
    float wave = sin(pos.x * uFrequency + uTime) + sin(pos.y * uFrequency * 0.8 + uTime * 1.3);
    pos.z += wave * uAmplitude;
    vHeight = wave * 0.25 + 0.5; // 把 -2~2 大致壓到 0~1，給上色用

    // projectionMatrix * modelViewMatrix * 位置：把頂點從模型空間一路轉到螢幕裁切空間
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// 片段著色器：每個「像素」跑一次，決定那個像素的顏色。
const fragmentShader = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  varying float vHeight;

  void main() {
    vec3 color = mix(uColorLow, uColorHigh, clamp(vHeight, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
    // ShaderMaterial 不會自動做色彩空間轉換；少了這行顏色會比預期暗、偏灰
    #include <colorspace_fragment>
  }
`

/**
 * 05 · 自訂 Shader
 * 內建材質不夠用時，用 ShaderMaterial 自己寫 GLSL，在 GPU 上逐頂點、逐像素運算。
 */
const demo: DemoDefinition = {
	id: 'shader',
	title: '自訂 Shader',
	summary: '用 GLSL 寫一片會起伏、依高度變色的波浪。',
	concepts: [
		'ShaderMaterial = 自己寫頂點著色器（改形狀）與片段著色器（改顏色）',
		'uniform：從 JS 傳給 GPU 的唯讀參數，每幀改 uniforms.uTime.value 就會動',
		'varying：頂點著色器 → 片段著色器的傳遞管道，GPU 會在兩者之間自動插值',
		'平面要切很多格（PlaneGeometry 的後兩個參數）才有足夠頂點可以起伏',
		'顏色計算在 GPU 上平行跑，幾萬個頂點的波動幾乎不花 CPU',
	],
	controls: [
		{ key: 'frequency', label: '波長', type: 'range', min: 0.5, max: 4, step: 0.1, value: 1.5 },
		{ key: 'amplitude', label: '振幅', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
		{ key: 'speed', label: '波速', type: 'range', min: 0, max: 4, step: 0.1, value: 1.2 },
		{ key: 'low', label: '低處顏色', type: 'color', value: '#0b3d91' },
		{ key: 'high', label: '高處顏色', type: 'color', value: '#7dd3fc' },
		{ key: 'wireframe', label: '線框', type: 'checkbox', value: false },
	],
	setup({ scene, camera, params }) {
		camera.position.set(0, 4, 6)

		const material = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			side: DoubleSide,
			uniforms: {
				uTime: { value: 0 },
				uFrequency: { value: 1.5 },
				uAmplitude: { value: 0.35 },
				uColorLow: { value: new Color() },
				uColorHigh: { value: new Color() },
			},
		})

		const plane = new Mesh(new PlaneGeometry(8, 8, 128, 128), material)
		plane.rotation.x = -Math.PI / 2
		scene.add(plane)

		return {
			update(_delta, elapsed) {
				const { uniforms } = material
				uniforms.uTime!.value = elapsed * Number(params.speed)
				uniforms.uFrequency!.value = Number(params.frequency)
				uniforms.uAmplitude!.value = Number(params.amplitude)
				uniforms.uColorLow!.value.set(params.low as string)
				uniforms.uColorHigh!.value.set(params.high as string)
				material.wireframe = Boolean(params.wireframe)
			},
		}
	},
}

export default demo
