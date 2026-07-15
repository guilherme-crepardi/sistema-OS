const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'mastertech';

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.log('WhatsApp não configurado. Mensagem:', { phone, message });
    return false;
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    return false;
  }
}

export function formatIptvReminderMessage(nome: string, dias: number): string {
  return `Olá ${nome}! 👋

Seu plano IPTV vence em ${dias} dia(s)!

Para não perder o acesso, realize o pagamento o quanto antes.

Em caso de dúvidas, entre em contato conosco.

Equipe MasterTech Eletrônica 🔧`;
}

export function formatOsReadyMessage(nome: string, numero: number): string {
  return `Olá ${nome}! 👋

Sua Ordem de Serviço nº ${numero} está PRONTA para retirada!

Aguardo você para buscar seu equipamento.

Equipe MasterTech Eletrônica 🔧`;
}
