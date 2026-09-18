/**
 * Utilitário para upload e conversão de fotos de documentos para o Google Drive
 * utilizando o mesmo endpoint Google Apps Script que gerencia o Google Sheets.
 */

import { compressDocumentImage } from './documentStorage';

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  directUrl?: string; // Link direto para exibição da imagem em tags <img>
  viewUrl?: string;   // Link de visualização no Google Drive
  error?: string;
}

/**
 * Converte qualquer URL de arquivo do Google Drive para um link direto de imagem.
 * Suporta formatos:
 * - https://drive.google.com/file/d/FILE_ID/view...
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export function extractDriveFileId(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  const matchLh3 = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3 && matchLh3[1]) return matchLh3[1];

  return '';
}

/**
 * Detecta se a URL ou dados do documento representam um arquivo PDF
 */
export function isPdfDocument(urlOrData: string): boolean {
  if (!urlOrData) return false;
  const lower = urlOrData.toLowerCase();
  return lower.startsWith('data:application/pdf') || lower.includes('.pdf');
}

export function formatDriveDirectImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // Se já for data:image ou link comum não-Drive
  if (!trimmed.includes('drive.google.com') && !trimmed.includes('googleusercontent.com')) {
    return trimmed;
  }

  // Extrai o File ID
  const fileId = extractDriveFileId(trimmed);

  if (fileId) {
    // lh3.googleusercontent.com/d/FILE_ID é o formato mais estável e rápido para renderizar em <img>
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Envia uma imagem comprimida para o Google Drive através do WebApp do Apps Script
 */
export async function uploadDocumentToGoogleDrive(
  webappUrl: string,
  base64DataUrl: string,
  fileName: string,
  produtorNome?: string
): Promise<DriveUploadResult> {
  if (!webappUrl || !webappUrl.startsWith('http')) {
    return {
      success: false,
      error: 'URL do Google Apps Script não configurada nas opções de sincronização.',
    };
  }

  try {
    const payload = {
      action: 'uploadDocument',
      fileName: fileName || `documento_${Date.now()}.jpg`,
      fileData: base64DataUrl,
      produtorNome: produtorNome || 'Produtor',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webappUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta do servidor: HTTP ${response.status}`);
    }

    const resJson = await response.json();

    if (resJson.status === 'success' && resJson.directUrl) {
      return {
        success: true,
        fileId: resJson.fileId,
        directUrl: formatDriveDirectImageUrl(resJson.directUrl),
        viewUrl: resJson.viewUrl || resJson.directUrl,
      };
    } else {
      return {
        success: false,
        error: resJson.message || 'O script do Google Drive retornou um erro.',
      };
    }
  } catch (err: any) {
    console.warn('Erro no upload para o Google Drive:', err);
    return {
      success: false,
      error: err.message || 'Falha ao enviar arquivo para o Google Drive.',
    };
  }
}
