import { idbGet, idbSet, idbDelete } from './indexedDB';

const DOC_PREFIX = 'doc_file_';

// Extensões e tipos MIME permitidos com segurança
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Extensões perigosas bloqueadas explicitamente
export const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'php', 'js', 'ts', 'vbs', 'scr', 'msi', 'com',
  'pif', 'jar', 'apk', 'iso', 'bin', 'dll', 'sys', 'reg', 'ps1', 'py', 'zip', 'rar', '7z', 'tar', 'gz'
];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // Limite máximo de 15MB antes da compressão para não estourar a memória

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  isPdf?: boolean;
  fileExtension?: string;
}

/**
 * Validação rigorosa de arquivos antes do processamento.
 * Bloqueia extensões executáveis, arquivos corrompidos ou tamanhos abusivos.
 */
export function validateDocumentFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado.' };
  }

  // 1. Verificação de tamanho contra estouro de memória (Memory Overflow)
  if (file.size <= 0) {
    return { valid: false, error: 'O arquivo selecionado está vazio (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). O limite máximo por documento é de 15 MB para proteger o desempenho e a memória do sistema.`
    };
  }

  // 2. Extração e sanitização da extensão do nome
  const parts = file.name.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'O arquivo não possui uma extensão válida (.jpg, .png, .pdf).' };
  }

  const ext = parts[parts.length - 1].toLowerCase().trim();

  // 3. Verificação contra extensões de risco / scripts executáveis
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Envio bloqueado por segurança: arquivos com extensão ".${ext}" não são permitidos por segurança do sistema.`
    };
  }

  // 4. Verificação de extensão permitida
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato de arquivo não suportado (.${ext}). Por favor, envie somente documentos em JPG, PNG, WEBP ou PDF.`
    };
  }

  // 5. Verificação de MIME Type (se disponível pelo navegador)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `Tipo de mídia inválido (${file.type}). Por favor selecione uma imagem (JPG, PNG) ou PDF autêntico.`
    };
  }

  return {
    valid: true,
    isPdf: ext === 'pdf' || file.type === 'application/pdf',
    fileExtension: ext
  };
}

/**
 * Comprime e otimiza imagens de documentos de identidade (RG, CNH, comprovantes)
 * Reduz arquivos pesados (ex: fotos de celular de 5MB-10MB) para ~100KB-250KB,
 * preservando nitidez total de textos, CPFs, números e assinaturas.
 */
export async function compressDocumentImage(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; sizeKb: number; originalSizeKb: number; isPdf?: boolean }> {
  const originalSizeKb = Math.round(file.size / 1024);

  // Se for PDF, lê como DataURL sem passar pelo canvas (não estraga os bytes do PDF)
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          dataUrl: result,
          sizeKb: Math.round(result.length / 1024),
          originalSizeKb,
          isPdf: true,
        });
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo PDF.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback caso canvas 2D falhe
          const fallbackData = e.target?.result as string;
          resolve({
            dataUrl: fallbackData,
            sizeKb: Math.round(fallbackData.length / 1024),
            originalSizeKb,
          });
          return;
        }

        // Fundo branco caso haja transparência (evita fundos pretos em PNG convertidos para JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Suavização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          sizeKb,
          originalSizeKb,
        });
      };

      img.onerror = () => {
        reject(new Error('A imagem selecionada está corrompida ou ilegível. Envie outro arquivo.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo da mídia.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Salva a cópia do documento no repositório dedicado e isolado do IndexedDB.
 * Fica completamente desacoplado do localStorage, impedindo que estouros de quota afetem a base de dados.
 */
export async function saveDocumentFile(produtorId: string, dataUrl: string): Promise<boolean> {
  if (!produtorId) return false;
  if (!dataUrl || !dataUrl.trim()) {
    return await removeDocumentFile(produtorId);
  }
  try {
    return await idbSet(`${DOC_PREFIX}${produtorId}`, dataUrl.trim());
  } catch (err) {
    console.warn(`Aviso ao salvar arquivo de documento do produtor ${produtorId}:`, err);
    return false;
  }
}

/**
 * Recupera o documento do produtor a partir do IndexedDB
 */
export async function getDocumentFile(produtorId: string): Promise<string | null> {
  if (!produtorId) return null;
  try {
    const res = await idbGet<string>(`${DOC_PREFIX}${produtorId}`);
    if (!res || !res.trim()) return null;
    return res;
  } catch {
    return null;
  }
}

/**
 * Remove o arquivo de documento do produtor do IndexedDB
 */
export async function removeDocumentFile(produtorId: string): Promise<boolean> {
  if (!produtorId) return false;
  try {
    return await idbDelete(`${DOC_PREFIX}${produtorId}`);
  } catch {
    return false;
  }
}
