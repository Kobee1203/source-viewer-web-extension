// Translate HTML elements
document.querySelectorAll('[data-i18n]').forEach(elem => {
  const message = browser.i18n.getMessage(elem.getAttribute('data-i18n'));
  if (message) {
    elem.textContent = message;
  }
});

let currentFormattedText = "";

const preElement = document.querySelector("pre");
const codeBlock = document.getElementById("code-block");

function applyCodeAndHighlight() {
  // Protection against HTML injection
  codeBlock.textContent = currentFormattedText;
  // Apply syntax highlighting
  Prism.highlightElement(codeBlock);
}

async function loadSource() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get("url");
  const loader = document.getElementById("loader");

  if (!url) return;

  try {
    const response = await browser.runtime.sendMessage({ type: 'FETCH_SOURCE', url: url });
    
    if (!response || !response.ok) {
      const errorMsg = response ? response.error : browser.i18n.getMessage("errorUnknown");
      loader.textContent = browser.i18n.getMessage("errorLoadSource", [errorMsg]);
      console.error(response && response.error);
      return;
    }

    const text = response.text;
    
    // Format HTML code with 2 spaces indentation
    currentFormattedText = typeof html_beautify !== 'undefined' 
      ? html_beautify(text, { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 2 })
      : text;

    applyCodeAndHighlight();

    loader.style.display = "none";
  } catch (err) {
    loader.textContent = browser.i18n.getMessage("errorGeneric", [err.message]);
    console.error(err);
  }
}

loadSource();

// Theme management
const themeSelector = document.getElementById("theme-selector");
const themeLink = document.getElementById("theme-link");

function applyBodyTheme(themeName) {
  if (themeName.includes("coy") || themeName === "prism.min.css") {
    document.body.style.background = "#f5f2f0";
    document.body.style.color = "#000";
    document.querySelector(".toolbar").style.background = "#ddd";
    document.querySelector(".toolbar").style.color = "#000";
    document.querySelector(".toolbar").style.borderBottom = "1px solid #ccc";
    themeSelector.style.background = "#fff";
    themeSelector.style.color = "#000";
    themeSelector.style.border = "1px solid #aaa";
  } else {
    document.body.style.background = "#1e1e1e";
    document.body.style.color = "#d4d4d4";
    document.querySelector(".toolbar").style.background = "#333";
    document.querySelector(".toolbar").style.color = "#d4d4d4";
    document.querySelector(".toolbar").style.borderBottom = "1px solid #444";
    themeSelector.style.background = "#555";
    themeSelector.style.color = "#fff";
    themeSelector.style.border = "1px solid #666";
  }
}

// Handle word wrap
const wrapCheckbox = document.getElementById("word-wrap-checkbox");

// Load saved preferences
browser.storage.local.get(["theme", "wordWrap"]).then((result) => {
  if (result.theme) {
    themeSelector.value = result.theme;
    themeLink.href = "vendor/" + result.theme;
    applyBodyTheme(result.theme);
  }
  if (result.wordWrap !== undefined) {
    wrapCheckbox.checked = result.wordWrap;
    if (result.wordWrap) {
      preElement.classList.add("wrap-code");
    }
  }
});

// Handle theme change
themeSelector.addEventListener("change", (e) => {
  const selectedTheme = e.target.value;
  themeLink.href = "vendor/" + selectedTheme;
  applyBodyTheme(selectedTheme);
  browser.storage.local.set({ theme: selectedTheme });
});

// Handle word wrap change
wrapCheckbox.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  if (isChecked) {
    preElement.classList.add("wrap-code");
  } else {
    preElement.classList.remove("wrap-code");
  }

  applyCodeAndHighlight();

  browser.storage.local.set({ wordWrap: isChecked });
});