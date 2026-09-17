import { ProdutorRural, SolicitacaoServico } from '../types';

// Amostra de imagem de documento de identidade em SVG Base64 elegante e limpa
const generateDocPlaceholder = (nome: string, rg: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
    <rect width="400" height="260" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <rect x="15" y="15" width="370" height="40" rx="4" fill="#0f766e"/>
    <text x="200" y="38" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">REPÚBLICA FEDERATIVA DO BRASIL</text>
    <text x="200" y="49" fill="#99f6e4" font-family="sans-serif" font-size="9" text-anchor="middle">REGISTRO GERAL DE IDENTIDADE</text>
    <rect x="25" y="70" width="80" height="110" rx="4" fill="#cbd5e1" stroke="#94a3b8"/>
    <circle cx="65" cy="110" r="22" fill="#64748b"/>
    <path d="M40 155 Q65 130 90 155 Z" fill="#64748b"/>
    <rect x="25" y="190" width="80" height="45" rx="3" fill="#94a3b8" opacity="0.3"/>
    <text x="65" y="215" fill="#475569" font-family="monospace" font-size="8" text-anchor="middle">POLEGAR</text>
    <text x="125" y="85" fill="#64748b" font-family="sans-serif" font-size="8">NOME COMPLETO</text>
    <text x="125" y="102" fill="#0f172a" font-family="sans-serif" font-size="12" font-weight="bold">${nome}</text>
    <text x="125" y="125" fill="#64748b" font-family="sans-serif" font-size="8">DOCUMENTO Nº / ÓRGÃO EXPEDIDOR</text>
    <text x="125" y="140" fill="#0f172a" font-family="sans-serif" font-size="11">${rg}</text>
    <text x="125" y="165" fill="#64748b" font-family="sans-serif" font-size="8">ASSINATURA DO TITULAR</text>
    <path d="M125 185 C145 175, 175 195, 220 180 S280 185, 330 178" stroke="#1e293b" stroke-width="2" fill="none"/>
    <rect x="125" y="200" width="245" height="25" fill="#f1f5f9" rx="3"/>
    <text x="247" y="217" fill="#64748b" font-family="monospace" font-size="9" text-anchor="middle">VÁLIDO EM TODO TERRITÓRIO NACIONAL</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const PRODUTORES_INICIAIS: ProdutorRural[] = [
  {
    id: 'PR-001',
    nomeCompleto: 'José Carlos Ribeiro da Silva',
    filiacoes: 'Antônio Ribeiro da Silva e Maria Aparecida Silva',
    cpf: '382.910.458-12',
    documentoFotoUrl: generateDocPlaceholder('JOSÉ CARLOS RIBEIRO DA SILVA', 'MG-14.892.301 SSP/MG'),
    apelido: 'Zé do Milho',
    enderecoCorrespondencia: 'Rua das Palmeiras, 142 - Centro, Patos de Minas - MG, 38700-100',
    enderecoPropriedade: 'Fazenda Boa Esperança, Estrada Municipal km 18, Zona Rural, Patos de Minas - MG',
    geolocalizacao: '-18.5789, -46.5180',
    telefone: '(34) 99823-4112',
    observacoes: 'Produtor experiente em milho safrinha e rotação com soja. Possui maquinário próprio para pulverização.',
    areaCultivada: 350.5,
    dataCadastro: '2025-02-10',
  },
  {
    id: 'PR-002',
    nomeCompleto: 'Francisco de Assis Rezende',
    filiacoes: 'Benedito Rezende e Helena dos Santos Rezende',
    cpf: '519.284.731-90',
    documentoFotoUrl: generateDocPlaceholder('FRANCISCO DE ASSIS REZENDE', 'GO-19.452.110 SSP/GO'),
    apelido: 'Chico da Esperança',
    enderecoCorrespondencia: 'Av. Brasil Central, 850 - Setor Sul, Rio Verde - GO, 75901-200',
    enderecoPropriedade: 'Estância Bela Vista, Rodovia GO-174, Gleba 4, Rio Verde - GO',
    geolocalizacao: '-17.7924, -50.9192',
    telefone: '(64) 99245-8819',
    observacoes: 'Fazenda de grãos e silagem. Tem pendência de quitação da colheita anterior.',
    areaCultivada: 820.0,
    dataCadastro: '2025-04-18',
  },
  {
    id: 'PR-003',
    nomeCompleto: 'Ana Paula Guimarães Barbosa',
    filiacoes: 'Paulo Roberto Barbosa e Laura Guimarães Barbosa',
    cpf: '723.114.908-45',
    documentoFotoUrl: generateDocPlaceholder('ANA PAULA GUIMARÃES BARBOSA', 'SP-32.901.884 SSP/SP'),
    apelido: 'Dona Paula do Café',
    enderecoCorrespondencia: 'Rua Floriano Peixoto, 405 - Franca - SP, 14400-080',
    enderecoPropriedade: 'Sítio Recanto Verde, Estrada dos Cafezais km 5, Claraval - MG',
    geolocalizacao: '-20.5372, -47.4011',
    telefone: '(16) 99761-3320',
    observacoes: 'Café arábica especial e hortifruti orgânico irrigado por gotejamento.',
    areaCultivada: 140.0,
    dataCadastro: '2025-06-01',
  },
  {
    id: 'PR-004',
    nomeCompleto: 'Manoel Sebastião de Oliveira',
    filiacoes: 'Sebastião Manoel de Oliveira e Rita de Cássia Oliveira',
    cpf: '204.891.332-67',
    documentoFotoUrl: generateDocPlaceholder('MANOEL SEBASTIÃO DE OLIVEIRA', 'MT-08.129.540 SSP/MT'),
    apelido: 'Manoel do Trator',
    enderecoCorrespondencia: 'Rua dos Ipês, 12 - Sorriso - MT, 78890-000',
    enderecoPropriedade: 'Fazenda Santa Tereza, BR-163 km 740, Sorriso - MT',
    geolocalizacao: '-12.5451, -55.7214',
    telefone: '(66) 99612-4455',
    observacoes: 'Grande produtor de soja e algodão. Sempre solicita aplicação aérea e manutenção preventiva de pivôs.',
    areaCultivada: 1650.0,
    dataCadastro: '2025-07-22',
  },
  {
    id: 'PR-005',
    nomeCompleto: 'Cláudio Ferreira Mendes',
    filiacoes: 'Waldomiro Mendes e Neide Ferreira Mendes',
    cpf: '912.445.670-33',
    documentoFotoUrl: generateDocPlaceholder('CLÁUDIO FERREIRA MENDES', 'PR-21.782.903 SSP/PR'),
    apelido: 'Mendes da Fazenda',
    enderecoCorrespondencia: 'Av. Paraná, 1020 - Londrina - PR, 86020-000',
    enderecoPropriedade: 'Fazenda Três Morrinhos, Estrada da Prata s/n, Cambé - PR',
    geolocalizacao: '-23.2798, -51.2783',
    telefone: '(43) 99188-7766',
    observacoes: 'Pecuária de corte com pastagem rotacionada e plantio de sorgo.',
    areaCultivada: 480.0,
    dataCadastro: '2025-09-05',
  },
];

function dataRelativa(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Serviços programados com datas relativas à data de hoje real
export const SERVICOS_INICIAIS: SolicitacaoServico[] = [
  {
    id: 'SRV-101',
    produtorId: 'PR-001', // Zé do Milho
    dataPrevista: dataRelativa(0), // Hoje!
    horaPrevista: '08:30',
    tipoServico: 'Arado',
    descricao: 'Arado profundo com trator agrícola para revolvimento e aeração de solo no talhão 3.',
    status: 'agendada',
    observacoes: 'Condições de umidade do solo ideais para a operação.',
    valor: 4800,
    dataCriacao: dataRelativa(-6),
  },
  {
    id: 'SRV-102',
    produtorId: 'PR-002', // Chico da Esperança (com pendência!)
    dataPrevista: dataRelativa(0), // Hoje!
    horaPrevista: '14:00',
    tipoServico: 'Grade Aradora',
    descricao: 'Operação com grade aradora pesada para incorporação de restos culturais.',
    status: 'sem pagamento confirmado',
    observacoes: 'Serviço executado preliminarmente mas fatura anterior em atraso.',
    valor: 6500,
    dataCriacao: dataRelativa(-12),
  },
  {
    id: 'SRV-103',
    produtorId: 'PR-003', // Dona Paula do Café
    dataPrevista: dataRelativa(1), // Amanhã
    horaPrevista: '09:00',
    tipoServico: 'Sulcador',
    descricao: 'Abertura de sulcos alinhados e dosagem uniforme para novas mudas.',
    status: 'agendada',
    observacoes: 'Espaçamento de 3,5 metros entre linhas.',
    valor: 2200,
    dataCriacao: dataRelativa(-4),
  },
  {
    id: 'SRV-104',
    produtorId: 'PR-004', // Manoel do Trator
    dataPrevista: dataRelativa(2),
    horaPrevista: '07:00',
    tipoServico: 'Grade Leve',
    descricao: 'Passagem de grade niveladora leve para destorroamento e acabamento da cama de plantio.',
    status: 'agendada',
    observacoes: 'Área com 60 hectares pronta para o início do plantio.',
    valor: 18500,
    dataCriacao: dataRelativa(-5),
  },
  {
    id: 'SRV-105',
    produtorId: 'PR-002', // Chico da Esperança
    dataPrevista: dataRelativa(-9),
    horaPrevista: '10:00',
    tipoServico: 'Ensiladeira',
    descricao: 'Corte mecanizado e trituração de milho e capiaçu para ensilagem.',
    status: 'cobrança realizada',
    observacoes: 'Boleto bancário emitido com vencimento recente. Pagamento ainda não compensado.',
    valor: 12400,
    dataCriacao: dataRelativa(-20),
    dataConclusao: dataRelativa(-9),
  },
  {
    id: 'SRV-106',
    produtorId: 'PR-001', // Zé do Milho
    dataPrevista: dataRelativa(-13),
    horaPrevista: '11:00',
    tipoServico: 'Roçadeira',
    descricao: 'Roçagem mecânica de aceiros perimetrais e controle de vegetação invasora.',
    status: 'pago',
    observacoes: 'Pagamento via PIX confirmado no mesmo dia.',
    valor: 3900.5,
    tempoServico: '4 horas',
    dataCriacao: dataRelativa(-25),
    dataConclusao: dataRelativa(-13),
  },
  {
    id: 'SRV-107',
    produtorId: 'PR-005', // Mendes da Fazenda
    dataPrevista: dataRelativa(4),
    horaPrevista: '13:30',
    tipoServico: 'Carroça (Silagem)',
    descricao: 'Transporte de silagem verde da lavoura até o silo trincheira de confinamento.',
    status: 'agendada',
    observacoes: 'Carreta acoplada de alta capacidade.',
    valor: 2850.75,
    dataCriacao: dataRelativa(-3),
  },
  {
    id: 'SRV-108',
    produtorId: 'PR-005', // Mendes da Fazenda
    dataPrevista: dataRelativa(-6),
    horaPrevista: '15:00',
    tipoServico: 'Trator (corrente para arrasto)',
    descricao: 'Operação de arrasto de troncos e limpeza pesada de terreno com trator e corrente.',
    status: 'realizada',
    observacoes: 'Serviço concluído com sucesso. Aguardando emissão da fatura fiscal.',
    valor: 4500,
    tempoServico: '5h 30min',
    dataCriacao: dataRelativa(-15),
    dataConclusao: dataRelativa(-6),
  },
  {
    id: 'SRV-109',
    produtorId: 'PR-003', // Dona Paula do Café
    dataPrevista: dataRelativa(-17),
    horaPrevista: '08:00',
    tipoServico: 'Carroça (lenha)',
    descricao: 'Transporte de toretes de lenha de eucalipto para alimentação da caldeira.',
    status: 'pago',
    observacoes: 'Quitação efetuada por transferência bancária.',
    valor: 5200,
    tempoServico: '6 horas',
    dataCriacao: dataRelativa(-30),
    dataConclusao: dataRelativa(-17),
  },
  {
    id: 'SRV-110',
    produtorId: 'PR-004', // Manoel do Trator
    dataPrevista: dataRelativa(-2),
    horaPrevista: '16:00',
    tipoServico: 'Batedor de Cereais (Milho)',
    descricao: 'Trilha e debulha de espigas de milho com batedor acoplado ao trator.',
    status: 'realizada',
    observacoes: 'Operação concluída com pureza de grãos certificada.',
    valor: 3125.8,
    tempoServico: '3h 45min',
    dataCriacao: dataRelativa(-9),
    dataConclusao: dataRelativa(-2),
  },
  {
    id: 'SRV-111',
    produtorId: 'PR-001', // Zé do Milho
    dataPrevista: dataRelativa(7),
    horaPrevista: '10:00',
    tipoServico: 'Batedor de Cereais (Feijão)',
    descricao: 'Bateção, limpeza e separação de palha para lote de feijão colhido.',
    status: 'agendada',
    observacoes: 'Ensacamento no local.',
    valor: 1500,
    dataCriacao: dataRelativa(-1),
  },
];
