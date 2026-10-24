<template>
	<div class="mb-4">
		<label class="mb-1.5 block text-xs font-medium tracking-widest text-gray-400 uppercase">
			{{ label }}
		</label>
		<van-field v-model="model" v-bind="$attrs"
			class="rounded-xl! border! border-gray-200! bg-gray-50! focus-within:border-primary! focus-within:bg-surface-card! focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_12%,transparent)]!" />
	</div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ label: string }>()

const model = defineModel<string>()
</script>
