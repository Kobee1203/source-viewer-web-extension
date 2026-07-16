<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Prism from '@/utils/prism';
import { linkifySourceUrls } from '@/utils/linkify';
import type { FileType } from '@/utils/fileType';

const props = defineProps<{
  code: string;
  language: FileType;
  baseUrl: string;
  wrap: boolean;
}>();

const codeEl = ref<HTMLElement>();

function render(): void {
  const el = codeEl.value;
  if (!el) return;
  el.className = `language-${props.language}`; // grammar hint for Prism on the <code>
  el.textContent = props.code; // protection against HTML injection
  Prism.highlightElement(el);
  linkifySourceUrls(el, props.baseUrl);
}

onMounted(render);
watch(() => [props.code, props.language], render);
</script>

<template>
  <!--
    The line-numbers CSS needs `pre[class*="language-"].line-numbers`, and Prism also stamps `language-*` onto the <pre>.
    Vue owns both classes here so a wrap toggle re-patch never drops them (which would hide the line numbers).
  -->
  <pre class="line-numbers" :class="[`language-${language}`, { 'wrap-code': wrap }]"><code ref="codeEl"></code></pre>
</template>
