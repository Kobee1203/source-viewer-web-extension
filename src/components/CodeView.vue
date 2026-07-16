<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { browser } from 'wxt/browser';
import Prism from '@/utils/prism';
import type { FileType } from '@/utils/fileType';

const props = defineProps<{
  code: string;
  language: FileType;
  baseUrl: string;
  wrap: boolean;
}>();

const preEl = ref<HTMLPreElement>();
const codeEl = ref<HTMLElement>();

/** Turns href/src attribute values into links that reopen in our viewer. */
function makeUrlsClickable(): void {
  const el = codeEl.value;
  if (!el || !props.baseUrl) return;

  const attrValues = el.querySelectorAll('.token.attr-value');
  attrValues.forEach((elem) => {
    // Find the matching attr-name (may not be the immediate previous sibling).
    let prev: Element | null = elem.previousElementSibling;
    if (!prev || !prev.classList.contains('attr-name')) {
      let sib = elem.previousSibling;
      while (sib) {
        if (sib.nodeType === Node.ELEMENT_NODE && (sib as Element).classList.contains('attr-name')) {
          prev = sib as Element;
          break;
        }
        sib = sib.previousSibling;
      }
    }

    if (prev && (prev.textContent === 'href' || prev.textContent === 'src')) {
      elem.childNodes.forEach((child) => {
        if (child.nodeType !== Node.TEXT_NODE) return;
        const rawUrl = (child.textContent ?? '').trim();
        // Skip hash fragments, javascript/data URIs, and empty strings.
        if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('javascript:') || rawUrl.startsWith('data:')) {
          return;
        }
        try {
          const resolvedUrl = new URL(rawUrl, props.baseUrl).toString();
          const viewerUrl = browser.runtime.getURL('/viewer.html') + '?url=' + encodeURIComponent(resolvedUrl);

          const link = document.createElement('a');
          link.className = 'source-link';
          link.textContent = child.textContent ?? ''; // preserve original spacing
          link.href = viewerUrl;
          link.target = '_blank';
          child.replaceWith(link);
        } catch (e) {
          console.warn('Failed to resolve URL:', rawUrl, e);
        }
      });
    }
  });
}

function render(): void {
  const el = codeEl.value;
  if (!el) return;
  el.className = `language-${props.language} line-numbers`;
  el.textContent = props.code; // protection against HTML injection
  Prism.highlightElement(el);
  makeUrlsClickable();
}

function applyWrap(): void {
  preEl.value?.classList.toggle('wrap-code', props.wrap);
}

onMounted(() => {
  applyWrap();
  render();
});

watch(() => [props.code, props.language], render);
watch(() => props.wrap, applyWrap);
</script>

<template>
  <pre ref="preEl"><code ref="codeEl"></code></pre>
</template>
