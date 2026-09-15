import { SolicitacaoServico, ProdutorRural } from '../types';

export type PermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): PermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PermissionStatus;
}

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as PermissionStatus;
  } catch (e) {
    console.error('Erro ao solicitar permissão de notificações:', e);
    return 'denied';
  }
}

export function triggerSystemPush(
  title: string,
  options: { body: string; icon?: string; tag?: string }
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options.body,
        icon: options.icon || 'https://api.iconify.design/lucide:tractor.svg',
        tag: options.tag || 'lembrete-diario-agro',
      });
      return true;
    } catch (err) {
      console.warn('Falha ao disparar Notification nativa:', err);
      return false;
    }
  }
  return false;
}

export function dispararLembreteDiario(
  servicos: SolicitacaoServico[],
  produtores: ProdutorRural[],
  dataReferencia: string // "YYYY-MM-DD"
): { enviados: number; totalHoje: number; mensagem: string } {
  const servicosHoje = servicos.filter(
    (s) => s.dataPrevista === dataReferencia && s.status !== 'cancelada'
  );

  if (servicosHoje.length === 0) {
    return {
      enviados: 0,
      totalHoje: 0,
      mensagem: 'Não há serviços agendados para a data selecionada.',
    };
  }

  const nomes = servicosHoje
    .slice(0, 3)
    .map((s) => {
      const p = produtores.find((prod) => prod.id === s.produtorId);
      return `${s.tipoServico} (${p?.apelido || p?.nomeCompleto || 'Produtor'})`;
    })
    .join(', ');

  const title = `🌾 Lembrete Diário: ${servicosHoje.length} serviço(s) hoje!`;
  const body = `${nomes}${servicosHoje.length > 3 ? ` e mais ${servicosHoje.length - 3} agendamento(s)` : ''}. Clique para abrir o calendário.`;

  const pushDisparado = triggerSystemPush(title, { body });

  return {
    enviados: pushDisparado ? 1 : 0,
    totalHoje: servicosHoje.length,
    mensagem: `Lembrete emitido para ${servicosHoje.length} serviço(s) agendado(s) para hoje!`,
  };
}
