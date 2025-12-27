<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
    <div class="absolute inset-0 bg-white/80" @click="emitClose"></div>
    <div
      :class="[
        'relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl',
        maxWidthClass,
      ]"
    >
      <div v-if="hasHeader" class="flex items-center justify-between">
        <div class="text-xs font-semibold text-slate-500">
          <slot name="title">{{ title }}</slot>
        </div>
        <button class="text-slate-400 transition hover:text-slate-700" type="button" @click="emitClose">✕</button>
      </div>
      <div :class="['mt-6 flex-1 overflow-y-auto pr-2', bodyClass]">
        <slot />
      </div>
      <div v-if="$slots.footer" class="mt-6">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, useSlots, watch } from "vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  maxWidthClass: {
    type: String,
    default: "max-w-2xl",
  },
  bodyClass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits( [ "close" ] );
const slots = useSlots();
const hasHeader = computed( () => Boolean( props.title || slots.title ) );

function emitClose() {
  emit( "close" );
}

function handleKeydown( event ) {
  if ( event.key === "Escape" ) {
    emitClose();
  }
}

watch(
  () => props.open,
  ( isOpen ) => {
    if ( isOpen ) {
      window.addEventListener( "keydown", handleKeydown );
      return;
    }
    window.removeEventListener( "keydown", handleKeydown );
  },
  { immediate: true }
);

onBeforeUnmount( () => {
  window.removeEventListener( "keydown", handleKeydown );
} );
</script>
