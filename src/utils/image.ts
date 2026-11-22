/**
 * Redimensiona una imagen a un máximo de 800px de ancho y la comprime
 * en formato JPEG con calidad 0.7 usando HTML5 Canvas.
 */
export function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado debe ser una imagen válida.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo de imagen.'));
    };

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Formato de lectura de imagen inválido.'));
        return;
      }

      const img = new Image();

      img.onerror = () => {
        reject(new Error('No se pudo procesar la imagen seleccionada.'));
      };

      img.onload = () => {
        const MAX_WIDTH = 800;
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > MAX_WIDTH) {
          const ratio = MAX_WIDTH / targetWidth;
          targetWidth = MAX_WIDTH;
          targetHeight = Math.round(img.height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de Canvas.'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
