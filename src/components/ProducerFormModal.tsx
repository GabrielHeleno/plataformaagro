import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  User,
  MapPin,
  Phone,
  FileText,
  Trees,
  Navigation,
  Image,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Cloud,
  Map as MapIcon,
} from 'lucide-react';
import { ProdutorRural } from '../types';
import { formatarCPF, formatarTelefone } from '../utils/storage';
import { compressDocumentImage, validateDocumentFile, getDocumentFile, saveDocumentFile, removeDocumentFile } from '../utils/documentStorage';
import { getStoredSheetsUrl } from '../utils/sheetsSync';
import {
  uploadDocumentToGoogleDrive,
  formatDriveDirectImageUrl,
  isPdfDocument,
  isGoogleDriveUrl,
  getDriveWebLink,
} from '../utils/driveStorage';
import { DocumentImage } from './DocumentImage';
import { LocationPickerMap } from './LocationPickerMap';

interface ProducerFormModalProps {
  produtorInicial?: ProdutorRural | null;
  onSave: (produtor: ProdutorRural) => void;
  onClose: () => void;
  proximoIdSugerido: string;
}

export const ProducerFormModal: React.FC<ProducerFormModalProps> = ({
  produtorInicial,
  onSave,
  onClose,
  proximoIdSugerido,
}) => {
  const isEditing = !!produtorInicial;

  const [id, setId] = useState<string>(produtorInicial?.id || proximoIdSugerido);
  const [nomeCompleto, setNomeCompleto] = useState<string>(produtorInicial?.nomeCompleto || '');
  const [filiacoes, setFiliacoes] = useState<string>(produtorInicial?.filiacoes || '');
  const [cpf, setCpf] = useState<string>(produtorInicial?.cpf || '');
  const [documentoFotoUrl, setDocumentoFotoUrl] = useState<string>(produtorInicial?.documentoFotoUrl || '');
  const [apelido, setApelido] = useState<string>(produtorInicial?.apelido || '');
  const [enderecoCorrespondencia, setEnderecoCorrespondencia] = useState<string>(
    produtorInicial?.enderecoCorrespondencia || ''
  );
  const [enderecoPropriedade, setEnderecoPropriedade] = useState<string>(
    produtorInicial?.enderecoPropriedade || ''
  );
  const [geolocalizacao, setGeolocalizacao] = useState<string>(produtorInicial?.geolocalizacao || '');
  const [mapaAberto, setMapaAberto] = useState<boolean>(false);
  const [telefone, setTelefone] = useState<string>(produtorInicial?.telefone || '');
  const [observacoes, setObservacoes] = useState<string>(produtorInicial?.observacoes || '');
  const [areaCultivada, setAreaCultivada] = useState<string>(
    produtorInicial?.areaCultivada ? String(produtorInicial.areaCultivada) : ''
  );

  const [erro, setErro] = useState<string>('');
  const [obtendoGPS, setObtendoGPS] = useState<boolean>(false);
  const [comprimindoFoto, setComprimindoFoto] = useState<boolean>(false);
  const [infoFoto, setInfoFoto] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reidratação automática de documento existente ao editar
  useEffect(() => {
    if (produtorInicial?.id) {
      const foto = produtorInicial.documentoFotoUrl;
      if (!foto || foto.startsWith('idb:') || foto === '[FOTO_ARMAZENADA_LOCAL]') {
        getDocumentFile(produtorInicial.id).then((saved) => {
          if (saved) {
            setDocumentoFotoUrl(saved);
          }
        });
      }
    }
  }, [produtorInicial]);

  // Manipulação de Upload de Imagem de Documento com validação anti-corrupção, compressão e envio ao Google Drive
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação estrita de arquivo, extensões maliciosas e tamanho para proteger memória e sistema
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setErro(validation.error || 'Arquivo inválido.');
      if (e.target) e.target.value = '';
      return;
    }

    try {
      setComprimindoFoto(true);
      setErro('');
      setInfoFoto(validation.isPdf ? 'Lendo e validando arquivo PDF...' : 'Otimizando imagem mantendo nitidez...');
      
      // 1. Sempre realiza a compressão em canvas primeiro (ou leitura otimizada de PDF)
      const { dataUrl, sizeKb, originalSizeKb, isPdf } = await compressDocumentImage(file);
      
      // 2. Verifica se o Google Apps Script (Sheets/Drive) está conectado
      const sheetsUrl = getStoredSheetsUrl();
      const ext = validation.fileExtension || (isPdf ? 'pdf' : 'jpg');
      const safeProducerName = nomeCompleto ? nomeCompleto.replace(/[^a-zA-Z0-9]/g, '_') : 'produtor';
      const fileName = `doc_${safeProducerName}_${Date.now()}.${ext}`;

      if (sheetsUrl && sheetsUrl.startsWith('http')) {
        setInfoFoto(
          isPdf
            ? `PDF pronto (${sizeKb} KB). Salvando no Google Drive...`
            : `Comprimido: ${sizeKb} KB (original ${originalSizeKb} KB). Salvando no Google Drive...`
        );
        const targetId = id.trim() || produtorInicial?.id || proximoIdSugerido;
        const driveResult = await uploadDocumentToGoogleDrive(
          sheetsUrl,
          dataUrl,
          fileName,
          nomeCompleto,
          targetId
        );
        
        if (driveResult.success && driveResult.directUrl) {
          setDocumentoFotoUrl(driveResult.directUrl);
          await saveDocumentFile(targetId, driveResult.directUrl);
          setInfoFoto(
            isPdf
              ? `PDF salvo na pasta AgroGestao_Documentos do Google Drive! Link registrado para a célula da planilha.`
              : `Foto salva no Google Drive com sucesso! O link direto do arquivo foi gravado na planilha.`
          );
        } else {
          // Fallback: se o script do Drive retornar erro ou não estiver atualizado, mantém no banco local
          setDocumentoFotoUrl(dataUrl);
          await saveDocumentFile(targetId, dataUrl);
          setInfoFoto(
            `Arquivo salvo no banco local (${sizeKb} KB). ${driveResult.error || 'Atenção: No Apps Script, execute autorizarAcessoAoGoogleDrive e crie uma Nova Versão da implantação.'}`
          );
        }
      } else {
        // Modo local (sem planilha conectada)
        const targetId = id.trim() || produtorInicial?.id || proximoIdSugerido;
        setDocumentoFotoUrl(dataUrl);
        await saveDocumentFile(targetId, dataUrl);
        setInfoFoto(
          isPdf
            ? `Documento PDF salvo localmente (${sizeKb} KB). Conecte a planilha para enviar à pasta do Google Drive.`
            : `Documento otimizado: ${sizeKb} KB. Salvo localmente.`
        );
      }
    } catch (err: any) {
      console.warn('Erro ao processar documento:', err);
      setErro(err.message || 'Não foi possível processar o documento. Verifique se o arquivo não está corrompido.');
      setInfoFoto('');
    } finally {
      setComprimindoFoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Obter localização GPS do navegador
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setErro('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setObtendoGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setGeolocalizacao(coords);
        setObtendoGPS(false);
      },
      (err) => {
        console.warn('Erro ao obter GPS:', err);
        setErro('Não foi possível obter a localização GPS. Insira as coordenadas ou link manualmente.');
        setObtendoGPS(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Copiar endereço de correspondência a partir do endereço da propriedade
  const handleCopiarEndereco = () => {
    if (enderecoPropriedade) {
      setEnderecoCorrespondencia(enderecoPropriedade);
    }
  };

  // Validação e Envio
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto.trim()) {
      setErro('Por favor, informe o Nome Completo do produtor.');
      return;
    }

    if (!cpf.trim()) {
      setErro('Por favor, informe o CPF do produtor.');
      return;
    }

    if (!enderecoPropriedade.trim()) {
      setErro('Por favor, informe o Endereço da Propriedade Rural.');
      return;
    }

    const produtorSalvar: ProdutorRural = {
      id: id.trim() || proximoIdSugerido,
      nomeCompleto: nomeCompleto.trim(),
      filiacoes: filiacoes.trim(),
      cpf: formatarCPF(cpf),
      documentoFotoUrl: documentoFotoUrl || '',
      apelido: apelido.trim(),
      enderecoCorrespondencia: enderecoCorrespondencia.trim() || enderecoPropriedade.trim(),
      enderecoPropriedade: enderecoPropriedade.trim(),
      geolocalizacao: geolocalizacao.trim(),
      telefone: formatarTelefone(telefone),
      observacoes: observacoes.trim(),
      areaCultivada: parseFloat(areaCultivada) || 0,
      dataCadastro: produtorInicial?.dataCadastro || new Date().toISOString().split('T')[0],
    };

    // Sincroniza persistência dedicada do documento no IndexedDB
    if (documentoFotoUrl) {
      saveDocumentFile(produtorSalvar.id, documentoFotoUrl);
    } else if (!documentoFotoUrl && isEditing && produtorInicial?.id) {
      removeDocumentFile(produtorInicial.id);
    }

    onSave(produtorSalvar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? 'Editar Cadastro de Produtor Rural' : 'Novo Cadastro de Produtor Rural'}
              </h2>
              <p className="text-xs text-emerald-200">
                Preencha todos os dados cadastrais, documentais e da propriedade.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro se houver */}
        {erro && (
          <div className="bg-red-50 text-red-700 px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Linha 1: ID, Nome Completo e Apelido */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="font-bold text-zinc-700 block mb-1">
                ID do Produtor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 font-mono font-bold text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="font-bold text-zinc-700 block mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Ex: José Carlos Ribeiro da Silva"
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-zinc-700 block mb-1">
                Apelido <span className="text-zinc-400 font-normal">(Como é conhecido)</span>
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: Zé do Milho"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-emerald-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 2: CPF, Telefone e Filiações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono font-medium text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1">
                Telefone para Contato <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono font-medium text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1">
                Filiações <span className="text-zinc-400 font-normal">(Pai / Mãe)</span>
              </label>
              <input
                type="text"
                value={filiacoes}
                onChange={(e) => setFiliacoes(e.target.value)}
                placeholder="Ex: Antônio Silva e Maria Silva"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 3: Imagem da Cópia de Documento de Identidade */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
            <label className="font-bold text-zinc-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Cópia do Documento de Identidade (RG / CNH)</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-normal">PDF, JPG, PNG ou WEBP (até 15MB)</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview */}
              <div className="w-32 h-24 rounded-lg border-2 border-dashed border-zinc-300 bg-white flex items-center justify-center overflow-hidden shrink-0 relative">
                {documentoFotoUrl ? (
                  <>
                    {isPdfDocument(documentoFotoUrl) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-700 p-2">
                        <FileText className="w-8 h-8 text-red-600 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Documento PDF</span>
                      </div>
                    ) : (
                      <DocumentImage
                        src={documentoFotoUrl}
                        alt="Preview do Documento"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setDocumentoFotoUrl('')}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow"
                      title="Remover anexo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-zinc-400">
                    <Image className="w-6 h-6 mx-auto mb-1 text-zinc-300" />
                    <span className="text-[10px]">Sem anexo</span>
                  </div>
                )}
              </div>

              {/* Controles de Upload */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={comprimindoFoto}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg font-bold text-zinc-700 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {comprimindoFoto ? (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>{comprimindoFoto ? 'Validando e otimizando...' : 'Carregar Foto ou PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Modelo rápido de RG em SVG para testes fáceis
                      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
                        <rect width="400" height="260" rx="8" fill="#e2e8f0" stroke="#0f766e" stroke-width="3"/>
                        <rect x="15" y="15" width="370" height="40" rx="4" fill="#0f766e"/>
                        <text x="200" y="38" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">REPÚBLICA FEDERATIVA DO BRASIL</text>
                        <text x="200" y="49" fill="#99f6e4" font-family="sans-serif" font-size="9" text-anchor="middle">REGISTRO DE IDENTIDADE RURAL</text>
                        <rect x="25" y="70" width="80" height="110" rx="4" fill="#cbd5e1"/>
                        <circle cx="65" cy="110" r="20" fill="#64748b"/>
                        <text x="125" y="90" fill="#64748b" font-family="sans-serif" font-size="8">NOME</text>
                        <text x="125" y="106" fill="#0f172a" font-family="sans-serif" font-size="11" font-weight="bold">${nomeCompleto || 'PRODUTOR RURAL'}</text>
                        <text x="125" y="130" fill="#64748b" font-family="sans-serif" font-size="8">CPF</text>
                        <text x="125" y="145" fill="#0f172a" font-family="monospace" font-size="11">${cpf || '000.000.000-00'}</text>
                      </svg>`;
                      setDocumentoFotoUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
                      setInfoFoto('Cópia digital modelo gerada com sucesso.');
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold transition-colors"
                  >
                    Gerar Cópia Digital Simulado
                  </button>
                </div>

                {infoFoto && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200 px-2.5 py-1.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{infoFoto}</span>
                  </div>
                )}

                {documentoFotoUrl && isGoogleDriveUrl(documentoFotoUrl) && (
                  <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold truncate">Link do Google Drive (gravado na célula da planilha):</span>
                    </div>
                    <a
                      href={getDriveWebLink(documentoFotoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline shrink-0"
                    >
                      <span>Abrir no Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <p className="text-[11px] text-zinc-500">
                  Os documentos são salvos na pasta <strong>AgroGestao_Documentos</strong> do seu Google Drive e o link direto oficial é preenchido automaticamente na coluna da planilha.
                </p>
              </div>
            </div>
          </div>

          {/* Linha 4: Endereço da Propriedade e Correspondência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">
                Endereço da Propriedade Rural <span className="text-red-500">*</span>
              </label>
              <textarea
                value={enderecoPropriedade}
                onChange={(e) => setEnderecoPropriedade(e.target.value)}
                placeholder="Ex: Fazenda Boa Esperança, Estrada Municipal km 18, Zona Rural, Patos de Minas - MG"
                rows={2}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">
                  Endereço de Correspondência
                </label>
                <button
                  type="button"
                  onClick={handleCopiarEndereco}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold"
                >
                  Copiar da propriedade
                </button>
              </div>
              <textarea
                value={enderecoCorrespondencia}
                onChange={(e) => setEnderecoCorrespondencia(e.target.value)}
                placeholder="Ex: Rua das Palmeiras, 142 - Centro, Patos de Minas - MG, 38700-100"
                rows={2}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Linha 5: Geolocalização e Área Cultivada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Geolocalização da Propriedade</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMapaAberto(true)}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                    title="Abrir mapa com imagem de satélite para marcar o pin da fazenda"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Marcar no Mapa (Pin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    disabled={obtendoGPS}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    title="Obter coordenadas GPS atuais do seu dispositivo"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{obtendoGPS ? 'Obtendo...' : 'GPS Atual'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={geolocalizacao}
                  onChange={(e) => setGeolocalizacao(e.target.value)}
                  placeholder="Ex: -20.903100, -43.363300 (Cipotânea) ou link do Maps"
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg font-mono text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMapaAberto(true)}
                  className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-1 shrink-0 transition-colors"
                  title="Abrir mapa interativo"
                >
                  <MapIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Ver no Mapa</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 px-0.5">
                <span>Adicione o pin no mapa, use o GPS ou digite as coordenadas manualmente.</span>
                {geolocalizacao && (
                  <span className="text-emerald-700 font-semibold font-mono">
                    ✓ Coordenadas definidas
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-700 flex items-center gap-1 mb-1">
                <Trees className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tamanho da Área Cultivada (ha)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={areaCultivada}
                  onChange={(e) => setAreaCultivada(e.target.value)}
                  placeholder="Ex: 350.5"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
                  hectares
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Área produtiva utilizada para lavoura ou pastagem.
              </span>
            </div>
          </div>

          {/* Linha 6: Campo de Observações */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1">
              Campo de Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o produtor, histórico de culturas, maquinários, referências de acesso..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Botões do Formulário */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Sobreposto do Mapa com Pin (Satélite / Ruas / Busca / GPS) */}
      {mapaAberto && (
        <div
          className="fixed inset-0 z-70 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setMapaAberto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-zinc-300 w-full max-w-4xl h-[96dvh] max-h-[96dvh] sm:h-[640px] sm:max-h-[88vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <LocationPickerMap
              initialCoordinates={geolocalizacao}
              onConfirm={(coords) => {
                setGeolocalizacao(coords);
                setMapaAberto(false);
              }}
              onCancel={() => setMapaAberto(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
