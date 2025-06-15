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
      <div class="bingo-card">
        <h3>BINGO - Cartilla ${cardNum}</h3>
        <div class="bingo-grid">
          ${cardImages.map(image => `
            <div class="bingo-cell">
              <img src="${image.src}" alt="${image.name}">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = htmlContent;
}

function generateIndividualImages(rows, cols) {
  const container = document.getElementById('individualImages');

  // Usar todas las imágenes que aparecieron en las cartillas
  const uniqueImages = [...new Set(usedImages)];
  const cellsPerPage = rows * cols;
  let htmlContent = '';

  // Agrupar imágenes según las dimensiones de la cartilla
  for (let i = 0; i < uniqueImages.length; i += cellsPerPage) {
    const pageImages = uniqueImages.slice(i, i + cellsPerPage);

    htmlContent += `
      <div class="individual-images-page" style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);">
        ${pageImages.map((image, index) => `
          <div class="individual-image">
            <img src="${image.src}" alt="${image.name}">
            <h4>Imagen ${i + index + 1}</h4>
          </div>
        `).join('')}
        ${generateEmptyCells(cellsPerPage - pageImages.length)}
      </div>
    `;
  }

  container.innerHTML = htmlContent;
}

function generateEmptyCells(count) {
  return Array(count).fill().map(() =>
    '<div class="individual-image" style="visibility: hidden;"></div>'
  ).join('');
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
  if (document.getElementById('bingoCards').children.length === 0) {
    showStatus('Primero debes generar las cartillas de bingo.', 'danger');
    return;
  }

  showStatus('Generando PDF de cartillas... Por favor espera.', 'success');

  try {
    const bingoSection = document.getElementById('bingoCards');

    const options = {
      margin: 0,
      filename: 'cartillas-bingo.pdf',
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    await html2pdf().set(options).from(bingoSection).save();
    showStatus('¡PDF de cartillas descargado exitosamente!', 'success');

  } catch (error) {
    console.error('Error al generar PDF:', error);
    showStatus('Error al generar el PDF. Por favor intenta de nuevo.', 'danger');
  }
}

async function downloadImagesPDF() {
  if (usedImages.length === 0) {
    showStatus('Primero debes generar las cartillas para obtener las imágenes.', 'danger');
    return;
  }

  showStatus('Generando PDF de imágenes... Por favor espera.', 'success');

  try {
    const imagesSection = document.getElementById('individualImages');

    const options = {
      margin: 0,
      filename: 'imagenes-bingo.pdf',
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
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

  try {
    // Crear contenedor temporal que combine ambas secciones
    const combinedContainer = document.createElement('div');

    // Clonar las cartillas
    const bingoCards = document.getElementById('bingoCards').cloneNode(true);
    combinedContainer.appendChild(bingoCards);

    // Clonar las imágenes individuales
    const individualImages = document.getElementById('individualImages').cloneNode(true);
    combinedContainer.appendChild(individualImages);

    const options = {
      margin: 0,
      filename: 'bingo-completo.pdf',
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    await html2pdf().set(options).from(combinedContainer).save();
    showStatus('¡PDF completo descargado exitosamente!', 'success');

  } catch (error) {
    console.error('Error al generar PDF:', error);
    showStatus('Error al generar el PDF. Por favor intenta de nuevo.', 'danger');
  }
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