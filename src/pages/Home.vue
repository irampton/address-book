<template>
  <main>
    <BaseHeader subtitle="Keep your people in reach and your notes tidy.">
      Address Book
    </BaseHeader>

    <section class="mx-auto grid max-w-4xl gap-6 px-6 pb-16 md:grid-cols-[1.2fr_0.8fr]">
      <div class="rounded-3xl bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">Quick Add</h2>
        <p class="mt-2 text-sm text-slate-600">
          Drop a name and a detail to start a new contact card.
        </p>
        <div class="mt-6 grid gap-4">
          <BaseInput label="Full name" placeholder="Avery Chen" />
          <BaseInput label="Email" placeholder="avery@company.com" type="email" />
          <BaseButton>Save contact</BaseButton>
        </div>
      </div>

      <div class="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
        <h3 class="text-lg font-semibold">Upcoming reminders</h3>
        <p class="mt-2 text-sm text-slate-300">
          Set follow-ups and keep important moments on your radar.
        </p>
        <div class="mt-5 flex items-center gap-3 rounded-2xl border border-white/15 px-4 py-3">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Today
          </span>
          <span class="text-sm">Reach out to new leads</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import BaseButton from "../components/BaseButton.vue";
import BaseHeader from "../components/BaseHeader.vue";
import BaseInput from "../components/BaseInput.vue";
</script>
