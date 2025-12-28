const input = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const grid = document.getElementById("preview-grid");
const clearAll = document.getElementById("clear-all");
const convertBtn = document.getElementById("convert-btn");
const downloadBtn = document.getElementById("download-btn");

const pageSize = document.getElementById("page-size");
const orientationSelect = document.getElementById("orientation");

let images = [];
let pdfBlobUrl = null;

/* ========== THEME ========== */
document.getElementById("theme-toggle").onclick =
  () => document.body.classList.toggle("dark");


/* ========== FILE IMPORT ========== */

input.addEventListener("change", e => loadFiles(e.target.files));

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.style.borderColor = "#3b82f6";
});

dropZone.addEventListener("dragleave", () =>
  dropZone.style.borderColor = "");

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.style.borderColor = "";
  loadFiles(e.dataTransfer.files);
});

function loadFiles(files) {
  [...files].forEach(file => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = e => {
      images.push({ name: file.name, src: e.target.result });
      renderGrid();
    };
    reader.readAsDataURL(file);
  });
}


/* ========== PREVIEW RENDER + REORDER ========== */

function renderGrid() {
  grid.innerHTML = "";

  images.forEach((img, index) => {
    const li = document.createElement("li");
    li.className = "preview-item";
    li.draggable = true;
    li.dataset.index = index;

    li.innerHTML = `
      <img class="preview-thumb" src="${img.src}">
      <div class="preview-label">Page ${index + 1}</div>
    `;

    addDragHandlers(li);
    grid.appendChild(li);
  });
}

let dragIndex = null;

function addDragHandlers(el) {
  el.addEventListener("dragstart", e => {
    dragIndex = +e.target.dataset.index;
    e.target.classList.add("dragging");
  });

  el.addEventListener("dragend", e =>
    e.target.classList.remove("dragging"));

  el.addEventListener("dragover", e => e.preventDefault());

  el.addEventListener("drop", e => {
    const targetIndex = +e.currentTarget.dataset.index;
    const item = images[dragIndex];

    images.splice(dragIndex, 1);
    images.splice(targetIndex, 0, item);

    renderGrid();
  });
}


/* ========== CLEAR IMAGES ========== */

clearAll.onclick = () => {
  if (!images.length) return;
  if (!confirm("Remove all images?")) return;

  images = [];
  grid.innerHTML = "";
  downloadBtn.classList.add("hidden");
};


/* ========== GENERATE PDF ========== */

convertBtn.onclick = async () => {
  if (!images.length) return alert("Upload at least one image.");

  convertBtn.textContent = "Converting...";
  convertBtn.disabled = true;

  const { jsPDF } = window.jspdf;

  const orientation =
    orientationSelect.value === "l" ? "landscape" : "portrait";

  const pdf = new jsPDF({
    unit: "pt",
    format: pageSize.value,
    orientation
  });

  for (let i = 0; i < images.length; i++) {
    const img = new Image();
    img.src = images[i].src;
    await img.decode();

    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const scale = Math.min(pw / img.width, ph / img.height);

    const w = img.width * scale;
    const h = img.height * scale;

    const x = (pw - w) / 2;
    const y = (ph - h) / 2;

    if (i > 0) pdf.addPage();

    pdf.addImage(img, "JPEG", x, y, w, h);
  }

  const blob = pdf.output("blob");
  pdfBlobUrl = URL.createObjectURL(blob);

  downloadBtn.href = pdfBlobUrl;
  downloadBtn.download = "images.pdf";
  downloadBtn.classList.remove("hidden");

  convertBtn.textContent = "Convert to PDF";
  convertBtn.disabled = false;
};
