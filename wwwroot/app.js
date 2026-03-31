const bulkText = document.getElementById("bulkText");
const fileInput = document.getElementById("fileInput");
const browseFileBtn = document.getElementById("browseFileBtn");
const fileNameLabel = document.getElementById("fileNameLabel");
const loadTextBtn = document.getElementById("loadTextBtn");
const prevBtn = document.getElementById("prevBtn");
const flipBtn = document.getElementById("flipBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const voiceToggleBtn = document.getElementById("voiceToggleBtn");
const speakBtn = document.getElementById("speakBtn");
const historyNameInput = document.getElementById("historyNameInput");
const saveHistoryBtn = document.getElementById("saveHistoryBtn");
const historySelect = document.getElementById("historySelect");
const loadHistoryBtn = document.getElementById("loadHistoryBtn");
const deleteHistoryBtn = document.getElementById("deleteHistoryBtn");
const clearHistoriesBtn = document.getElementById("clearHistoriesBtn");
const historyStatus = document.getElementById("historyStatus");

const card = document.getElementById("card");
const englishWord = document.getElementById("englishWord");
const vietnameseWord = document.getElementById("vietnameseWord");
const vietnameseFront = document.getElementById("vietnameseFront");
const ipaText = document.getElementById("ipaText");
const wordImage = document.getElementById("wordImage");
const imageCaption = document.getElementById("imageCaption");
const countLabel = document.getElementById("countLabel");
const indexLabel = document.getElementById("indexLabel");
const vocabTableBody = document.getElementById("vocabTableBody");

let cards = [];
let currentIndex = 0;
let showFront = true;
let histories = [];
let selectedVoiceGender = "female";
let currentAudio = null;
let availableSpeechVoices = [];

const HISTORY_KEY = "ev_flashcards_histories_v1";
const LAST_LIST_KEY = "ev_flashcards_last_list_v1";
const FEMALE_VOICE_HINTS = ["zira", "aria", "jenny", "samantha", "victoria", "ava", "emma", "susan", "female", "woman", "girl", "joanna", "kimberly", "salli"];
const MALE_VOICE_HINTS = ["david", "guy", "ryan", "mark", "daniel", "alex", "george", "male", "man", "boy", "matthew", "brian", "justin"];

loadTextBtn.addEventListener("click", () => {
  applyInputText(bulkText.value, true);
});

browseFileBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    fileNameLabel.textContent = "No file chosen";
    return;
  }

  fileNameLabel.textContent = file.name;
  const content = await file.text();
  bulkText.value = content;
  applyInputText(content, true);
});

prevBtn.addEventListener("click", () => {
  if (!cards.length) {
    return;
  }
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  showFront = true;
  renderCard();
});

nextBtn.addEventListener("click", () => {
  if (!cards.length) {
    return;
  }
  currentIndex = (currentIndex + 1) % cards.length;
  showFront = true;
  renderCard();
});

flipBtn.addEventListener("click", () => {
  if (!cards.length) {
    return;
  }
  showFront = !showFront;
  renderCardFaces();
});

shuffleBtn.addEventListener("click", () => {
  if (cards.length < 2) {
    return;
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  currentIndex = 0;
  showFront = true;
  renderCard();
});

voiceToggleBtn.addEventListener("click", () => {
  selectedVoiceGender = selectedVoiceGender === "female" ? "male" : "female";
  updateVoiceToggleUi();
});

speakBtn.addEventListener("click", () => {
  if (!cards.length) {
    return;
  }
  speak(cards[currentIndex].english);
});

saveHistoryBtn.addEventListener("click", () => {
  saveCurrentInputToHistory();
});

loadHistoryBtn.addEventListener("click", () => {
  loadSelectedHistory();
});

deleteHistoryBtn.addEventListener("click", () => {
  deleteSelectedHistory();
});

clearHistoriesBtn.addEventListener("click", () => {
  clearAllHistories();
});

vocabTableBody.addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-index]");
  if (!row) {
    return;
  }

  const rowIndex = Number(row.dataset.index);
  if (Number.isNaN(rowIndex) || rowIndex < 0 || rowIndex >= cards.length) {
    return;
  }

  currentIndex = rowIndex;
  showFront = true;
  renderCard();
});

function applyInputText(text, persistLastList) {
  cards = parseInputToCards(text);
  currentIndex = 0;
  showFront = true;
  renderVocabTable();
  renderCard();

  if (persistLastList) {
    saveLastList(text);
  }
}

function loadHistoriesFromStorage() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      histories = [];
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      histories = [];
      return;
    }

    histories = parsed
      .filter((x) => x && typeof x.text === "string")
      .map((x, index) => ({
        id: x.id || `${x.createdAt || "legacy"}-${index}`,
        name: x.name || `List ${index + 1}`,
        cardCount: Number.isFinite(x.cardCount) ? x.cardCount : parseInputToCards(x.text).length,
        createdAt: x.createdAt || "",
        text: x.text
      }));
  } catch {
    histories = [];
  }
}

function saveHistoriesToStorage() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(histories));
  } catch {
    setHistoryStatus("Cannot save histories in this browser.");
  }
}

function saveLastList(text) {
  try {
    localStorage.setItem(LAST_LIST_KEY, text);
  } catch {
    // Ignore if browser blocks storage.
  }
}

function loadLastList() {
  try {
    return localStorage.getItem(LAST_LIST_KEY) || "";
  } catch {
    return "";
  }
}

function renderHistorySelect() {
  historySelect.innerHTML = "";

  if (!histories.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved histories";
    historySelect.appendChild(option);
    return;
  }

  for (const entry of histories) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.name} (${entry.cardCount} cards)`;
    historySelect.appendChild(option);
  }
}

function saveCurrentInputToHistory() {
  const text = bulkText.value.trim();
  if (!text) {
    setHistoryStatus("Nothing to save.");
    return;
  }

  const parsedCards = parseInputToCards(text);
  if (!parsedCards.length) {
    setHistoryStatus("Input format is invalid.");
    return;
  }

  const userName = historyNameInput.value.trim();
  const timestamp = new Date();
  const createdAtIso = timestamp.toISOString();
  const fallbackName = `List ${timestamp.toLocaleString()}`;

  const entry = {
    id: createdAtIso,
    name: userName || fallbackName,
    cardCount: parsedCards.length,
    createdAt: createdAtIso,
    text
  };

  histories.unshift(entry);
  saveHistoriesToStorage();
  renderHistorySelect();
  historySelect.value = entry.id;
  saveLastList(text);
  setHistoryStatus(`Saved "${entry.name}".`);
}

function loadSelectedHistory() {
  const id = historySelect.value;
  if (!id) {
    setHistoryStatus("No history selected.");
    return;
  }

  const selected = histories.find((x) => x.id === id);
  if (!selected) {
    setHistoryStatus("Selected history was not found.");
    return;
  }

  bulkText.value = selected.text;
  applyInputText(selected.text, true);
  setHistoryStatus(`Loaded "${selected.name}".`);
}

function deleteSelectedHistory() {
  const id = historySelect.value;
  if (!id) {
    setHistoryStatus("No history selected.");
    return;
  }

  const before = histories.length;
  histories = histories.filter((x) => x.id !== id);
  if (histories.length === before) {
    setHistoryStatus("Selected history was not found.");
    return;
  }

  saveHistoriesToStorage();
  renderHistorySelect();
  setHistoryStatus("Deleted selected history.");
}

function clearAllHistories() {
  histories = [];
  saveHistoriesToStorage();
  renderHistorySelect();
  setHistoryStatus("All histories cleared.");
}

function setHistoryStatus(message) {
  historyStatus.textContent = message;
}

async function loadDefaultVocabularyFile() {
  try {
    const response = await fetch("data/flashcards_vocab.tsv", { cache: "no-store" });
    if (!response.ok) {
      return false;
    }

    const text = await response.text();
    if (!text.trim()) {
      return false;
    }

    bulkText.value = text;
    applyInputText(text, true);
    return true;
  } catch {
    return false;
  }
}

async function initializeLocalPersistence() {
  loadHistoriesFromStorage();
  renderHistorySelect();

  const lastList = loadLastList();
  if (lastList.trim()) {
    bulkText.value = lastList;
    applyInputText(lastList, false);
    setHistoryStatus("Restored last session.");
  } else {
    const loadedDefault = await loadDefaultVocabularyFile();
    if (loadedDefault) {
      setHistoryStatus("Loaded default vocabulary file.");
    } else {
      setHistoryStatus("No previous session found.");
      renderCard();
    }
  }
}

function parseInputToCards(text) {
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const parsed = [];

  for (const line of lines) {
    const isTabSeparated = line.includes("\t");
    const parts = isTabSeparated
      ? line.split("\t").map((x) => x.trim())
      : line.split(",").map((x) => x.trim());

    if (parts.length < 1) {
      continue;
    }

    let english = "";
    let ipa = "";
    let vietnamese = "";

    if (parts.length === 1) {
      const englishAndIpa = extractEnglishAndIpa(parts[0]);
      english = englishAndIpa.english;
      ipa = englishAndIpa.ipa;
    } else if (parts.length >= 3) {
      english = parts[0];
      ipa = parts[1];
      vietnamese = parts.slice(2).join(isTabSeparated ? "\t" : ",").trim();
    } else {
      const englishAndIpa = extractEnglishAndIpa(parts[0]);
      english = englishAndIpa.english;
      ipa = englishAndIpa.ipa;
      vietnamese = parts[1];
    }

    if (!english) {
      continue;
    }
    parsed.push({ english, vietnamese, ipa, imageUrl: "" });
  }

  return parsed;
}

function extractEnglishAndIpa(firstColumn) {
  const text = firstColumn.trim();

  // Pattern: "word /ipa/"
  const slashWrapped = text.match(/^(.*?)\s*(\/[^/]+\/)\s*$/);
  if (slashWrapped) {
    return {
      english: slashWrapped[1].trim(),
      ipa: slashWrapped[2].trim()
    };
  }

  // Pattern: "word [ipa]"
  const bracketWrapped = text.match(/^(.*?)\s*(\[[^\]]+\])\s*$/);
  if (bracketWrapped) {
    return {
      english: bracketWrapped[1].trim(),
      ipa: bracketWrapped[2].trim()
    };
  }

  return { english: text, ipa: "" };
}

function renderCardFaces() {
  card.classList.toggle("show-front", showFront);
  card.classList.toggle("show-back", !showFront);
}

function renderVocabTable() {
  if (!cards.length) {
    vocabTableBody.innerHTML = '<tr><td colspan="4" class="empty-table">No words loaded</td></tr>';
    return;
  }

  vocabTableBody.innerHTML = cards.map((item, idx) => {
    const selectedClass = idx === currentIndex ? "selected-row" : "";
    const ipa = item.ipa || "";
    const vietnamese = item.vietnamese || "";

    return `
      <tr class="${selectedClass}" data-index="${idx}">
        <td>${idx + 1}</td>
        <td>${escapeHtml(item.english)}</td>
        <td>${escapeHtml(ipa)}</td>
        <td>${escapeHtml(vietnamese)}</td>
      </tr>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function renderCard() {
  const total = cards.length;
  countLabel.textContent = `${total} cards`;

  if (!total) {
    englishWord.textContent = "No word loaded";
    vietnameseWord.textContent = "";
    vietnameseFront.textContent = "";
    ipaText.textContent = "";
    wordImage.removeAttribute("src");
    wordImage.alt = "Word image";
    imageCaption.textContent = "";
    indexLabel.textContent = "0 / 0";
    card.classList.add("show-front");
    card.classList.remove("show-back");
    renderVocabTable();
    return;
  }

  const item = cards[currentIndex];
  englishWord.textContent = item.english;
  vietnameseWord.textContent = item.vietnamese || "Loading meaning...";
  vietnameseFront.textContent = item.vietnamese || "Loading meaning...";
  ipaText.textContent = item.ipa || "Loading IPA...";
  wordImage.removeAttribute("src");
  imageCaption.textContent = "Loading image...";
  indexLabel.textContent = `${currentIndex + 1} / ${total}`;
  renderCardFaces();

  await Promise.all([
    hydrateVietnamese(item),
    hydrateIpa(item),
    hydrateImage(item)
  ]);

  vietnameseWord.textContent = item.vietnamese || "Vietnamese meaning not available";
  vietnameseFront.textContent = item.vietnamese || "Vietnamese meaning not available";
  ipaText.textContent = item.ipa || "IPA not available";
  if (item.imageUrl) {
    wordImage.src = item.imageUrl;
    wordImage.alt = item.english;
    imageCaption.textContent = "Image from Wikimedia Commons";
  } else {
    imageCaption.textContent = "Image not available";
  }

  renderVocabTable();
}

async function hydrateVietnamese(cardItem) {
  if (cardItem.vietnamese) {
    return;
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cardItem.english)}&langpair=en|vi`;
    const response = await fetch(url);
    if (!response.ok) {
      cardItem.vietnamese = "";
      return;
    }

    const data = await response.json();
    const translatedText = data?.responseData?.translatedText?.trim();
    if (!translatedText) {
      cardItem.vietnamese = "";
      return;
    }

    cardItem.vietnamese = translatedText.toLowerCase() === cardItem.english.toLowerCase()
      ? ""
      : translatedText;
  } catch {
    cardItem.vietnamese = "";
  }
}

async function hydrateIpa(cardItem) {
  if (cardItem.ipa) {
    return;
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cardItem.english)}`);
    if (!response.ok) {
      cardItem.ipa = "";
      return;
    }

    const data = await response.json();
    const phonetics = data?.[0]?.phonetics || [];
    const found = phonetics.find((x) => typeof x.text === "string" && x.text.trim().length > 0);
    cardItem.ipa = found?.text || data?.[0]?.phonetic || "";
  } catch {
    cardItem.ipa = "";
  }
}

async function hydrateImage(cardItem) {
  if (cardItem.imageUrl) {
    return;
  }

  try {
    const query = encodeURIComponent(cardItem.english);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime`;
    const response = await fetch(url);
    if (!response.ok) {
      cardItem.imageUrl = "";
      return;
    }

    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) {
      cardItem.imageUrl = "";
      return;
    }

    const pageList = Object.values(pages);
    const validImageInfos = pageList
      .map((p) => p?.imageinfo?.[0])
      .filter((info) => isRenderableImageInfo(info));

    if (!validImageInfos.length) {
      cardItem.imageUrl = "";
      return;
    }

    const randomIndex = Math.floor(Math.random() * validImageInfos.length);
    cardItem.imageUrl = validImageInfos[randomIndex].url;
  } catch {
    cardItem.imageUrl = "";
  }
}

function isRenderableImageInfo(info) {
  if (!info?.url || !info?.mime) {
    return false;
  }

  const mime = info.mime.toLowerCase();
  if (!mime.startsWith("image/")) {
    return false;
  }

  // Keep browser-friendly image types.
  return (
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/gif" ||
    mime === "image/webp" ||
    mime === "image/svg+xml"
  );
}

function speak(text) {
  speakViaApi(text).catch(() => {
    speakViaBrowser(text);
  });
}

function updateVoiceToggleUi() {
  const isFemale = selectedVoiceGender === "female";
  voiceToggleBtn.innerHTML = isFemale
    ? '<span class="btn-icon" aria-hidden="true">♀</span>Voice: Female'
    : '<span class="btn-icon" aria-hidden="true">♂</span>Voice: Male';
}

async function speakViaApi(text) {
  if (!text) {
    return;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const voiceName = selectedVoiceGender === "female" ? "Joanna" : "Matthew";
  const apiUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceName}&text=${encodeURIComponent(text)}`;
  const audio = new Audio(apiUrl);
  currentAudio = audio;

  try {
    await audio.play();
  } finally {
    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
    };
  }
}

function speakViaBrowser(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = selectedVoiceGender === "female" ? 1.15 : 0.9;
  const selected = selectBrowserVoice(selectedVoiceGender);
  if (selected) {
    utterance.voice = selected;
  }
  window.speechSynthesis.speak(utterance);
}

function refreshSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    availableSpeechVoices = [];
    return;
  }
  availableSpeechVoices = window.speechSynthesis.getVoices() || [];
}

function selectBrowserVoice(gender) {
  const englishVoices = availableSpeechVoices.filter((v) =>
    (v.lang || "").toLowerCase().startsWith("en")
  );
  if (!englishVoices.length) {
    return null;
  }

  const preferredHints = gender === "female" ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
  const oppositeHints = gender === "female" ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;

  const exact = englishVoices.find((v) => {
    const name = (v.name || "").toLowerCase();
    return preferredHints.some((h) => name.includes(h));
  });
  if (exact) {
    return exact;
  }

  const nonOpposite = englishVoices.find((v) => {
    const name = (v.name || "").toLowerCase();
    return !oppositeHints.some((h) => name.includes(h));
  });
  return nonOpposite || englishVoices[0];
}

updateVoiceToggleUi();
refreshSpeechVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = refreshSpeechVoices;
}
initializeLocalPersistence();
