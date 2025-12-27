<template>
  <main class="min-h-screen bg-white text-slate-900">
    <div class="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 pb-12 pt-6 sm:px-8">
      <header class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 bg-white/95 py-4 backdrop-blur">
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Add contact"
            title="Add"
            @click="openModal"
          >
            <PlusIcon class="h-5 w-5" />
          </button>
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Import contacts"
            title="Import"
            @click="openImportModal"
          >
            <ArrowDownTrayIcon class="h-5 w-5" />
          </button>
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Export contacts"
            title="Export"
            @click="openExportModal"
          >
            <ArrowUpTrayIcon class="h-5 w-5" />
          </button>
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Settings"
            title="Settings"
            @click="openSettingsModal"
          >
            <Cog6ToothIcon class="h-5 w-5" />
          </button>
        </div>
        <div class="text-xs font-semibold text-slate-500">{{ contacts.length }} Contacts</div>
        <div class="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
          <label class="relative w-full sm:w-72 md:w-96">
            <span class="sr-only">Search contacts</span>
            <MagnifyingGlassIcon class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              class="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 transition focus:border-slate-400 focus:outline-none"
              type="search"
              placeholder="Search all fields"
            />
          </label>
        </div>
      </header>

      <section class="mt-6 flex-1 rounded-3xl border border-slate-200 bg-white">
        <div class="overflow-x-auto">
          <table class="min-w-[1100px] w-full border-collapse text-left text-sm">
            <thead class="sticky top-0 bg-white text-xs text-slate-500">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  class="cursor-pointer border-b border-slate-200 px-4 py-4 font-semibold transition hover:text-slate-900"
                  @click="setSort(column.key)"
                >
                  <span class="inline-flex items-center gap-2">
                    {{ column.label }}
                    <span v-if="sortKey === column.key" class="text-[10px] text-slate-400">
                      {{ sortDirection === 'asc' ? '▲' : '▼' }}
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr v-if="sortedContacts.length === 0">
                <td :colspan="columns.length" class="px-4 py-10 text-center text-slate-400">
                  No contacts yet.
                </td>
              </tr>
              <tr
                v-for="contact in sortedContacts"
                :key="contact.id"
                class="cursor-pointer hover:bg-slate-50"
                @click="editContact(contact)"
              >
                <td
                  v-for="column in columns"
                  :key="column.key"
                  :class="['px-4 py-3', column.cellClass]"
                >
                  {{ column.getValue(contact) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <ContactModal
      :open="isModalOpen"
      :contact="selectedContact"
      :columns="columns"
      @close="closeModal"
      @save="saveContact"
      @delete="deleteContact"
    />

    <BaseModal
      :open="isImportOpen"
      title="Import contacts"
      max-width-class="max-w-4xl"
      @close="closeImportModal"
    >
      <div class="space-y-6">
        <div>
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">File</div>
          <input
            class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            @change="handleImportFile"
          />
          <div v-if="importFileName" class="mt-2 text-xs text-slate-400">{{ importFileName }}</div>
          <div v-if="importError" class="mt-2 text-xs text-rose-500">{{ importError }}</div>
        </div>

        <div v-if="importColumns.length">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Column mapping</div>
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span class="uppercase tracking-[0.2em] text-slate-400">Default</span>
              <select
                v-model="importFieldDefault"
                class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <option value="new">Add as new</option>
                <option value="skip">Skip</option>
              </select>
              <button
                class="rounded-full border border-slate-200 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                type="button"
                @click="applyImportDefault(true)"
              >
                Apply to all
              </button>
            </div>
          </div>
          <div class="mt-3 space-y-3">
            <div
              v-for="mapping in importColumnMappings"
              :key="mapping.importKey"
              class="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div class="grid gap-3 sm:grid-cols-[1fr,220px] sm:items-center">
                <div class="text-sm font-medium text-slate-700">{{ mapping.importKey }}</div>
                <select
                  v-model="mapping.targetKey"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Skip</option>
                  <option value="__new__">New column</option>
                  <option v-for="column in columns" :key="column.key" :value="column.key">
                    {{ column.label }}
                  </option>
                </select>
              </div>
              <div v-if="mapping.targetKey === '__new__'" class="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  v-model="mapping.newLabel"
                  class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  type="text"
                  placeholder="New column label"
                />
                <select
                  v-model="mapping.newType"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option v-for="fieldType in fieldTypes" :key="fieldType.value" :value="fieldType.value">
                    {{ fieldType.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div v-if="importRows.length">
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Row mapping</div>
          <div class="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100">
            <div v-for="(row, index) in importRows" :key="index" class="flex items-center gap-3 px-4 py-3">
              <div class="flex-1 text-sm text-slate-700">{{ importRowLabel(row, index) }}</div>
              <select
                v-model="importRowTargets[index]"
                class="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="new">Add as new</option>
                <option value="skip">Skip</option>
                <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                  {{ contactLabel(contact) }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between gap-4">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {{ importRows.length ? `${ importRows.length } rows ready` : "Select a file to continue" }}
          </div>
          <div class="flex items-center gap-3">
            <button
              class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:-translate-y-0.5"
              type="button"
              @click="closeImportModal"
            >
              Cancel
            </button>
            <button
              class="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              :disabled="!importRows.length"
              @click="confirmImport"
            >
              Import
            </button>
          </div>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      :open="isExportOpen"
      title="Export contacts"
      max-width-class="max-w-xl"
      @close="closeExportModal"
    >
      <div class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-[140px,1fr] sm:items-center">
          <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Format</label>
          <select v-model="exportFormat" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div class="grid gap-3 sm:grid-cols-[140px,1fr] sm:items-center">
          <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filename</label>
          <input
            v-model="exportFileName"
            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            type="text"
            placeholder="contacts"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between gap-4">
          <div class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {{ contacts.length }} contacts
          </div>
          <div class="flex items-center gap-3">
            <button
              class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:-translate-y-0.5"
              type="button"
              @click="closeExportModal"
            >
              Cancel
            </button>
            <button
              class="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5"
              type="button"
              @click="exportContacts"
            >
              Download
            </button>
          </div>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      :open="isSettingsOpen"
      title="Table settings"
      max-width-class="max-w-3xl"
      @close="closeSettingsModal"
    >
      <div class="space-y-6">
        <div>
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Columns</div>
          <div class="mt-3 space-y-2">
            <div
              v-for="(column, index) in columns"
              :key="column.key"
              class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2"
              :class="draggingOverIndex === index ? 'border-slate-300 bg-white shadow-sm' : ''"
              @dragover.prevent="handleColumnDragOver(index)"
              @drop="handleColumnDrop(index)"
            >
              <button
                class="-ml-2 inline-flex items-center justify-center px-1 text-slate-400 transition hover:text-slate-700"
                type="button"
                aria-label="Drag to reorder column"
                draggable="true"
                @dragstart="startColumnDrag(index, $event)"
                @dragend="endColumnDrag"
              >
                <EllipsisVerticalIcon class="h-5 w-5" />
              </button>
              <input
                v-model="column.label"
                class="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                type="text"
              />
              <select
                v-model="column.type"
                class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option v-for="fieldType in fieldTypes" :key="fieldType.value" :value="fieldType.value">
                  {{ fieldType.label }}
                </option>
              </select>
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
                  type="button"
                  aria-label="Move column up"
                  @click="moveColumn(index, -1)"
                >
                  <ChevronUpIcon class="h-4 w-4" />
                </button>
                <button
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
                  type="button"
                  aria-label="Move column down"
                  @click="moveColumn(index, 1)"
                >
                  <ChevronDownIcon class="h-4 w-4" />
                </button>
                <button
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 transition hover:text-rose-700"
                  type="button"
                  aria-label="Remove column"
                  @click="removeColumn(index)"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Add column</div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              v-model="newColumnLabel"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              type="text"
              placeholder="Column label"
            />
            <select
              v-model="newColumnType"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option v-for="fieldType in fieldTypes" :key="fieldType.value" :value="fieldType.value">
                {{ fieldType.label }}
              </option>
            </select>
          </div>
          <div class="mt-3 flex justify-end">
            <button
              class="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5"
              type="button"
              @click="addColumn"
            >
              Add column
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <button
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:-translate-y-0.5"
            type="button"
            @click="closeSettingsModal"
          >
            Done
          </button>
        </div>
      </template>
    </BaseModal>
  </main>
</template>

<script setup>
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { computed, onMounted, ref, watch } from "vue";
import BaseModal from "../components/BaseModal.vue";
import ContactModal from "../components/ContactModal.vue";

const columns = ref( [
  createColumn( { key: "first_name", label: "First", type: "text" } ),
  createColumn( { key: "last_name", label: "Last", type: "text" } ),
  createColumn( { key: "email", label: "Email", type: "email" } ),
  createColumn( { key: "phone", label: "Phone", type: "phone" } ),
  createColumn( { key: "line1", label: "Addr 1", type: "text", fullWidth: true } ),
  createColumn( { key: "line2", label: "Addr 2", type: "text", fullWidth: true } ),
  createColumn( { key: "city", label: "City", type: "text" } ),
  createColumn( { key: "state", label: "State", type: "state" } ),
  createColumn( { key: "postal_code", label: "Postal", type: "zip" } ),
  createColumn( { key: "country", label: "Country", type: "text" } ),
  createColumn( { key: "notes", label: "Notes", type: "textarea", cellClass: "max-w-[260px] truncate" } ),
] );

const contacts = ref( [] );
const sortKey = ref( "last_name" );
const sortDirection = ref( "asc" );
const isModalOpen = ref( false );
const selectedContact = ref( null );
const isImportOpen = ref( false );
const isExportOpen = ref( false );
const isSettingsOpen = ref( false );
const importFileName = ref( "" );
const importError = ref( "" );
const importRows = ref( [] );
const importColumns = ref( [] );
const importColumnMappings = ref( [] );
const importRowTargets = ref( [] );
const importFieldDefault = ref( "new" );
const exportFormat = ref( "csv" );
const exportFileName = ref( "contacts" );
const draggingColumnIndex = ref( null );
const draggingOverIndex = ref( null );
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "state", label: "State" },
  { value: "zip", label: "Zip" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "textarea", label: "Long text" },
];
const newColumnLabel = ref( "" );
const newColumnType = ref( "text" );
const searchQuery = ref( "" );
let hasLoadedColumns = false;
let persistColumnsTimer = null;

function createColumn( { key, label, cellClass, type = "text", fullWidth = false } ) {
  return {
    key,
    label,
    cellClass,
    type,
    fullWidth,
    getValue: ( contact ) => getValueByKey( contact, key ),
  };
}

function hydrateColumn( column ) {
  if ( !column?.key || !column?.label ) return null;
  return createColumn( {
    key: column.key,
    label: column.label,
    type: column.type || "text",
    fullWidth: Boolean( column.fullWidth ),
    cellClass: column.cellClass,
  } );
}

function serializeColumns() {
  return columns.value.map( ( column ) => {
    const payload = {
      key: column.key,
      label: column.label,
      type: column.type,
      fullWidth: Boolean( column.fullWidth ),
    };
    if ( column.cellClass ) {
      payload.cellClass = column.cellClass;
    }
    return payload;
  } );
}

async function loadColumns() {
  try {
    const response = await fetch( "/api/columns" );
    if ( !response.ok ) {
      throw new Error( "Failed to load columns" );
    }
    const storedColumns = await response.json();
    if ( Array.isArray( storedColumns ) && storedColumns.length ) {
      const hydrated = storedColumns.map( ( column ) => hydrateColumn( column ) ).filter( Boolean );
      if ( hydrated.length ) {
        columns.value = hydrated;
      }
    } else {
      await persistColumns();
    }
  } catch ( error ) {
    console.error( error );
  } finally {
    hasLoadedColumns = true;
  }
}

async function persistColumns() {
  try {
    await fetch( "/api/columns", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify( serializeColumns() ),
    } );
  } catch ( error ) {
    console.error( error );
  }
}

function schedulePersistColumns() {
  if ( persistColumnsTimer ) {
    clearTimeout( persistColumnsTimer );
  }
  persistColumnsTimer = setTimeout( () => {
    persistColumnsTimer = null;
    void persistColumns();
  }, 400 );
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

const filteredContacts = computed( () => {
  const query = searchQuery.value.trim().toLowerCase();
  if ( !query ) return contacts.value;
  return contacts.value.filter( ( contact ) => contactMatchesQuery( contact, query ) );
} );

const sortedContacts = computed( () => {
  const direction = sortDirection.value === "asc" ? 1 : -1;
  const activeColumn = columns.value.find( ( column ) => column.key === sortKey.value );
  const getter = activeColumn?.getValue || ( ( contact ) => contact[ sortKey.value ] || "" );

  return [ ...filteredContacts.value ].sort( ( a, b ) => {
    const valueA = normalizeValue( getter( a ) );
    const valueB = normalizeValue( getter( b ) );
    if ( valueA < valueB ) return -1 * direction;
    if ( valueA > valueB ) return 1 * direction;
    return 0;
  } );
} );

function normalizeValue( value ) {
  if ( value === null || value === undefined ) {
    return "";
  }
  return value.toString().toLowerCase();
}

function contactMatchesQuery( contact, query ) {
  const flattened = flattenObject( contact );
  const values = Object.values( flattened )
    .map( ( value ) => ( value === null || value === undefined ? "" : value.toString().toLowerCase() ) );
  return values.some( ( value ) => value.includes( query ) );
}

function setSort( key ) {
  if ( sortKey.value === key ) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDirection.value = "asc";
}

function openModal() {
  selectedContact.value = null;
  isModalOpen.value = true;
}

function editContact( contact ) {
  selectedContact.value = contact;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedContact.value = null;
}

async function loadContacts() {
  try {
    const response = await fetch( "/api/contacts" );
    if ( !response.ok ) {
      throw new Error( "Failed to load contacts" );
    }
    contacts.value = await response.json();
  } catch ( error ) {
    console.error( error );
  }
}

async function saveContact( payload ) {
  try {
    await persistContact( payload );
    closeModal();
  } catch ( error ) {
    console.error( error );
  }
}

async function deleteContact( id ) {
  try {
    const response = await fetch( `/api/contacts/${ id }`, { method: "DELETE" } );
    if ( !response.ok ) {
      throw new Error( "Failed to delete contact" );
    }
    contacts.value = contacts.value.filter( ( contact ) => contact.id !== id );
    closeModal();
  } catch ( error ) {
    console.error( error );
  }
}

async function persistContact( payload ) {
  const hasId = Boolean( payload.id );
  const endpoint = hasId ? `/api/contacts/${ payload.id }` : "/api/contacts";
  const method = hasId ? "PUT" : "POST";

  const response = await fetch( endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( payload ),
  } );
  if ( !response.ok ) {
    throw new Error( "Failed to save contact" );
  }
  const saved = await response.json();
  if ( hasId ) {
    contacts.value = contacts.value.map( ( contact ) =>
      contact.id === saved.id ? saved : contact
    );
  } else {
    contacts.value = [ ...contacts.value, saved ];
  }
  return saved;
}

function openImportModal() {
  resetImportState();
  isImportOpen.value = true;
}

function closeImportModal() {
  isImportOpen.value = false;
}

function openExportModal() {
  isExportOpen.value = true;
}

function closeExportModal() {
  isExportOpen.value = false;
}

function openSettingsModal() {
  isSettingsOpen.value = true;
}

function closeSettingsModal() {
  isSettingsOpen.value = false;
  schedulePersistColumns();
}

function contactLabel( contact ) {
  const name = [ contact.first_name, contact.last_name ].filter( Boolean ).join( " " );
  if ( name ) return name;
  if ( contact.email ) return contact.email;
  return `Contact ${ contact.id }`;
}

function importRowLabel( row, index ) {
  const first = row.first_name || row.First || row.first || "";
  const last = row.last_name || row.Last || row.last || "";
  const email = row.email || row.Email || "";
  const label = [ first, last ].filter( Boolean ).join( " " );
  if ( label ) return label;
  if ( email ) return email;
  const fallbackKey = importColumns.value[ 0 ];
  return fallbackKey ? `${ fallbackKey }: ${ row[ fallbackKey ] }` : `Row ${ index + 1 }`;
}

async function handleImportFile( event ) {
  const [ file ] = event.target.files || [];
  if ( !file ) return;

  importError.value = "";
  importFileName.value = file.name;

  try {
    const text = await file.text();
    const isCsv = file.name.toLowerCase().endsWith( ".csv" ) || file.type.includes( "csv" );
    const isJson = file.name.toLowerCase().endsWith( ".json" ) || file.type.includes( "json" );
    let rows = [];

    if ( isCsv ) {
      const parsed = parseCsv( text );
      rows = parsed.rows;
    } else if ( isJson ) {
      rows = parseJsonRows( text );
    } else {
      throw new Error( "Unsupported file type. Use a CSV or JSON file." );
    }

    prepareImportRows( rows );
  } catch ( error ) {
    importError.value = error.message || "Failed to parse file.";
    importRows.value = [];
    importColumns.value = [];
    importColumnMappings.value = [];
    importRowTargets.value = [];
  }
}

function parseJsonRows( text ) {
  const parsed = JSON.parse( text );
  if ( Array.isArray( parsed ) ) {
    return parsed;
  }
  if ( Array.isArray( parsed?.contacts ) ) {
    return parsed.contacts;
  }
  return [ parsed ];
}

function prepareImportRows( rows ) {
  const flattenedRows = rows.map( ( row ) => flattenObject( row || {} ) );
  const columnSet = new Set();
  flattenedRows.forEach( ( row ) => {
    Object.keys( row ).forEach( ( key ) => columnSet.add( key ) );
  } );
  importColumns.value = [ ...columnSet ];
  importRows.value = flattenedRows;
  importColumnMappings.value = importColumns.value.map( ( key ) => {
    const matchingKey = guessColumnKey( key );
    return {
      importKey: key,
      targetKey: matchingKey || ( importFieldDefault.value === "new" ? "__new__" : "" ),
      newLabel: humanizeKey( key ),
      newType: "text",
    };
  } );
  importRowTargets.value = flattenedRows.map( () => "new" );
}

function applyImportDefault( overrideAll = false ) {
  const targetKey = importFieldDefault.value === "new" ? "__new__" : "";
  importColumnMappings.value = importColumnMappings.value.map( ( mapping ) => {
    if ( !overrideAll && mapping.targetKey && mapping.targetKey !== "__new__" ) {
      return mapping;
    }
    return {
      ...mapping,
      targetKey,
    };
  } );
}

function flattenObject( value, prefix = "" ) {
  const result = {};
  if ( !value || typeof value !== "object" ) {
    return result;
  }
  Object.entries( value ).forEach( ( [ key, entry ] ) => {
    const path = prefix ? `${ prefix }.${ key }` : key;
    if ( entry && typeof entry === "object" && !Array.isArray( entry ) ) {
      Object.assign( result, flattenObject( entry, path ) );
      return;
    }
    result[ path ] = entry ?? "";
  } );
  return result;
}

function guessColumnKey( importKey ) {
  const normalized = normalizeKeyForMatch( importKey );
  const match = columns.value.find( ( column ) => {
    return (
      normalizeKeyForMatch( column.key ) === normalized ||
      normalizeKeyForMatch( column.label ) === normalized
    );
  } );
  return match?.key || "";
}

function normalizeKeyForMatch( value ) {
  return value.toLowerCase().replace( /[^a-z0-9]+/g, "" );
}

function humanizeKey( value ) {
  return value
    .replace( /\./g, " " )
    .replace( /_/g, " " )
    .replace( /\s+/g, " " )
    .trim()
    .replace( /\b\w/g, ( letter ) => letter.toUpperCase() );
}

function normalizeColumnKey( value ) {
  return value
    .toLowerCase()
    .replace( /[^a-z0-9.]+/g, "_" )
    .replace( /^_+|_+$/g, "" );
}

function ensureUniqueKey( value ) {
  const existing = new Set( columns.value.map( ( column ) => column.key ) );
  let key = value || "column";
  let counter = 2;
  while ( existing.has( key ) ) {
    key = `${ value || "column" }_${ counter }`;
    counter += 1;
  }
  return key;
}

async function confirmImport() {
  importError.value = "";

  const activeMappings = importColumnMappings.value
    .filter( ( mapping ) => mapping.targetKey )
    .map( ( mapping ) => ( { ...mapping } ) );

  if ( activeMappings.length === 0 ) {
    importError.value = "Select at least one column to import.";
    return;
  }

  let addedColumns = false;
  activeMappings.forEach( ( mapping ) => {
    if ( mapping.targetKey !== "__new__" ) return;
    const label = mapping.newLabel?.trim() || humanizeKey( mapping.importKey );
    const rawKey = normalizeColumnKey( label );
    const uniqueKey = ensureUniqueKey( rawKey );
    columns.value = [ ...columns.value, createColumn( { key: uniqueKey, label, type: mapping.newType || "text" } ) ];
    mapping.targetKey = uniqueKey;
    addedColumns = true;
  } );
  if ( addedColumns ) {
    await persistColumns();
  }

  for ( let index = 0; index < importRows.value.length; index += 1 ) {
    const target = importRowTargets.value[ index ];
    if ( target === "skip" ) continue;
    const row = importRows.value[ index ];
    const existingContact = target === "new" ? null : contacts.value.find( ( contact ) => contact.id === target );
    const payload = existingContact ? JSON.parse( JSON.stringify( existingContact ) ) : {};

    activeMappings.forEach( ( mapping ) => {
      const value = row[ mapping.importKey ];
      if ( value === undefined || value === "" ) return;
      setValueByKey( payload, mapping.targetKey, value );
    } );

    if ( existingContact?.id ) {
      payload.id = existingContact.id;
    }
    try {
      await persistContact( payload );
    } catch ( error ) {
      importError.value = "Some rows failed to import. Check the console for details.";
      console.error( error );
    }
  }

  closeImportModal();
}

function parseCsv( text ) {
  const rows = [];
  let current = [];
  let value = "";
  let inQuotes = false;

  for ( let index = 0; index < text.length; index += 1 ) {
    const char = text[ index ];
    const next = text[ index + 1 ];

    if ( char === "\"" ) {
      if ( inQuotes && next === "\"" ) {
        value += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if ( char === "," && !inQuotes ) {
      current.push( value );
      value = "";
      continue;
    }

    if ( ( char === "\n" || char === "\r" ) && !inQuotes ) {
      if ( char === "\r" && next === "\n" ) {
        index += 1;
      }
      current.push( value );
      if ( current.some( ( entry ) => entry.trim() !== "" ) ) {
        rows.push( current );
      }
      current = [];
      value = "";
      continue;
    }

    value += char;
  }

  if ( value || current.length ) {
    current.push( value );
    if ( current.some( ( entry ) => entry.trim() !== "" ) ) {
      rows.push( current );
    }
  }

  const headers = rows.shift()?.map( ( header ) => header.trim() ) || [];
  const data = rows.map( ( row ) => {
    const record = {};
    headers.forEach( ( header, index ) => {
      if ( !header ) return;
      record[ header ] = row[ index ] ?? "";
    } );
    return record;
  } );

  return { headers, rows: data };
}

function resetImportState() {
  importFileName.value = "";
  importError.value = "";
  importRows.value = [];
  importColumns.value = [];
  importColumnMappings.value = [];
  importRowTargets.value = [];
  importFieldDefault.value = "new";
}

function exportContacts() {
  const rows = contacts.value.map( ( contact ) => {
    return columns.value.reduce( ( acc, column ) => {
      acc[ column.key ] = column.getValue( contact );
      return acc;
    }, {} );
  } );

  const name = exportFileName.value.trim() || "contacts";
  if ( exportFormat.value === "json" ) {
    downloadFile( `${ name }.json`, JSON.stringify( rows, null, 2 ), "application/json" );
    closeExportModal();
    return;
  }

  const csv = toCsv( rows, columns.value.map( ( column ) => column.key ) );
  downloadFile( `${ name }.csv`, csv, "text/csv" );
  closeExportModal();
}

function toCsv( rows, headers ) {
  const escapeValue = ( value ) => {
    const text = value === null || value === undefined ? "" : String( value );
    if ( /[",\n]/.test( text ) ) {
      return `"${ text.replace( /"/g, "\"\"" ) }"`;
    }
    return text;
  };

  const headerLine = headers.map( escapeValue ).join( "," );
  const lines = rows.map( ( row ) => headers.map( ( key ) => escapeValue( row[ key ] ) ).join( "," ) );
  return [ headerLine, ...lines ].join( "\n" );
}

function downloadFile( filename, content, type ) {
  const blob = new Blob( [ content ], { type } );
  const url = URL.createObjectURL( blob );
  const link = document.createElement( "a" );
  link.href = url;
  link.download = filename;
  document.body.appendChild( link );
  link.click();
  link.remove();
  URL.revokeObjectURL( url );
}

function moveColumn( index, direction ) {
  const nextIndex = index + direction;
  if ( nextIndex < 0 || nextIndex >= columns.value.length ) return;
  const updated = [ ...columns.value ];
  const [ moved ] = updated.splice( index, 1 );
  updated.splice( nextIndex, 0, moved );
  columns.value = updated;
}

function startColumnDrag( index, event ) {
  draggingColumnIndex.value = index;
  draggingOverIndex.value = index;
  if ( event?.dataTransfer ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData( "text/plain", String( index ) );
  }
}

function handleColumnDragOver( index ) {
  if ( draggingColumnIndex.value === null ) return;
  draggingOverIndex.value = index;
}

function handleColumnDrop( index ) {
  if ( draggingColumnIndex.value === null ) return;
  const fromIndex = draggingColumnIndex.value;
  const toIndex = index;
  draggingColumnIndex.value = null;
  draggingOverIndex.value = null;
  if ( fromIndex === toIndex ) return;
  const updated = [ ...columns.value ];
  const [ moved ] = updated.splice( fromIndex, 1 );
  updated.splice( toIndex, 0, moved );
  columns.value = updated;
}

function endColumnDrag() {
  draggingColumnIndex.value = null;
  draggingOverIndex.value = null;
}

function removeColumn( index ) {
  const [ removed ] = columns.value.splice( index, 1 );
  if ( removed?.key === sortKey.value ) {
    sortKey.value = columns.value[ 0 ]?.key || "";
  }
}

function addColumn() {
  const label = newColumnLabel.value.trim();
  if ( !label ) return;
  const baseKey = normalizeColumnKey( label );
  const key = ensureUniqueKey( baseKey );
  columns.value = [ ...columns.value, createColumn( { key, label, type: newColumnType.value } ) ];
  newColumnLabel.value = "";
  newColumnType.value = "text";
}

onMounted( () => {
  const initialize = async () => {
    await loadColumns();
    await loadContacts();
  };
  void initialize();
} );

watch(
  () => columns.value,
  () => {
    if ( !hasLoadedColumns ) return;
    schedulePersistColumns();
  },
  { deep: true }
);
</script>
