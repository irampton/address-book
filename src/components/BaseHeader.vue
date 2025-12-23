<template>
  <header class="mx-auto max-w-4xl px-6 pb-6 pt-12">
    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
      Address Book
    </p>
    <h1 class="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
      <slot />
    </h1>
    <p v-if="subtitle" class="mt-3 max-w-2xl text-base text-slate-600">
      {{ subtitle }}
    </p>
  </header>
</template>

<script setup>
defineProps({
  subtitle: {
    type: String,
    default: "",
  },
});
</script>
