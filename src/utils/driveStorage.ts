/**
 * Utilitário para upload e conversão de fotos de documentos para o Google Drive
 * utilizando o mesmo endpoint Google Apps Script que gerencia o Google Sheets.
 */

import { compressDocumentImage, getDocumentFile, saveDocumentFile } from './documentStorage';
import { ProdutorRural } from '../types';

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
 * Detecta se uma URL ou string aponta para um arquivo armazenado no Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('googleusercontent.com/d/');
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
    // Se for PDF do Drive, retorna o link de visualização embedável ou em aba
    if (trimmed.includes('.pdf') || trimmed.includes('/view') || trimmed.includes('/preview')) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    // Para imagens, lh3.googleusercontent.com/d/FILE_ID é o formato mais rápido e estável para <img>
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Envia uma imagem ou PDF para o Google Drive através do WebApp do Apps Script
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
        directUrl: resJson.directUrl,
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
      error:
        err.message ||
        'Falha ao enviar arquivo para o Google Drive. Verifique se autorizou o script no Google Apps Script.',
    };
  }
}

/**
 * Sincroniza todas as fotos locais pendentes com a pasta do Google Drive.
 * Substitui dados locais por links diretos do Google Drive e salva no IndexedDB.
 */
export async function sincronizarFotosComGoogleDrive(
  webappUrl: string,
  produtores: ProdutorRural[],
  onProgress?: (atual: number, total: number, produtorNome: string) => void
): Promise<{ produtoresAtualizados: ProdutorRural[]; fotosEnviadas: number; erros: string[] }> {
  if (!webappUrl || !webappUrl.startsWith('http')) {
    return { produtoresAtualizados: produtores, fotosEnviadas: 0, erros: ['URL da planilha não configurada'] };
  }

  const produtoresAtualizados = [...produtores];
  let fotosEnviadas = 0;
  const erros: string[] = [];

  // Identifica produtores que precisam ter foto enviada ao Google Drive
  const pendentes: { index: number; produtor: ProdutorRural; base64: string }[] = [];

  for (let i = 0; i < produtoresAtualizados.length; i++) {
    const p = produtoresAtualizados[i];
    let base64 = '';

    if (p.documentoFotoUrl && p.documentoFotoUrl.startsWith('data:')) {
      base64 = p.documentoFotoUrl;
    } else if (
      !p.documentoFotoUrl ||
      p.documentoFotoUrl === '[FOTO_ARMAZENADA_LOCAL]' ||
      p.documentoFotoUrl.startsWith('idb:')
    ) {
      const salva = await getDocumentFile(p.id);
      if (salva && salva.startsWith('data:')) {
        base64 = salva;
      }
    }

    if (base64) {
      pendentes.push({ index: i, produtor: p, base64 });
    }
  }

  // Faz upload de cada foto para o Google Drive
  for (let k = 0; k < pendentes.length; k++) {
    const item = pendentes[k];
    if (onProgress) {
      onProgress(k + 1, pendentes.length, item.produtor.nomeCompleto);
    }

    const isPdf = isPdfDocument(item.base64);
    const ext = isPdf ? 'pdf' : 'jpg';
    const safeNome = item.produtor.nomeCompleto.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `doc_${safeNome}_${item.produtor.id}.${ext}`;

    const res = await uploadDocumentToGoogleDrive(webappUrl, item.base64, fileName, item.produtor.nomeCompleto);

    if (res.success && res.directUrl) {
      // Atualiza o produtor com a URL real do Google Drive!
      const prodAtualizado = {
        ...produtoresAtualizados[item.index],
        documentoFotoUrl: res.directUrl,
      };
      produtoresAtualizados[item.index] = prodAtualizado;
      fotosEnviadas++;

      // Atualiza também no repositório de documentos
      await saveDocumentFile(item.produtor.id, res.directUrl);
    } else {
      erros.push(`${item.produtor.nomeCompleto}: ${res.error || 'Erro no envio'}`);
    }
  }

  return { produtoresAtualizados, fotosEnviadas, erros };
}
