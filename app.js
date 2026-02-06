/* happy-being-me v1
   - AI陪同看自己：固定母版模組
   - localStorage保存
   - 一鍵組合咒語+內容 -> 複製到剪貼簿
*/

const STORAGE_KEY = "happy_being_me_v1";
const MODE_KEY = "happy_being_me_mode_v1"; // private | share

const pages = Array.from(document.querySelectorAll(".page"));
const toast = document.getElementById("toast");

const modeBtn = document.getElementById("modeBtn");
const modeLabel = document.getElementById("modeLabel");
const modeModal = document.getElementById("modeModal");
const pickPrivate = document.getElementById("pickPrivate");
const pickShare = document.getElementById("pickShare");
const confirmModeBtn = document.getElementById("confirmModeBtn");

const goLibrary = document.getElementById("goLibrary");

const reviewBtn = document.getElementById("reviewBtn");
const reviewPanel = document.getElementById("reviewPanel");
const reviewBox = document.getElementById("reviewBox");
const closeReview = document.getElementById("closeReview");
const copyAllBtn = document.getElementById("copyAllBtn");
const downloadBtn = document.getElementById("downloadBtn");

const fields = ["t1","t2","t3","t4","library"];

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 850);
}

function showPage(name){
  pages.forEach(p => p.classList.toggle("active", p.dataset.page === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch{
    return {};
  }
}

function saveState(partial){
  const state = { ...loadState(), ...partial, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getMode(){
  const m = localStorage.getItem(MODE_KEY);
  return (m === "share" || m === "private") ? m : "private";
}
function setMode(m){
  localStorage.setItem(MODE_KEY, m);
  renderMode();
}
function renderMode(){
  const m = getMode();
  modeLabel.textContent = (m === "private") ? "留給自己" : "願意分享";
  const dot = modeBtn.querySelector(".dot");
  dot.style.background = (m === "private") ? "#2e6b3b" : "#0c2a16";
  dot.style.boxShadow = (m === "private")
    ? "0 0 0 4px rgba(46,107,59,.12)"
    : "0 0 0 4px rgba(12,42,22,.10)";
}

/* ===== AI 陪同看自己：固定母版模組 ===== */
function aiCompanionPrompt({ title, userText }){
  const modeLine = (getMode() === "private")
    ? "（模式：留給自己；請維持私密感，不要叫我去發佈或做行銷。）"
    : "（模式：願意分享；仍不需要叫我公開，只要整理得可讀可說。）";

  const safeText = (userText || "").trim();

  return `你不是老師、不是顧問、不是分析師。你是一位溫柔、安靜、可靠的陪伴者。
你的任務不是帶我往前，而是陪我站在這裡，看我自己。${modeLine}

請你坐在我旁邊，陪我慢慢看我寫下的這些文字。
不需要評價我、修正我、指導我，也不需要急著整理成答案。

請用溫和、清楚、不下結論的方式，
幫我把零散的想法說成我能聽懂的語句。
不用刻意美化，也不用刻意隱藏。

如果有不同理解的可能，請輕輕提出，
讓我自己感受哪一個比較像我。
（不要使用「你應該」。不要給行動清單。不要做成功學式鼓勵。）

【欄位】${title}
【我的文字】${safeText || "（我先留白，你可以先溫柔地問我一個最容易回答的問題，幫我開始。）"}

請輸出：
1) 你聽到的我（用1～3句溫柔重述）
2) 可能的意思（列出2～3個「可能」版本，不下定論）
3) 一句我可以對自己說的話（短、真實、不雞湯）`;
}

/* ===== Copy helpers ===== */
async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    showToast("已複製");
    return true;
  }catch{
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("已複製");
    return true;
  }
}

/* ===== Review ===== */
function buildReview(){
  const s = loadState();
  const blocks = [
    ["我最近在想什麼", s.t1],
    ["我被什麼事困擾或疑惑", s.t2],
    ["我其實很在意的是", s.t3],
    ["我已經具備的", s.t4],
    ["素材庫", s.library],
  ];
  return blocks.map(([k,v]) => `【${k}】\n${(v||"").trim() || "（留白）"}`).join("\n\n");
}

function downloadTextFile(text){
  const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date();
  const pad = n => String(n).padStart(2,"0");
  a.download = `happy-being-me-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}.txt`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ===== Events ===== */
document.addEventListener("click", async (e) => {
  const go = e.target.closest("[data-go]");
  if(go){
    showPage(go.getAttribute("data-go"));
    return;
  }

  const saveBtn = e.target.closest("[data-save]");
  if(saveBtn){
    const id = saveBtn.getAttribute("data-save");
    const next = saveBtn.getAttribute("data-next");
    const el = document.getElementById(id);
    saveState({ [id]: (el?.value || "").trim() });
    showPage(next);
    return;
  }

  const aiBtn = e.target.closest("[data-ai]");
  if(aiBtn){
    const id = aiBtn.getAttribute("data-ai");
    const title = aiBtn.getAttribute("data-title") || "陪我一起看看";
    const text = (document.getElementById(id)?.value || "").trim();
    const prompt = aiCompanionPrompt({ title, userText: text });
    await copyText(prompt);
    return;
  }
});

goLibrary?.addEventListener("click", () => showPage("library"));

/* Mode modal */
let pendingMode = getMode();
modeBtn.addEventListener("click", () => {
  pendingMode = getMode();
  pickPrivate.style.borderColor = "rgba(16,32,22,.12)";
  pickShare.style.borderColor = "rgba(16,32,22,.12)";
  modeModal.showModal();
});
pickPrivate.addEventListener("click", () => {
  pendingMode = "private";
  pickPrivate.style.borderColor = "rgba(46,107,59,.45)";
  pickShare.style.borderColor = "rgba(16,32,22,.12)";
});
pickShare.addEventListener("click", () => {
  pendingMode = "share";
  pickShare.style.borderColor = "rgba(12,42,22,.40)";
  pickPrivate.style.borderColor = "rgba(16,32,22,.12)";
});
confirmModeBtn.addEventListener("click", () => setMode(pendingMode));

/* Review */
reviewBtn?.addEventListener("click", () => {
  reviewPanel.hidden = false;
  reviewBox.textContent = buildReview();
});
closeReview?.addEventListener("click", () => (reviewPanel.hidden = true));
copyAllBtn?.addEventListener("click", async () => copyText(buildReview()));
downloadBtn?.addEventListener("click", () => downloadTextFile(buildReview()));

/* Auto-save on blur */
fields.forEach((id) => {
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener("blur", () => saveState({ [id]: el.value.trim() }));
});

/* Init */
(function init(){
  const s = loadState();
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if(el) el.value = s[id] || "";
  });
  renderMode();
})();
