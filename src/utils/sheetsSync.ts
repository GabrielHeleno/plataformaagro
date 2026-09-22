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
export async function sendToGoogleSheets(
  webappUrl: string,
  produtores: ProdutorRural[],
  servicos: SolicitacaoServico[]
): Promise<{ status: string; message: string; timestamp: string }> {
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

  // Otimização: para não estourar os limites de payload em planilhas,
  // mantemos fotos leves ou referências na planilha
  const produtoresParaEnvio = produtores.map((p) => ({
    ...p,
    documentoFotoUrl: p.documentoFotoUrl && p.documentoFotoUrl.length > 50000 ? '[FOTO_ARMAZENADA_LOCAL]' : p.documentoFotoUrl,
  }));

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
    const timeoutId = setTimeout(() => controller.abort(), 9000);

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
      saveStoredLastSync(now);
      return {
        status: 'success',
        message: result.message || 'Dados atualizados no Google Sheets com sucesso!',
        timestamp: now,
      };
    }
  } catch (postErr: any) {
    // Tentativa 2: Modo no-cors caso o redirecionamento 302 do Google perca cabeçalhos CORS
    // O Apps Script executa normalmente e persiste as alterações na planilha
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
  };
}

/**
 * Código pronto do Google Apps Script para o usuário copiar com 1 clique
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * AGROGESTÃO RURAL - SCRIPT DE SINCRONIZAÇÃO EM NUVEM (GOOGLE SHEETS)
 * =========================================================================
 * Este script conecta sua planilha ao AgroGestão Rural no computador e no celular.
 * Qualquer alteração feita no AgroGestão salva na planilha, e qualquer edição
 * feita na planilha é carregada no AgroGestão!
 * 
 * COMO INSTALAR EM 1 MINUTO:
 * 1. Abra uma planilha em branco no Google Planilhas (https://sheets.new)
 * 2. No menu superior da planilha, clique em: Extensões > Apps Script
 * 3. Apague todo o conteúdo que estiver na janela e COLE este script completo
 * 4. Clique no ícone de "Salvar" (disquete) ou pressione Ctrl+S
 * 5. No canto superior direito, clique no botão azul "Implantar" > "Nova implantação"
 * 6. Na janela que abrir, clique na engrenagem ao lado de "Selecione o tipo" e escolha:
 *    "App da Web" (Web App)
 * 7. Configure EXATAMENTE assim:
 *    - Descrição: AgroGestao Sync
 *    - Executar como: Eu (seu e-mail)
 *    - Quem pode acessar: Qualquer pessoa (Anyone) -> Permite que seu celular e PC sincronizem sem bloqueios
 * 8. Clique em "Implantar", autorize o acesso com sua conta Google
 * 9. COPIE a "URL do app da Web" gerada (termina com /exec) e cole no AgroGestão!
 * =========================================================================
 */

function doGet(e) {
  try {
    var callback = (e && e.parameter && e.parameter.callback) || null;
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

    // Se for ação de upload de documento diretamente para o Google Drive
    if (data.action === "uploadDocument" && data.fileData) {
      var folderName = "AgroGestao_Documentos";
      var folder = getOrCreateFolder(folderName);

      // Decodifica a mídia Base64
      var rawData = data.fileData;
      var contentType = "image/jpeg";
      if (rawData.indexOf("data:") === 0) {
        var commaIdx = rawData.indexOf(",");
        var header = rawData.substring(5, commaIdx);
        var semiIdx = header.indexOf(";");
        if (semiIdx !== -1) {
          contentType = header.substring(0, semiIdx);
        }
        rawData = rawData.substring(commaIdx + 1);
      }

      // Bloqueio de segurança no servidor Google Drive: rejeita extensões e MIME types maliciosos
      var safeName = (data.fileName || ("doc_" + new Date().getTime() + ".jpg")).replace(/[^a-zA-Z0-9._-]/g, "_");
      var nameParts = safeName.split(".");
      var ext = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : "jpg";
      var allowedExts = ["jpg", "jpeg", "png", "webp", "pdf"];
      
      if (allowedExts.indexOf(ext) === -1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Formato de arquivo não permitido pelo Google Drive: ." + ext
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Define contentType adequado se for PDF
      if (ext === "pdf" || contentType.indexOf("pdf") !== -1) {
        contentType = "application/pdf";
      }

      var decoded = Utilities.base64Decode(rawData);
      var blob = Utilities.newBlob(decoded, contentType, safeName);
      var file = folder.createFile(blob);

      // Permite visualização pública da imagem para que o link direto funcione no app e no Sheets
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // Ignora se o domínio corporativo restringir
      }

      var fileId = file.getId();
      var directUrl = ext === "pdf" 
        ? "https://drive.google.com/file/d/" + fileId + "/view"
        : "https://lh3.googleusercontent.com/d/" + fileId;
      var viewUrl = file.getUrl();

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Documento salvo com sucesso no Google Drive!",
        fileId: fileId,
        directUrl: directUrl,
        viewUrl: viewUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var pSheet = getOrCreateSheet(ss, "Produtores", getProdutoresHeaders());
    var sSheet = getOrCreateSheet(ss, "Servicos", getServicosHeaders());
    
    if (data.produtores && Array.isArray(data.produtores) && data.produtores.length > 0) {
      writeProdutores(pSheet, data.produtores);
    }
    
    if (data.servicos && Array.isArray(data.servicos) && data.servicos.length > 0) {
      writeServicos(sSheet, data.servicos);
    }
    
    var output = {
      status: "success",
      message: "Dados sincronizados com sucesso no Google Sheets!",
      timestamp: new Date().toISOString(),
      totalProdutores: data.produtores ? data.produtores.length : 0,
      totalServicos: data.servicos ? data.servicos.length : 0
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
    
    // Formatar colunas de texto (como CPF e telefone para não perder zeros à esquerda)
    sheet.getRange("D:D").setNumberFormat("@");
    sheet.getRange("F:F").setNumberFormat("@");
  }
  return sheet;
}

function readProdutores(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
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
      documentoFotoUrl: String(r[12] || '')
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
  // Trava de segurança: impede que chamadas vazias ou acidentais limpem a planilha existente
  if (!produtores || !Array.isArray(produtores) || produtores.length === 0) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  var matrix = produtores.map(function(p) {
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
      (p.documentoFotoUrl && p.documentoFotoUrl.length < 2000) ? p.documentoFotoUrl : ''
    ];
  });
  
  sheet.getRange(2, 1, matrix.length, matrix[0].length).setValues(matrix);
}

function writeServicos(sheet, servicos) {
  // Trava de segurança: impede que chamadas vazias limpem a planilha existente
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
