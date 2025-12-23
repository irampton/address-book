<template>
  <label class="flex flex-col gap-2 text-sm font-medium text-slate-700">
    {{ label }}
    <input
      :placeholder="placeholder"
      :type="type"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
    />
  </label>
</template>

<script setup>
defineProps({
  label: {
    type: String,
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
});
</script>
