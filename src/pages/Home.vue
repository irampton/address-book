<template>
  <main class="min-h-screen bg-white text-slate-900">
    <div class="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 pb-12 pt-6 sm:px-8">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Add contact"
            @click="openModal"
          >
            <PlusIcon class="h-5 w-5" />
          </button>
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Import contacts"
            @click="openImportModal"
          >
            <ArrowUpTrayIcon class="h-5 w-5" />
          </button>
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Export contacts"
            @click="openExportModal"
          >
            <ArrowDownTrayIcon class="h-5 w-5" />
          </button>
          <button
            class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
            type="button"
            aria-label="Settings"
            @click="openSettingsModal"
          >
            <Cog6ToothIcon class="h-5 w-5" />
          </button>
        </div>
        <div class="text-xs font-semibold text-slate-500">Contacts</div>
        <div class="text-xs text-slate-400">
          {{ contacts.length }}
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
      @close="closeModal"
      @save="saveContact"
      @delete="deleteContact"
    />

    <div v-if="isImportOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      <div class="absolute inset-0 bg-white/80" @click="closeImportModal"></div>
      <div class="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="text-xs font-semibold text-slate-500">Import contacts</div>
          <button class="text-slate-400 transition hover:text-slate-700" type="button" @click="closeImportModal">✕</button>
        </div>
        <div class="mt-6 flex-1 space-y-6 overflow-y-auto pr-2">
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
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Column mapping</div>
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
                  <input
                    v-model="mapping.newKey"
                    class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    type="text"
                    placeholder="New column key"
                  />
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
        <div class="mt-6 flex items-center justify-between gap-4">
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
      </div>
    </div>

    <div v-if="isExportOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      <div class="absolute inset-0 bg-white/80" @click="closeExportModal"></div>
      <div class="relative flex w-full max-w-xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="text-xs font-semibold text-slate-500">Export contacts</div>
          <button class="text-slate-400 transition hover:text-slate-700" type="button" @click="closeExportModal">✕</button>
        </div>
        <div class="mt-6 flex-1 space-y-4 overflow-y-auto pr-2">
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
        <div class="mt-6 flex items-center justify-between gap-4">
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
      </div>
    </div>

    <div v-if="isSettingsOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      <div class="absolute inset-0 bg-white/80" @click="closeSettingsModal"></div>
      <div class="relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="text-xs font-semibold text-slate-500">Table settings</div>
          <button class="text-slate-400 transition hover:text-slate-700" type="button" @click="closeSettingsModal">✕</button>
        </div>
        <div class="mt-6 flex-1 space-y-6 overflow-y-auto pr-2">
          <div>
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Columns</div>
            <div class="mt-3 space-y-2">
              <div
                v-for="(column, index) in columns"
                :key="column.key"
                class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2"
              >
                <input
                  v-model="column.label"
                  class="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  type="text"
                />
                <div class="text-xs text-slate-400">{{ column.key }}</div>
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
              <input
                v-model="newColumnKey"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                type="text"
                placeholder="Column key"
              />
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
        <div class="mt-6 flex justify-end">
          <button
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:-translate-y-0.5"
            type="button"
            @click="closeSettingsModal"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { computed, onMounted, ref } from "vue";
import ContactModal from "../components/ContactModal.vue";

const columns = ref( [
  createColumn( { key: "first_name", label: "First" } ),
  createColumn( { key: "last_name", label: "Last" } ),
  createColumn( { key: "email", label: "Email" } ),
  createColumn( { key: "phone", label: "Phone" } ),
  createColumn( { key: "address.line1", label: "Addr 1" } ),
  createColumn( { key: "address.line2", label: "Addr 2" } ),
  createColumn( { key: "address.city", label: "City" } ),
  createColumn( { key: "address.state", label: "State" } ),
  createColumn( { key: "address.postal_code", label: "Postal" } ),
  createColumn( { key: "address.country", label: "Country" } ),
  createColumn( { key: "notes", label: "Notes", cellClass: "max-w-[260px] truncate" } ),
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
const exportFormat = ref( "csv" );
const exportFileName = ref( "contacts" );
const newColumnLabel = ref( "" );
const newColumnKey = ref( "" );
const topLevelFields = new Set( [ "first_name", "last_name", "email", "phone", "notes", "address" ] );

function createColumn( { key, label, cellClass } ) {
  return {
    key,
    label,
    cellClass,
    getValue: ( contact ) => getValueByKey( contact, key ),
  };
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

const sortedContacts = computed( () => {
  const direction = sortDirection.value === "asc" ? 1 : -1;
  const activeColumn = columns.value.find( ( column ) => column.key === sortKey.value );
  const getter = activeColumn?.getValue || ( ( contact ) => contact[ sortKey.value ] || "" );

  return [ ...contacts.value ].sort( ( a, b ) => {
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
      targetKey: matchingKey || "",
      newLabel: humanizeKey( key ),
      newKey: ensureAddressKey( normalizeColumnKey( key ) ),
    };
  } );
  importRowTargets.value = flattenedRows.map( () => "new" );
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

function ensureAddressKey( value ) {
  if ( !value ) return value;
  if ( value.includes( "." ) ) return value;
  if ( topLevelFields.has( value ) ) return value;
  return `address.${ value }`;
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

  activeMappings.forEach( ( mapping ) => {
    if ( mapping.targetKey !== "__new__" ) return;
    const label = mapping.newLabel?.trim() || humanizeKey( mapping.importKey );
    const rawKey = mapping.newKey?.trim() || normalizeColumnKey( label );
    const uniqueKey = ensureUniqueKey( ensureAddressKey( rawKey ) );
    columns.value = [ ...columns.value, createColumn( { key: uniqueKey, label } ) ];
    mapping.targetKey = uniqueKey;
  } );

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
    if ( !existingContact && !payload.first_name && !payload.last_name ) {
      importError.value = "Rows missing first or last name were skipped.";
      continue;
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

function removeColumn( index ) {
  const [ removed ] = columns.value.splice( index, 1 );
  if ( removed?.key === sortKey.value ) {
    sortKey.value = columns.value[ 0 ]?.key || "";
  }
}

function addColumn() {
  const label = newColumnLabel.value.trim();
  const baseKey = newColumnKey.value.trim() || normalizeColumnKey( label );
  if ( !label && !baseKey ) return;
  const key = ensureUniqueKey( ensureAddressKey( baseKey ) );
  columns.value = [ ...columns.value, createColumn( { key, label: label || key } ) ];
  newColumnLabel.value = "";
  newColumnKey.value = "";
}

onMounted( () => {
  loadContacts();
} );
</script>
