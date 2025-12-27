<template>
  <BaseModal :open="open" :title="titleText" max-width-class="max-w-3xl" @close="emitClose">
    <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="submit">
      <div
        v-if="columns.length === 0"
        class="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400"
      >
        No fields yet. Add columns in settings.
      </div>
      <template v-for="column in columns" :key="column.key">
        <div
          v-if="column.type === 'boolean'"
          :class="[
            'flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3',
            column.fullWidth ? 'sm:col-span-2' : '',
          ]"
        >
          <span class="text-xs font-medium text-slate-500">{{ column.label }}</span>
          <input
            v-model="formData[column.key]"
            class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200"
            type="checkbox"
          />
        </div>
        <FieldInput
          v-else
          v-model="formData[column.key]"
          :type="resolveInputType(column.type)"
          :as="column.type === 'textarea' ? 'textarea' : 'input'"
          :rows="column.type === 'textarea' ? 4 : 3"
          :class="column.fullWidth || column.type === 'textarea' ? 'sm:col-span-2' : ''"
          :placeholder="column.label"
        >
          {{ column.label }}
        </FieldInput>
      </template>
      <div class="sm:col-span-2">
        <div class="flex items-center justify-between gap-4">
          <button
            v-if="isEditing"
            class="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:-translate-y-0.5"
            type="button"
            @click="requestDelete"
          >
            Delete
          </button>
          <div v-else class="text-[11px] text-slate-400">Add fields anytime</div>
          <button
            class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5"
            type="submit"
          >
            Save
          </button>
        </div>
        <div class="mt-3 h-10 rounded-2xl border border-dashed border-slate-200"></div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import BaseModal from "./BaseModal.vue";
import FieldInput from "./FieldInput.vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  contact: {
    type: Object,
    default: null,
  },
  columns: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits( [ "close", "save", "delete" ] );

const isEditing = computed( () => Boolean( props.contact?.id ) );
const titleText = computed( () => ( isEditing.value ? "Edit contact" : "New contact" ) );

const formData = ref( {} );

function resetForm() {
  formData.value = {};
}

function hydrateForm( contact ) {
  const data = {};
  props.columns.forEach( ( column ) => {
    const value = getValueByKey( contact || {}, column.key );
    if ( column.type === "boolean" ) {
      data[ column.key ] = Boolean( value );
      return;
    }
    data[ column.key ] = value ?? "";
  } );
  formData.value = data;
}

function emitClose() {
  emit( "close" );
}

function submit() {
  const payload = { id: props.contact?.id };
  props.columns.forEach( ( column ) => {
    const rawValue = formData.value[ column.key ];
    const value = coerceValue( column.type, rawValue );
    setValueByKey( payload, column.key, value );
  } );
  emit( "save", payload );
}

function requestDelete() {
  if ( props.contact?.id ) {
    emit( "delete", props.contact.id );
  }
}

function getValueByKey( contact, key ) {
  if ( !key ) return "";
  return key.split( "." ).reduce( ( acc, segment ) => {
    if ( acc && typeof acc === "object" ) {
      return acc[ segment ];
    }
    return undefined;
  }, contact ) ?? "";
}

function setValueByKey( contact, key, value ) {
  if ( !key ) return;
  const segments = key.split( "." );
  let pointer = contact;
  segments.forEach( ( segment, index ) => {
    if ( index === segments.length - 1 ) {
      pointer[ segment ] = value;
      return;
    }
    if ( !pointer[ segment ] || typeof pointer[ segment ] !== "object" ) {
      pointer[ segment ] = {};
    }
    pointer = pointer[ segment ];
  } );
}

function resolveInputType( type ) {
  if ( type === "email" ) return "email";
  if ( type === "phone" ) return "tel";
  if ( type === "number" ) return "number";
  if ( type === "zip" ) return "text";
  if ( type === "state" ) return "text";
  return "text";
}

function coerceValue( type, value ) {
  if ( type === "number" ) {
    if ( value === "" || value === null || value === undefined ) return null;
    const numberValue = Number( value );
    return Number.isNaN( numberValue ) ? null : numberValue;
  }
  if ( type === "boolean" ) {
    return Boolean( value );
  }
  return value ?? "";
}

watch(
  () => props.open,
  ( value ) => {
    if ( value ) {
      hydrateForm( props.contact );
      return;
    }
    resetForm();
  }
);

watch(
  () => props.contact,
  ( contact ) => {
    if ( props.open ) {
      hydrateForm( contact );
    }
  }
);

watch(
  () => props.columns,
  () => {
    if ( props.open ) {
      hydrateForm( props.contact );
    }
  },
  { deep: true }
);
</script>
