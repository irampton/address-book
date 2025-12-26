<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-white/80" @click="emitClose"></div>
    <div class="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
      <div class="flex items-center justify-between">
        <div class="text-xs font-semibold text-slate-500">{{ titleText }}</div>
        <button class="text-slate-400 transition hover:text-slate-700" type="button" @click="emitClose">✕</button>
      </div>
      <form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="submit">
        <FieldInput v-model="form.first_name" placeholder="First name">
          First
        </FieldInput>
        <FieldInput v-model="form.last_name" placeholder="Last name">
          Last
        </FieldInput>
        <FieldInput v-model="form.email" type="email" placeholder="Email">
          Email
        </FieldInput>
        <FieldInput v-model="form.phone" placeholder="Phone">
          Phone
        </FieldInput>
        <FieldInput v-model="form.address.line1" class="sm:col-span-2" placeholder="Address line 1">
          Address line 1
        </FieldInput>
        <FieldInput v-model="form.address.line2" class="sm:col-span-2" placeholder="Address line 2">
          Address line 2
        </FieldInput>
        <FieldInput v-model="form.address.city" placeholder="City">
          City
        </FieldInput>
        <FieldInput v-model="form.address.state" placeholder="State">
          State
        </FieldInput>
        <FieldInput v-model="form.address.postal_code" placeholder="Postal code">
          Postal
        </FieldInput>
        <FieldInput v-model="form.address.country" placeholder="Country">
          Country
        </FieldInput>
        <FieldInput v-model="form.notes" as="textarea" rows="3" class="sm:col-span-2" placeholder="Notes">
          Notes
        </FieldInput>
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
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
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
});

const emit = defineEmits( [ "close", "save", "delete" ] );

const isEditing = computed( () => Boolean( props.contact?.id ) );
const titleText = computed( () => ( isEditing.value ? "Edit contact" : "New contact" ) );

const form = reactive( {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  },
  notes: "",
} );

function resetForm() {
  form.first_name = "";
  form.last_name = "";
  form.email = "";
  form.phone = "";
  form.address = {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  };
  form.notes = "";
}

function hydrateForm( contact ) {
  form.first_name = contact?.first_name || "";
  form.last_name = contact?.last_name || "";
  form.email = contact?.email || "";
  form.phone = contact?.phone || "";
  form.address = {
    line1: contact?.address?.line1 || "",
    line2: contact?.address?.line2 || "",
    city: contact?.address?.city || "",
    state: contact?.address?.state || "",
    postal_code: contact?.address?.postal_code || "",
    country: contact?.address?.country || "",
  };
  form.notes = contact?.notes || "";
}

function emitClose() {
  emit( "close" );
}

function submit() {
  emit( "save", {
    id: props.contact?.id,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone,
    address: { ...form.address },
    notes: form.notes,
  } );
}

function requestDelete() {
  if ( props.contact?.id ) {
    emit( "delete", props.contact.id );
  }
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
</script>
