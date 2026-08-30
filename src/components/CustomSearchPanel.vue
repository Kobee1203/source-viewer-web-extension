<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { SearchQuery, closeSearchPanel, getSearchQuery, setSearchQuery } from '@codemirror/search';
import type { EditorView } from '@codemirror/view';
import { HelpCircle } from '@lucide/vue';
import {
  fileTypeFacet,
  nextStructuralMatch,
  performStructuralSearch,
  previousStructuralMatch,
  providers,
  setStructuralSearchState,
  structuralSearchField,
} from '@/composables/search/SearchManager';
import { t } from '@/utils/i18n';

const props = defineProps<{
  view: EditorView;
}>();

const searchInput = ref<HTMLInputElement | null>(null);

function phrase(text: string) {
  return props.view.state.phrase(text) || text;
}

const availableModes = computed(() => {
  const currentFileType = props.view.state.facet(fileTypeFacet);
  const modes = [{ value: 'text', label: t('searchTextMode') }];
  for (const provider of providers) {
    if (!provider.supportedFileTypes || provider.supportedFileTypes.includes(currentFileType)) {
      modes.push({ value: provider.id, label: provider.label });
    }
  }
  return modes;
});

const activeMode = ref('text');

const SearchHelpDialog = defineAsyncComponent(() => import('@/components/SearchHelpDialog.vue'));

const showHelpDialog = ref(false);

const activeProvider = computed(() => {
  if (activeMode.value === 'text') return null;
  return providers.find((p) => p.id === activeMode.value);
});

function openHelp() {
  showHelpDialog.value = true;
}

function onHelpClosed() {
  showHelpDialog.value = false;
}

const query = ref('');
const caseSensitive = ref(false);
const regexp = ref(false);
const wholeWord = ref(false);

const structuralError = ref<string | null>(null);
const matchCount = ref<number | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  // Initialize from current state
  const cmQuery = getSearchQuery(props.view.state);
  if (cmQuery) {
    query.value = cmQuery.search;
    caseSensitive.value = cmQuery.caseSensitive;
    regexp.value = cmQuery.regexp;
    wholeWord.value = cmQuery.literal;
  }

  // Focus input automatically when opened
  setTimeout(() => {
    searchInput.value?.focus();
    searchInput.value?.select();
  }, 10);

  const syncState = () => {
    if (activeMode.value !== 'text') {
      const state = props.view.state.field(structuralSearchField, false);
      if (state) {
        structuralError.value = state.error;
        matchCount.value = state.query.trim() ? state.matches.length : null;
      }
    } else {
      structuralError.value = null;
      matchCount.value = null;
    }
  };
  const interval = setInterval(syncState, 200);
  onUnmounted(() => clearInterval(interval));
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);

  if (activeMode.value === 'text') {
    applyTextSearch();
  } else {
    debounceTimer = setTimeout(() => {
      performStructuralSearch(props.view, activeMode.value, query.value);
    }, 200);
  }
}

function onOptionChange() {
  if (activeMode.value === 'text') {
    applyTextSearch();
  }
}

function onModeChange() {
  if (activeMode.value === 'text') {
    props.view.dispatch({
      effects: setStructuralSearchState.of({
        query: '',
        providerId: null,
        matches: [],
        selectedIndex: -1,
        error: null,
      }),
    });
    applyTextSearch();
  } else {
    props.view.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: '', caseSensitive: false, literal: false, regexp: false })),
    });
    performStructuralSearch(props.view, activeMode.value, query.value);
  }
  searchInput.value?.focus();
}

function applyTextSearch() {
  props.view.dispatch({
    effects: setSearchQuery.of(
      new SearchQuery({
        search: query.value,
        caseSensitive: caseSensitive.value,
        regexp: regexp.value,
        literal: wholeWord.value,
      }),
    ),
  });
}

async function onNext() {
  if (activeMode.value === 'text') {
    const { findNext } = await import('@codemirror/search');
    findNext(props.view);
  } else {
    nextStructuralMatch(props.view);
  }
}

async function onPrev() {
  if (activeMode.value === 'text') {
    const { findPrevious } = await import('@codemirror/search');
    findPrevious(props.view);
  } else {
    previousStructuralMatch(props.view);
  }
}

async function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) {
    await onPrev();
  } else {
    await onNext();
  }
}

function onEsc() {
  onClose();
}

function onClose() {
  props.view.dispatch({
    effects: setStructuralSearchState.of({ query: '', providerId: null, matches: [], selectedIndex: -1, error: null }),
  });
  closeSearchPanel(props.view);
}
</script>

<template>
  <div class="custom-search-panel">
    <!-- Mode Selector -->
    <select v-if="availableModes.length > 1" v-model="activeMode" class="search-mode-select" @change="onModeChange">
      <option v-for="mode in availableModes" :key="mode.value" :value="mode.value">
        {{ mode.label }}
      </option>
    </select>

    <!-- Search Input -->
    <input
      ref="searchInput"
      v-model="query"
      class="cm-textfield"
      :placeholder="phrase('Find')"
      :aria-label="phrase('Find')"
      name="search"
      @input="onInput"
      @keydown.enter="onEnter"
      @keydown.esc="onEsc"
    />

    <!-- Navigation Buttons -->
    <button class="cm-button" :title="phrase('next') + ' (Enter)'" @click="onNext">{{ phrase('next') }}</button>
    <button class="cm-button" :title="phrase('previous') + ' (Shift+Enter)'" @click="onPrev">
      {{ phrase('previous') }}
    </button>

    <!-- Options for Text Mode only -->
    <template v-if="activeMode === 'text'">
      <label :title="phrase('match case')">
        <input v-model="caseSensitive" type="checkbox" @change="onOptionChange" />
        {{ phrase('match case') }}
      </label>
      <label :title="phrase('regexp')">
        <input v-model="regexp" type="checkbox" @change="onOptionChange" />
        {{ phrase('regexp') }}
      </label>
      <label :title="phrase('by word')">
        <input v-model="wholeWord" type="checkbox" @change="onOptionChange" />
        {{ phrase('by word') }}
      </label>
    </template>

    <!-- Help Button for structural modes -->
    <button
      v-if="activeProvider && activeProvider.examples"
      class="cm-button help-button"
      :title="phrase('help')"
      :aria-label="phrase('help')"
      type="button"
      @click="openHelp"
    >
      <HelpCircle :size="14" />
    </button>

    <!-- Error indicator for structural modes -->
    <span v-if="structuralError" class="search-error" :title="structuralError"> ⚠️ </span>

    <span v-if="matchCount !== null" class="search-count"> {{ t('searchResults', matchCount) }} </span>

    <button name="close" :aria-label="phrase('close')" type="button" @click="onClose">×</button>
  </div>
  <SearchHelpDialog
    v-if="showHelpDialog && activeProvider"
    :active-provider="activeProvider"
    :title="t('searchHelpTitle', { mode: activeProvider.label })"
    @closed="onHelpClosed"
  />
</template>

<style scoped>
.custom-search-panel {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 8px;
}

.search-mode-select {
  height: 28px;
  padding: 2px 4px;
  color: var(--select-fg);
  background: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}

.search-error {
  font-size: 12px;
  color: #dc2626;
  cursor: help;
}

.search-count {
  font-size: 12px;
  color: #6b7280;
}

.help-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>
