<template>
  <label class="flex flex-col gap-2 text-xs font-medium text-slate-500">
    <span class="text-[11px] text-slate-500"><slot /></span>
    <component
      :is="as"
      :value="modelValue"
      :type="as === 'input' ? type : undefined"
      :rows="as === 'textarea' ? rows : undefined"
      :placeholder="placeholder"
      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      @input="onInput"
    ></component>
  </label>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [ String, Number ],
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  as: {
    type: String,
    default: "input",
  },
  rows: {
    type: Number,
    default: 3,
  },
});

const emit = defineEmits( [ "update:modelValue" ] );

function onInput( event ) {
  emit( "update:modelValue", event.target.value );
}
</script>
