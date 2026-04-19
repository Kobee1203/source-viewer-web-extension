async function loadSource() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get("url");
  const codeBlock = document.getElementById("code-block");
  const loader = document.getElementById("loader");

  if (!url) return;

  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // Formatage du code HTML avec une indentation de 2 espaces
    const formattedText = typeof html_beautify !== 'undefined' 
      ? html_beautify(text, { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 2 })
      : text;

    // Protection contre l'injection HTML
    codeBlock.textContent = formattedText;
    
    // Application de la coloration
    Prism.highlightElement(codeBlock);
    loader.style.display = "none";
  } catch (err) {
    loader.textContent = "Erreur : Impossible de charger la source. Cela peut être dû aux restrictions CORS du site.";
    console.error(err);
  }
}

loadSource();

// Gestion des thèmes
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

// Charger la préférence sauvegardée
chrome.storage.local.get(["theme"], (result) => {
  if (result.theme) {
    themeSelector.value = result.theme;
    themeLink.href = "vendor/" + result.theme;
    applyBodyTheme(result.theme);
  }
});

// Gérer le changement
themeSelector.addEventListener("change", (e) => {
  const selectedTheme = e.target.value;
  themeLink.href = "vendor/" + selectedTheme;
  applyBodyTheme(selectedTheme);
  chrome.storage.local.set({ theme: selectedTheme });
});