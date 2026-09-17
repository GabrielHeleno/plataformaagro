import { ProdutorRural, SolicitacaoServico } from '../types';
import { verificarPendenciaProdutor, formatarDataBR, formatarCPF } from './storage';

/**
 * Escapa células para formato compatível com RFC 4180 e Excel
 */
function escaparCSV(valor: any): string {
  if (valor === undefined || valor === null) return '""';
  const str = String(valor).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

/**
 * Dispara o download de um arquivo CSV com UTF-8 BOM (\uFEFF)
 * para abertura direta e correta no Microsoft Excel, Google Planilhas e LibreOffice
 */
function downloadCSV(conteudo: string, nomeArquivo: string) {
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Dispara o download de um arquivo JSON formatado
 */
function downloadJSON(dados: any, nomeArquivo: string) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta o cadastro COMPLETO de produtores rurais para planilha .CSV
 * Inclui todos os campos cadastrados: CPF, Nome, Filiação, Contatos, Endereços, Área, etc.
 */
export function exportarProdutoresCSV(produtores: ProdutorRural[], servicos: SolicitacaoServico[]) {
  const cabecalho = [
    'ID Produtor',
    'Nome Completo',
    'Apelido',
    'CPF',
    'Filiação (Pai / Mãe)',
    'Telefone / WhatsApp',
    'Endereço da Propriedade Rural',
    'Endereço de Correspondência',
    'Geolocalização / Coordenadas GPS',
    'Área Cultivada (ha)',
    'Possui Foto do Documento',
    'Pendência Financeira',
    'Total de Serviços Solicitados',
    'Total Faturado Acumulado (R$)',
    'Observações do Produtor',
    'Data de Cadastro',
  ];

  const linhas = produtores.map((p) => {
    const servs = servicos.filter((s) => s.produtorId === p.id);
    const temPendencia = verificarPendenciaProdutor(p.id, servicos);
    const totalFaturado = servs.reduce((acc, s) => acc + (s.valor || 0), 0);
    const cpfFormatado = p.cpf ? formatarCPF(p.cpf) : '';
    const temFoto = p.documentoFotoUrl && p.documentoFotoUrl.trim() !== '' ? 'SIM' : 'NÃO';

    return [
      escaparCSV(p.id),
      escaparCSV(p.nomeCompleto),
      escaparCSV(p.apelido || ''),
      escaparCSV(cpfFormatado),
      escaparCSV(p.filiacoes || ''),
      escaparCSV(p.telefone),
      escaparCSV(p.enderecoPropriedade || ''),
      escaparCSV(p.enderecoCorrespondencia || ''),
      escaparCSV(p.geolocalizacao || ''),
      escaparCSV(p.areaCultivada !== undefined ? p.areaCultivada.toString().replace('.', ',') : ''),
      escaparCSV(temFoto),
      escaparCSV(temPendencia ? 'SIM' : 'NÃO'),
      escaparCSV(servs.length),
      escaparCSV(totalFaturado.toFixed(2).replace('.', ',')),
      escaparCSV(p.observacoes || ''),
      escaparCSV(formatarDataBR(p.dataCadastro)),
    ].join(';');
  });

  const conteudo = [cabecalho.map(escaparCSV).join(';'), ...linhas].join('\r\n');
  const dataHoje = new Date().toISOString().slice(0, 10);
  downloadCSV(conteudo, `cadastro_produtores_rurais_${dataHoje}.csv`);
}

/**
 * Exporta o cadastro COMPLETO de produtores rurais em formato .JSON
 */
export function exportarProdutoresJSON(produtores: ProdutorRural[]) {
  const dataHoje = new Date().toISOString().slice(0, 10);
  const payload = {
    tipo: 'Cadastro de Produtores Rurais',
    versao: '2.0',
    dataExportacao: new Date().toISOString(),
    totalRegistros: produtores.length,
    produtores,
  };
  downloadJSON(payload, `cadastro_produtores_rurais_${dataHoje}.json`);
}

/**
 * Exporta a lista COMPLETA de serviços agrícolas agendados/histórico para planilha .CSV
 * Inclui todos os campos do serviço e dados do produtor (Nome, CPF, Apelido, Contato)
 */
export function exportarServicosCSV(servicos: SolicitacaoServico[], produtores: ProdutorRural[]) {
  const produtoresMap = new Map<string, ProdutorRural>();
  produtores.forEach((p) => produtoresMap.set(p.id, p));

  const cabecalho = [
    'ID Serviço',
    'ID Produtor',
    'Nome do Produtor',
    'CPF do Produtor',
    'Apelido do Produtor',
    'Telefone do Produtor',
    'Endereço da Propriedade',
    'Tipo de Serviço Agrícola',
    'Data Prevista',
    'Hora Prevista',
    'Status Atual',
    'Valor do Serviço (R$)',
    'Tempo de Serviço Realizado',
    'Data de Conclusão',
    'Descrição Detalhada',
    'Observações do Serviço',
    'Data de Criação do Agendamento',
  ];

  const linhas = servicos.map((s) => {
    const prod = produtoresMap.get(s.produtorId);
    const cpfProdutor = prod?.cpf ? formatarCPF(prod.cpf) : '';

    return [
      escaparCSV(s.id),
      escaparCSV(s.produtorId),
      escaparCSV(prod?.nomeCompleto || 'Produtor não cadastrado'),
      escaparCSV(cpfProdutor),
      escaparCSV(prod?.apelido || ''),
      escaparCSV(prod?.telefone || ''),
      escaparCSV(prod?.enderecoPropriedade || ''),
      escaparCSV(s.tipoServico),
      escaparCSV(formatarDataBR(s.dataPrevista)),
      escaparCSV(s.horaPrevista || ''),
      escaparCSV(s.status),
      escaparCSV(s.valor !== undefined ? s.valor.toString().replace('.', ',') : '0,00'),
      escaparCSV(s.tempoServico || ''),
      escaparCSV(s.dataConclusao ? formatarDataBR(s.dataConclusao) : ''),
      escaparCSV(s.descricao || ''),
      escaparCSV(s.observacoes || ''),
      escaparCSV(s.dataCriacao ? formatarDataBR(s.dataCriacao) : ''),
    ].join(';');
  });

  const conteudo = [cabecalho.map(escaparCSV).join(';'), ...linhas].join('\r\n');
  const dataHoje = new Date().toISOString().slice(0, 10);
  downloadCSV(conteudo, `servicos_agricolas_${dataHoje}.csv`);
}

/**
 * Exporta a lista COMPLETA de serviços agrícolas agendados em formato .JSON
 */
export function exportarServicosJSON(servicos: SolicitacaoServico[], produtores: ProdutorRural[]) {
  const dataHoje = new Date().toISOString().slice(0, 10);
  const produtoresMap = new Map<string, ProdutorRural>();
  produtores.forEach((p) => produtoresMap.set(p.id, p));

  const servicosComProdutor = servicos.map((s) => {
    const prod = produtoresMap.get(s.produtorId);
    return {
      ...s,
      produtorNome: prod?.nomeCompleto || null,
      produtorCpf: prod?.cpf || null,
      produtorApelido: prod?.apelido || null,
    };
  });

  const payload = {
    tipo: 'Serviços Agrícolas Agendados e Realizados',
    versao: '2.0',
    dataExportacao: new Date().toISOString(),
    totalRegistros: servicos.length,
    servicos: servicosComProdutor,
  };
  downloadJSON(payload, `servicos_agricolas_${dataHoje}.json`);
}

/**
 * Exporta a base completa do sistema (Produtores + Serviços) em formato .JSON
 */
export function exportarBackupCompletoJSON(produtores: ProdutorRural[], servicos: SolicitacaoServico[]) {
  const dataHoje = new Date().toISOString().slice(0, 10);
  const payload = {
    sistema: 'AgroGestão Rural - Patrulha Agrícola',
    versao: '2.0',
    dataExportacao: new Date().toISOString(),
    totalProdutores: produtores.length,
    totalServicos: servicos.length,
    produtores,
    servicos,
  };
  downloadJSON(payload, `backup_completo_agrogestao_${dataHoje}.json`);
}
