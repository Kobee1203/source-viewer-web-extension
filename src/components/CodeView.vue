<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue';
import Prism from '@/utils/prism';
import { linkifySourceUrls } from '@/utils/linkify';
import type { FileType } from '@/utils/fileType';

const props = defineProps<{
  code: string;
  language: FileType;
  baseUrl: string;
  wrap: boolean;
}>();

const preEl = ref<HTMLElement>();
const codeEl = ref<HTMLElement>();

/**
 * Recompute Prism's line-number row heights for the current wrap mode.
 */
async function syncLineNumbers() {
  const pre = preEl.value;
  if (!pre) return;

  // Wait for Vue to apply the CSS classes
  await nextTick();

  // Prism cannot “reset” the heights when wrap is disabled.
  // Therefore, you must manually remove the “height” styles added to the numbers.
  const rows = pre.querySelector('.line-numbers-rows');
  if (rows) {
    for (const row of Array.from(rows.children)) {
      (row as HTMLElement).style.height = '';
    }
  }

  Prism.plugins.lineNumbers?.resize(pre);
}

async function render() {
  const el = codeEl.value;
  if (!el) return;

  // Wait for Vue to apply the CSS classes
  await nextTick();

  // Wait for all fonts to load natively (to avoid misalignment caused by character size)
  await document.fonts.ready;

  // Wait for the next animation frame to ensure that the browser has finished calculating the CSS layout
  await new Promise((resolve) => requestAnimationFrame(resolve));

  Prism.highlightElement(el);
  linkifySourceUrls(el, props.baseUrl);
}

onMounted(render);
watch(() => [props.code, props.language], render);
watch(() => props.wrap, syncLineNumbers);
</script>

<template>
  <!--
  The line-numbers CSS needs `pre[class*="language-"].line-numbers`, and Prism also stamps `language-*` onto the <pre>.
  Vue owns both classes here so a wrap toggle re-patch never drops them (which would hide the line numbers).
  -->
  <pre
    ref="preEl"
    class="line-numbers"
    :class="[`language-${language}`, { 'wrap-code': wrap }]"
  ><code ref="codeEl" :class="[`language-${language}`]">{{ code }}</code></pre>
</template>

<style>
pre {
  padding: 20px;
  margin: 0;
  tab-size: 4;
}

pre.wrap-code,
pre.wrap-code code {
  overflow-wrap: break-word !important;
  white-space: pre-wrap !important;
}

pre .source-link {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

pre .source-link:hover {
  text-decoration: underline;
}
</style>
