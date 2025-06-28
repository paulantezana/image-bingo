let uploadedImages = [];
let usedImages = [];

// Configurar eventos
document.getElementById('imageInput').addEventListener('change', handleImageUpload);

// Configurar drag & drop
const uploadArea = document.querySelector('.upload-area');
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files);
  processFiles(files);
}

function handleImageUpload(e) {
  const files = Array.from(e.target.files);
  processFiles(files);
}

function processFiles(files) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    showStatus('Por favor selecciona archivos de imagen válidos.', 'danger');
    return;
  }

  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageData = {
        src: e.target.result,
        name: file.name
      };
      uploadedImages.push(imageData);
      updateImagePreview();
      showStatus(`${uploadedImages.length} imagen(es) subida(s) correctamente.`, 'success');
    };
    reader.readAsDataURL(file);
  });
}

function updateImagePreview() {
  const preview = document.getElementById('imagesPreview');

  const htmlContent = uploadedImages.map((image, index) => `
    <div class="image-item">
      <img src="${image.src}" alt="${image.name}" title="${image.name}">
      <button class="remove-img dn-btn sm danger circle" onClick="removeImage(${index})" title="Eliminar imagen">×</button>
    </div>
  `).join('');

  preview.innerHTML = htmlContent;
}

function removeImage(index) {
  uploadedImages.splice(index, 1);
  updateImagePreview();
  showStatus(`Imagen eliminada. ${uploadedImages.length} imagen(es) restante(s).`, 'success');
}

function showStatus(message, type = 'success') {
  const status = document.getElementById('imageStatus');
  status.innerHTML = `<div class="dn-alert ${type === 'danger' ? 'danger' : 'success'}">${message}</div>`;
  setTimeout(() => {
    status.innerHTML = '';
  }, 3000);
}

function generateBingo() {
  if (uploadedImages.length === 0) {
    showStatus('Primero debes subir algunas imágenes.', 'danger');
    return;
  }

  const rows = parseInt(document.getElementById('gridRows').value);
  const cols = parseInt(document.getElementById('gridCols').value);
  const numCards = parseInt(document.getElementById('numCards').value);
  const cellsPerCard = rows * cols;

  if (uploadedImages.length < cellsPerCard) {
    showStatus(`Necesitas al menos ${cellsPerCard} imágenes para una cuadrícula de ${rows}x${cols}.`, 'danger');
    return;
  }

  // Generar cartillas listas para impresión
  generateBingoCards(rows, cols, numCards);

  // Generar imágenes individuales listas para impresión
  generateIndividualImages(rows, cols);

  // Mostrar secciones
  document.getElementById('bingoSection').style.display = 'block';
  document.getElementById('individualSection').style.display = 'block';

  // Hacer scroll hacia las cartillas
  document.getElementById('bingoSection').scrollIntoView({ behavior: 'smooth' });

  showStatus(`¡${numCards} cartilla(s) de bingo generada(s) exitosamente!`, 'success');
}

function generateBingoCards(rows, cols, numCards) {
  const container = document.getElementById('bingoCards');
  usedImages = [];
  let htmlContent = '';

  for (let cardNum = 1; cardNum <= numCards; cardNum++) {
    // Seleccionar imágenes aleatorias para esta cartilla
    const cardImages = getRandomImages(rows * cols);

    // style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);"

    htmlContent += `
      <div class="bingo-card sheet-page">
        <div class="bingo-header">
          <div class="bingo-headDeco">
            <div class="bingo-react"></div>
            <div class="bingo-react red"></div>
            <div class="bingo-react"></div>
          </div>
          <h3 class="bingo-title">BINGO</h3>
          <p class="bingo-subtitle">FIESTAS PATRIAS PERÚ</p>
          <div class="bingo-date">28 DE JULIO</div>
        </div>
        <div class="bingo-body">
          <div class="bingo-grid">
            ${cardImages.map(image => `
              <div class="bingo-cell">
                <img src="${image.src}" alt="${image.name}">
              </div>
            `).join('')}
          </div>
          <div class="bingo-footer">
            <div class="bingo-react"></div>
            <div class="bingo-react red"></div>
            <p class="bingo-footTitle">¡VIVA EL PERÚ!</p>
            <div class="bingo-react red"></div>
            <div class="bingo-react"></div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = htmlContent;
}

function generateIndividualImages(rows, cols) {
  const container = document.getElementById('individualImages');

  let htmlContent = `
      <div class="individual-images-grid">
        ${usedImages.map((image, index) => `
          <div class="individual-image">
            <img src="${image.src}" alt="${image.name}">
          </div>
        `).join('')}
      </div>
    `;

  container.innerHTML = htmlContent;
}

function getRandomImages(count) {
  const shuffled = [...uploadedImages].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Agregar a las imágenes usadas para la sección individual
  selected.forEach(img => {
    if (!usedImages.some(used => used.src === img.src)) {
      usedImages.push(img);
    }
  });

  return selected;
}

// Funciones de descarga PDF simplificadas
async function downloadCardsPDF() {
  try {
    const bingoSection = document.getElementById('bingoCards');

    const options = {
      filename: 'bingo-cartilla.pdf',
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        scale: 2,
        // allowTaint: true,
        backgroundColor: '#ffffff'
      },

      // Unidad de medida en milimetros
      margin: 32,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },

      // Saltos de linea
      pagebreak: { mode: 'css', after: '.sheet-page:not(:last-child)' }
    };

    await html2pdf().set(options).from(bingoSection).save();
    showStatus('¡PDF de cartillas descargado exitosamente!', 'success');

  } catch (error) {
    console.error('Error al generar PDF:', error);
    showStatus('Error al generar el PDF. Por favor intenta de nuevo.', 'danger');
  }
}

async function downloadImagesPDF() {
  try {
    const imagesSection = document.getElementById('individualImages');

    const options = {
      filename: 'bingo-imagenes.pdf',
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        scale: 2,
        // allowTaint: true,
        backgroundColor: '#ffffff'
      },

      // Unidad de medida en milimetros
      margin: 12.7,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },

      // Saltos de linea
      // pagebreak: { mode: 'css', after: '.sheet-page:not(:last-child)' }
    };

    await html2pdf().set(options).from(imagesSection).save();
    showStatus('¡PDF de imágenes descargado exitosamente!', 'success');

  } catch (error) {
    console.error('Error al generar PDF:', error);
    showStatus('Error al generar el PDF. Por favor intenta de nuevo.', 'danger');
  }
}

async function downloadAllPDF() {
  if (document.getElementById('bingoCards').children.length === 0) {
    showStatus('Primero debes generar las cartillas de bingo.', 'danger');
    return;
  }

  showStatus('Generando PDF completo... Por favor espera.', 'success');

  downloadCardsPDF();
  downloadImagesPDF();
}

function clearAll() {
  if (confirm('¿Estás seguro de que quieres eliminar todas las imágenes y cartillas?')) {
    uploadedImages = [];
    usedImages = [];
    document.getElementById('imagesPreview').innerHTML = '';
    document.getElementById('bingoCards').innerHTML = '';
    document.getElementById('individualImages').innerHTML = '';
    document.getElementById('bingoSection').style.display = 'none';
    document.getElementById('individualSection').style.display = 'none';
    document.getElementById('imageInput').value = '';
    showStatus('Todo ha sido eliminado correctamente.', 'success');
  }
}

// Mensaje de bienvenida
window.addEventListener('load', () => {
  showStatus('¡Bienvenido! Sube algunas imágenes para comenzar a crear tus cartillas de bingo.', 'success');
});