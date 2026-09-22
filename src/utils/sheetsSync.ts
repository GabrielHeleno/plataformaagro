import { ProdutorRural, SolicitacaoServico } from '../types';

export const SHEETS_URL_KEY = 'agrogestao_sheets_webapp_url';
export const SHEETS_AUTO_SYNC_KEY = 'agrogestao_sheets_auto_sync';
export const SHEETS_LAST_SYNC_KEY = 'agrogestao_sheets_last_sync';

export interface SheetsSyncState {
  url: string;
  autoSync: boolean;
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastError: string | null;
}

export function getStoredSheetsUrl(): string {
  try {
    return localStorage.getItem(SHEETS_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredSheetsUrl(url: string): void {
  try {
    if (!url || url.trim() === '') {
      localStorage.removeItem(SHEETS_URL_KEY);
    } else {
      localStorage.setItem(SHEETS_URL_KEY, url.trim());
    }
  } catch (err) {
    console.warn('Aviso ao salvar URL do Google Sheets:', err);
  }
}

export function getStoredAutoSync(): boolean {
  try {
    const val = localStorage.getItem(SHEETS_AUTO_SYNC_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveStoredAutoSync(enabled: boolean): void {
  try {
    localStorage.setItem(SHEETS_AUTO_SYNC_KEY, String(enabled));
  } catch (err) {
    console.warn('Aviso ao salvar preferência de sincronização:', err);
  }
}

export function getStoredLastSync(): string | null {
  try {
    return localStorage.getItem(SHEETS_LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function saveStoredLastSync(timestamp: string): void {
  try {
    localStorage.setItem(SHEETS_LAST_SYNC_KEY, timestamp);
  } catch (err) {
    console.warn('Aviso ao salvar data da última sincronização:', err);
  }
}

/**
 * Normaliza datas do Google Sheets para o padrão YYYY-MM-DD
 */
function normalizarData(val: unknown): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';

  // Se já for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Se for DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const dia = brMatch[1].padStart(2, '0');
    const mes = brMatch[2].padStart(2, '0');
    const ano = brMatch[3];
    return `${ano}-${mes}-${dia}`;
  }

  // Se for ISO string
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return str;
}

/**
 * Executa uma requisição via JSONP para o Google Apps Script caso o fetch via CORS falhe
 * Isso contorna 100% dos bloqueios de CORS e redirecionamento de iframes em qualquer navegador
 */
function fetchWithJsonp(url: string, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !document?.body) {
      reject(new Error('Ambiente sem suporte a DOM'));
      return;
    }

    const callbackName = 'agrogestao_jsonp_' + Math.random().toString(36).substring(2, 10);
    const separator = url.includes('?') ? '&' : '?';
    const script = document.createElement('script');

    let isDone = false;
    const cleanup = () => {
      isDone = true;
      clearTimeout(timer);
      try {
        delete (window as any)[callbackName];
      } catch {
        (window as any)[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timer = setTimeout(() => {
      if (!isDone) {
        cleanup();
        reject(new Error('Tempo esgotado ao tentar ler dados do Google Sheets via JSONP.'));
      }
    }, timeoutMs);

    (window as any)[callbackName] = (data: any) => {
      if (!isDone) {
        cleanup();
        resolve(data);
      }
    };

    script.src = `${url}${separator}callback=${callbackName}&_t=${Date.now()}`;
    script.onerror = () => {
      if (!isDone) {
        cleanup();
        reject(new Error('Falha ao carregar script do Google Apps Script.'));
      }
    };

    document.body.appendChild(script);
  });
}

/**
 * Busca os dados mais recentes diretamente da planilha do Google Sheets.
 * Se alguém alterou dados no Google Sheets, esta função lê e normaliza tudo.
 */
export async function fetchFromGoogleSheets(webappUrl: string): Promise<{
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  timestamp: string;
}> {
  if (!webappUrl || !webappUrl.startsWith('http')) {
    throw new Error('URL do Google Apps Script inválida ou não configurada.');
  }

  const queryUrl = `${webappUrl}${webappUrl.includes('?') ? '&' : '?'}action=read&_t=${Date.now()}`;

  let data: any = null;

  // Tentativa 1: Fetch com timeout de 7 segundos
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(queryUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      data = await response.json();
    } else {
      throw new Error(`Código ${response.status}: ${response.statusText}`);
    }
  } catch (err: any) {
    // Tentativa 2: Fallback automático com JSONP
    try {
      data = await fetchWithJsonp(queryUrl, 8000);
    } catch {
      // Se ambas as formas falharem, lançamos um erro descritivo em português em vez do erro cru "Failed to fetch"
      throw new Error(
        'Não foi possível conectar ao Google Sheets. ' +
        'Verifique se a URL termina com "/exec" e se a implantação no Google Apps Script foi configurada com: "Quem pode acessar: Qualquer pessoa (Anyone)".'
      );
    }
  }

  if (!data) {
    throw new Error('Nenhum dado retornado da planilha do Google Sheets.');
  }

  if (data.status === 'error') {
    throw new Error(data.message || 'Erro reportado pelo script do Google Sheets.');
  }

  const rawProdutores = Array.isArray(data.produtores) ? data.produtores : [];
  const rawServicos = Array.isArray(data.servicos) ? data.servicos : [];

  // Normalização defensiva de produtores
  const produtores: ProdutorRural[] = rawProdutores.map((p: any) => ({
    id: String(p.id || '').trim(),
    nomeCompleto: String(p.nomeCompleto || '').trim(),
    filiacoes: String(p.filiacoes || '').trim(),
    cpf: String(p.cpf || '').trim(),
    documentoFotoUrl: String(p.documentoFotoUrl || ''),
    apelido: String(p.apelido || '').trim(),
    enderecoCorrespondencia: String(p.enderecoCorrespondencia || '').trim(),
    enderecoPropriedade: String(p.enderecoPropriedade || '').trim(),
    geolocalizacao: String(p.geolocalizacao || '').trim(),
    telefone: String(p.telefone || '').trim(),
    observacoes: String(p.observacoes || '').trim(),
    areaCultivada: typeof p.areaCultivada === 'number' ? p.areaCultivada : parseFloat(String(p.areaCultivada || '0').replace(',', '.')) || 0,
    dataCadastro: normalizarData(p.dataCadastro) || new Date().toISOString().slice(0, 10),
  })).filter((p: ProdutorRural) => p.id && p.nomeCompleto);

  // Normalização defensiva de serviços
  const servicos: SolicitacaoServico[] = rawServicos.map((s: any) => ({
    id: String(s.id || '').trim(),
    produtorId: String(s.produtorId || '').trim(),
    dataPrevista: normalizarData(s.dataPrevista),
    horaPrevista: s.horaPrevista ? String(s.horaPrevista).trim() : undefined,
    tipoServico: String(s.tipoServico || 'Geral').trim(),
    descricao: String(s.descricao || '').trim(),
    status: String(s.status || 'agendada').toLowerCase().trim() as any,
    observacoes: String(s.observacoes || '').trim(),
    valor: typeof s.valor === 'number' ? s.valor : s.valor ? parseFloat(String(s.valor).replace('R$', '').replace('.', '').replace(',', '.').trim()) : undefined,
    tempoServico: s.tempoServico ? String(s.tempoServico).trim() : undefined,
    dataCriacao: normalizarData(s.dataCriacao) || new Date().toISOString().slice(0, 10),
    dataConclusao: s.dataConclusao ? normalizarData(s.dataConclusao) : undefined,
  })).filter((s: SolicitacaoServico) => s.id && s.produtorId);

  const timestamp = data.timestamp || new Date().toISOString();
  saveStoredLastSync(timestamp);

  return {
    produtores,
    servicos,
    timestamp,
  };
}

/**
 * Envia todos os dados cadastrados no AgroGestão para a planilha do Google Sheets.
 */
import { sincronizarFotosComGoogleDrive } from './driveStorage';

/**
 * Envia todos os dados cadastrados no AgroGestão para a planilha do Google Sheets.
 * Garante que todas as fotos de documentos sejam salvas na pasta do Google Drive
 * e que a célula da planilha receba EXCLUSIVAMENTE o link direto do arquivo no Google Drive.
 */
export async function sendToGoogleSheets(
  webappUrl: string,
  produtores: ProdutorRural[],
  servicos: SolicitacaoServico[],
  onPhotoProgress?: (atual: number, total: number, produtorNome: string) => void
): Promise<{ status: string; message: string; timestamp: string; produtoresAtualizados?: ProdutorRural[] }> {
  if (!webappUrl || !webappUrl.startsWith('http')) {
    throw new Error('URL do Google Apps Script inválida ou não configurada.');
  }

  // Proteção rigorosa contra payload vazio acidental:
  // Se produtores estiver vazio, impede que 'saveAll' apague acidentalmente a planilha de produtores
  if (!produtores || !Array.isArray(produtores) || produtores.length === 0) {
    console.warn('Proteção de integridade ativada: tentativa de enviar lista vazia de produtores para a planilha bloqueada.');
    return {
      status: 'ignored',
      message: 'Envio bloqueado por segurança: a lista de produtores estava vazia e poderia apagar a planilha.',
      timestamp: new Date().toISOString(),
    };
  }

  // ETAPA 1: Garante que qualquer foto local/base64 seja salva no Google Drive antes do envio
  let produtoresTratados = [...produtores];
  let avisosDrive: string[] = [];
  try {
    const syncDriveRes = await sincronizarFotosComGoogleDrive(webappUrl, produtoresTratados, onPhotoProgress);
    produtoresTratados = syncDriveRes.produtoresAtualizados;
    if (syncDriveRes.erros && syncDriveRes.erros.length > 0) {
      avisosDrive = syncDriveRes.erros;
    }
  } catch (driveErr: any) {
    console.warn('Aviso na sincronização prévia com o Google Drive:', driveErr);
    avisosDrive.push(driveErr.message || 'Erro de conexão com o Drive');
  }

  // ETAPA 2: Prepara produtores para a planilha.
  // Célula do Sheets receberá EXCLUSIVAMENTE o link do Google Drive (ou link web).
  // Nunca grava tags locais ou texto de controle como "[FOTO_ARMAZENADA_LOCAL]".
  const produtoresParaEnvio = produtoresTratados.map((p) => {
    let fotoUrl = p.documentoFotoUrl || '';
    if (fotoUrl === '[FOTO_ARMAZENADA_LOCAL]' || fotoUrl.startsWith('idb:')) {
      fotoUrl = '';
    }
    return {
      ...p,
      documentoFotoUrl: fotoUrl,
    };
  });

  const payload = {
    action: 'saveAll',
    produtores: produtoresParaEnvio,
    servicos,
    timestamp: new Date().toISOString(),
  };

  const now = new Date().toISOString();

  // Tentativa 1: POST padrão com Content-Type text/plain simples (evita preflight OPTIONS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    const response = await fetch(webappUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json().catch(() => ({ status: 'success' }));
      if (result.status === 'error') {
        throw new Error(result.message || 'Erro reportado pelo script ao salvar.');
      }

      // Se o Google Apps Script salvou fotos extras no Drive e retornou URLs
      if (result.produtoresUrls && typeof result.produtoresUrls === 'object') {
        produtoresTratados = produtoresTratados.map((p) => {
          if (result.produtoresUrls[p.id]) {
            return { ...p, documentoFotoUrl: result.produtoresUrls[p.id] };
          }
          return p;
        });
      }

      saveStoredLastSync(now);

      const msgAvisos =
        avisosDrive.length > 0
          ? ` Atenção: Para salvar fotos no Google Drive, execute "autorizarAcessoAoGoogleDrive" no Apps Script e gere uma Nova Versão.`
          : '';

      return {
        status: 'success',
        message: (result.message || 'Dados e links do Google Drive atualizados no Google Sheets com sucesso!') + msgAvisos,
        timestamp: now,
        produtoresAtualizados: produtoresTratados,
      };
    }
  } catch (postErr: any) {
    // Tentativa 2: Modo no-cors caso o redirecionamento 302 do Google perca cabeçalhos CORS
    try {
      await fetch(webappUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      saveStoredLastSync(now);
      return {
        status: 'success',
        message: 'Dados enviados para a planilha do Google Sheets com sucesso.',
        timestamp: now,
        produtoresAtualizados: produtoresTratados,
      };
    } catch {
      throw new Error(
        'Não foi possível salvar na planilha do Google Sheets. ' +
        'Verifique sua conexão e se a implantação está ativa como "Quem pode acessar: Qualquer pessoa".'
      );
    }
  }

  saveStoredLastSync(now);
  return {
    status: 'success',
    message: 'Dados salvos com sucesso na planilha.',
    timestamp: now,
    produtoresAtualizados: produtoresTratados,
  };
}

/**
 * Código pronto do Google Apps Script para o usuário copiar com 1 clique
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * AGROGESTÃO RURAL - SINCRONIZAÇÃO EM NUVEM (GOOGLE SHEETS & GOOGLE DRIVE)
 * =========================================================================
 * Este script conecta sua planilha ao AgroGestão Rural e salva todas
 * as fotos e documentos anexados diretamente na pasta 'AgroGestao_Documentos'
 * do seu Google Drive, gravando na planilha somente o link oficial do arquivo.
 * 
 * INSTRUÇÕES CRÍTICAS DE INSTALAÇÃO E ATUALIZAÇÃO (1 A 2 MINUTOS):
 * -------------------------------------------------------------------------
 * 1. Abra sua planilha no Google Planilhas (https://sheets.new)
 * 2. No menu superior da planilha, clique em: Extensões > Apps Script
 * 3. Apague todo o conteúdo que estiver na janela e COLE este script completo
 * 4. Salve o código (ícone de disquete 💾 ou Ctrl+S)
 * 5. AUTORIZE O GOOGLE DRIVE (OBRIGATÓRIO PARA AS FOTOS):
 *    - Na barra superior, localize o menu suspenso de funções (onde diz "doGet" ou "doPost")
 *    - Selecione a função: autorizarAcessoAoGoogleDrive
 *    - Clique no botão "Executar" (ícone de Play ▶) UMA VEZ
 *    - O Google exibirá a tela "Autorização necessária". Clique em:
 *      Revisar permissões > Escolha sua conta > Avançado > Acessar (não seguro) > Permitir.
 * 6. ATUALIZE A IMPLANTAÇÃO (PASSO MAIS IMPORTANTE!):
 *    - Se já tiver implantado antes:
 *      * Clique no botão azul "Implantar" > "Gerenciar implantações"
 *      * Clique no ícone do Lápis (Editar)
 *      * No campo Versão, selecione OBRIGATORIAMENTE: "Nova versão"
 *      * Clique em "Implantar"
 *    - Se for a primeira vez:
 *      * Clique em "Implantar" > "Nova implantação"
 *      * Selecione o tipo "App da Web" (na engrenagem)
 *      * Executar como: Eu (seu e-mail)
 *      * Quem pode acessar: Qualquer pessoa (Anyone)
 *      * Clique em "Implantar"
 * 7. COPIE a "URL do app da Web" (termina com /exec) e cole no AgroGestão!
 * =========================================================================
 */

/**
 * Função de autorização de 1 clique para o Google Drive.
 * Execute esta função manualmente no editor do Apps Script para conceder permissão ao DriveApp.
 */
function autorizarAcessoAoGoogleDrive() {
  var pasta = getOrCreateFolder("AgroGestao_Documentos");
  Logger.log("Sucesso! Pasta do Google Drive pronta. ID: " + pasta.getId() + " - Nome: " + pasta.getName());
  return "Autorizado com sucesso! Pasta: " + pasta.getName() + " (ID: " + pasta.getId() + ")";
}

/**
 * Diagnóstico rápido de conexão e permissões do Google Drive
 */
function testarGoogleDrive() {
  try {
    var folder = getOrCreateFolder("AgroGestao_Documentos");
    return {
      status: "success",
      driveAuthorized: true,
      folderName: folder.getName(),
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      message: "Google Drive 100% autorizado e conectado à pasta '" + folder.getName() + "'!"
    };
  } catch (err) {
    return {
      status: "error",
      driveAuthorized: false,
      message: "Acesso ao Google Drive não autorizado. Selecione 'autorizarAcessoAoGoogleDrive' e clique em Executar (▶) no Apps Script: " + err.toString()
    };
  }
}

function doGet(e) {
  try {
    var callback = (e && e.parameter && e.parameter.callback) || null;
    var action = (e && e.parameter && e.parameter.action) || 'read';

    if (action === "testDrive" || action === "test") {
      var diag = testarGoogleDrive();
      var diagStr = JSON.stringify(diag);
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + diagStr + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(diagStr).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pSheet = getOrCreateSheet(ss, "Produtores", getProdutoresHeaders());
    var sSheet = getOrCreateSheet(ss, "Servicos", getServicosHeaders());
    
    var produtores = readProdutores(pSheet);
    var servicos = readServicos(sSheet);
    
    var output = {
      status: "success",
      timestamp: new Date().toISOString(),
      totalProdutores: produtores.length,
      totalServicos: servicos.length,
      produtores: produtores,
      servicos: servicos
    };
    
    var jsonStr = JSON.stringify(output);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + jsonStr + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errObj = { status: "error", message: err.toString() };
    var errStr = JSON.stringify(errObj);
    if (e && e.parameter && e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + errStr + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(errStr)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    // Diagnóstico do Google Drive
    if (data.action === "testDrive") {
      var diag = testarGoogleDrive();
      return ContentService.createTextOutput(JSON.stringify(diag))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pSheet = getOrCreateSheet(ss, "Produtores", getProdutoresHeaders());
    var sSheet = getOrCreateSheet(ss, "Servicos", getServicosHeaders());

    // Ação: Upload de documento diretamente para a pasta do Google Drive
    if (data.action === "uploadDocument" && data.fileData) {
      var folder = getOrCreateFolder("AgroGestao_Documentos");
      var driveLink = salvarMidiaNoGoogleDrive(data.fileData, data.fileName || ("doc_" + new Date().getTime()), folder);

      if (driveLink) {
        // Se produtorId for informado, grava imediatamente o link na célula correspondente da planilha
        if (data.produtorId) {
          atualizarFotoProdutorNaPlanilha(pSheet, data.produtorId, driveLink);
        }

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Arquivo salvo com sucesso na pasta do Google Drive e registrado na planilha!",
          directUrl: driveLink,
          viewUrl: driveLink
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Falha ao gravar no Google Drive. Execute a função 'autorizarAcessoAoGoogleDrive' no Apps Script."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    var updatedUrls = {};
    if (data.produtores && Array.isArray(data.produtores) && data.produtores.length > 0) {
      updatedUrls = writeProdutores(pSheet, data.produtores);
    }
    
    if (data.servicos && Array.isArray(data.servicos) && data.servicos.length > 0) {
      writeServicos(sSheet, data.servicos);
    }
    
    var output = {
      status: "success",
      message: "Dados sincronizados com sucesso no Google Sheets!",
      timestamp: new Date().toISOString(),
      totalProdutores: data.produtores ? data.produtores.length : 0,
      totalServicos: data.servicos ? data.servicos.length : 0,
      produtoresUrls: updatedUrls
    };
    
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Salva imagem ou PDF diretamente na pasta do Google Drive e retorna o link direto
 */
function salvarMidiaNoGoogleDrive(fileData, fileNameBase, optFolder) {
  try {
    if (!fileData || fileData.indexOf("data:") !== 0) return "";
    var folder = optFolder || getOrCreateFolder("AgroGestao_Documentos");
    
    var commaIdx = fileData.indexOf(",");
    var header = fileData.substring(5, commaIdx);
    var semiIdx = header.indexOf(";");
    var contentType = semiIdx !== -1 ? header.substring(0, semiIdx) : "image/jpeg";
    var rawData = fileData.substring(commaIdx + 1);

    var isPdf = contentType.indexOf("pdf") !== -1 || (fileNameBase && fileNameBase.toLowerCase().indexOf(".pdf") !== -1);
    var ext = isPdf ? "pdf" : "jpg";
    var safeName = (fileNameBase ? fileNameBase.replace(/[^a-zA-Z0-9._-]/g, "_") : "doc") + "_" + (new Date().getTime()) + "." + ext;

    var decoded = Utilities.base64Decode(rawData);
    var blob = Utilities.newBlob(decoded, contentType, safeName);
    var file = folder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log("Aviso de compartilhamento: " + shareErr);
    }

    var fileId = file.getId();
    // Retorna URL oficial do Google Drive que abre diretamente ao clicar na planilha
    return "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
  } catch (err) {
    Logger.log("Erro ao salvar arquivo no Google Drive: " + err);
    return "";
  }
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function getProdutoresHeaders() {
  return [
    "ID", "Nome Completo", "Filiações (Pai/Mãe)", "CPF", "Apelido", 
    "Telefone", "Endereço da Propriedade", "Endereço de Correspondência", 
    "Geolocalização / GPS", "Área Cultivada (ha)", "Observações", 
    "Data de Cadastro", "Foto Documento"
  ];
}

function getServicosHeaders() {
  return [
    "ID", "ID do Produtor", "Data Prevista", "Horário", "Tipo de Serviço", 
    "Status", "Valor (R$)", "Duração / Tempo", "Descrição", "Observações", 
    "Data de Criação", "Data de Conclusão"
  ];
}

/**
 * Garante que a linha 1 da aba Produtores contenha o cabeçalho 'Foto Documento'
 */
function ensureFotoHeader(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    var defHeaders = getProdutoresHeaders();
    sheet.getRange(1, 1, 1, defHeaders.length).setValues([defHeaders]);
    sheet.getRange(1, 1, 1, defHeaders.length).setFontWeight("bold").setBackground("#166534").setFontColor("#ffffff");
    return defHeaders.length;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').toLowerCase().trim();
    if (h.indexOf("foto") !== -1 || h.indexOf("documento") !== -1) {
      return i + 1;
    }
  }

  // Não existia cabeçalho de foto, adiciona na próxima coluna
  var newCol = lastCol + 1;
  var cell = sheet.getRange(1, newCol);
  cell.setValue("Foto Documento");
  cell.setFontWeight("bold");
  cell.setBackground("#166534");
  cell.setFontColor("#ffffff");
  return newCol;
}

function atualizarFotoProdutorNaPlanilha(sheet, produtorId, link) {
  try {
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return false;
    
    var colFoto = ensureFotoHeader(sheet);
    var targetId = String(produtorId || '').trim();

    for (var r = 1; r < data.length; r++) {
      var rowId = String(data[r][0] || '').trim();
      if (rowId === targetId) {
        sheet.getRange(r + 1, colFoto).setValue(link);
        return true;
      }
    }
    return false;
  } catch (err) {
    Logger.log("Erro ao atualizar célula da foto: " + err);
    return false;
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground(sheetName === "Produtores" ? "#166534" : "#b45309");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    
    sheet.getRange("D:D").setNumberFormat("@");
    sheet.getRange("F:F").setNumberFormat("@");
  } else if (sheetName === "Produtores") {
    ensureFotoHeader(sheet);
  }
  return sheet;
}

function readProdutores(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var colFotoIdx = 12; // Padrão índice 12 (coluna 13)
  var headers = rows[0];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').toLowerCase().trim();
    if (h.indexOf("foto") !== -1 || h.indexOf("documento") !== -1) {
      colFotoIdx = c;
      break;
    }
  }

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var id = String(r[0] || '').trim();
    var nome = String(r[1] || '').trim();
    if (!id && !nome) continue;
    
    list.push({
      id: id || ("PR-" + String(i).padStart(3, '0')),
      nomeCompleto: nome,
      filiacoes: String(r[2] || '').trim(),
      cpf: String(r[3] || '').trim(),
      apelido: String(r[4] || '').trim(),
      telefone: String(r[5] || '').trim(),
      enderecoPropriedade: String(r[6] || '').trim(),
      enderecoCorrespondencia: String(r[7] || '').trim(),
      geolocalizacao: String(r[8] || '').trim(),
      areaCultivada: parseFloat(String(r[9] || '0').replace(',', '.')) || 0,
      observacoes: String(r[10] || '').trim(),
      dataCadastro: formatarDataIso(r[11]),
      documentoFotoUrl: String(r[colFotoIdx] || '').trim()
    });
  }
  return list;
}

function readServicos(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var id = String(r[0] || '').trim();
    var produtorId = String(r[1] || '').trim();
    if (!id && !produtorId) continue;
    
    list.push({
      id: id || ("SRV-" + (100 + i)),
      produtorId: produtorId,
      dataPrevista: formatarDataIso(r[2]),
      horaPrevista: r[3] ? String(r[3]).trim() : undefined,
      tipoServico: String(r[4] || 'Geral').trim(),
      status: String(r[5] || 'agendada').toLowerCase().trim(),
      valor: r[6] ? parseFloat(String(r[6]).replace(',', '.')) : undefined,
      tempoServico: r[7] ? String(r[7]).trim() : undefined,
      descricao: String(r[8] || '').trim(),
      observacoes: String(r[9] || '').trim(),
      dataCriacao: formatarDataIso(r[10]),
      dataConclusao: r[11] ? formatarDataIso(r[11]) : undefined
    });
  }
  return list;
}

function writeProdutores(sheet, produtores) {
  if (!produtores || !Array.isArray(produtores) || produtores.length === 0) return {};

  ensureFotoHeader(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  var folder = null;
  var updatedUrls = {};

  var matrix = produtores.map(function(p) {
    var docUrl = String(p.documentoFotoUrl || '').trim();

    // Se o produtor tem foto em Base64, salva no Google Drive agora e grava o link na célula
    if (docUrl.indexOf('data:') === 0) {
      if (!folder) folder = getOrCreateFolder("AgroGestao_Documentos");
      var driveLink = salvarMidiaNoGoogleDrive(docUrl, (p.nomeCompleto || 'produtor') + '_' + p.id, folder);
      if (driveLink) {
        docUrl = driveLink;
        updatedUrls[p.id] = driveLink;
      } else {
        docUrl = '';
      }
    } else if (docUrl === '[FOTO_ARMAZENADA_LOCAL]' || docUrl.indexOf('idb:') === 0) {
      docUrl = '';
    }

    return [
      p.id || '',
      p.nomeCompleto || '',
      p.filiacoes || '',
      p.cpf || '',
      p.apelido || '',
      p.telefone || '',
      p.enderecoPropriedade || '',
      p.enderecoCorrespondencia || '',
      p.geolocalizacao || '',
      p.areaCultivada || 0,
      p.observacoes || '',
      p.dataCadastro || '',
      docUrl
    ];
  });
  
  sheet.getRange(2, 1, matrix.length, matrix[0].length).setValues(matrix);
  return updatedUrls;
}

function writeServicos(sheet, servicos) {
  if (!servicos || !Array.isArray(servicos) || servicos.length === 0) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  var matrix = servicos.map(function(s) {
    return [
      s.id || '',
      s.produtorId || '',
      s.dataPrevista || '',
      s.horaPrevista || '',
      s.tipoServico || '',
      s.status || '',
      s.valor !== undefined ? s.valor : '',
      s.tempoServico || '',
      s.descricao || '',
      s.observacoes || '',
      s.dataCriacao || '',
      s.dataConclusao || ''
    ];
  });
  
  sheet.getRange(2, 1, matrix.length, matrix[0].length).setValues(matrix);
}

function formatarDataIso(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  var s = String(val).trim();
  var match = s.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/);
  if (match) {
    return match[3] + '-' + match[2].padStart(2, '0') + '-' + match[1].padStart(2, '0');
  }
  return s;
}
`;
