import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    // Buscar clientes com vencimento em 3 dias que ainda não foram notificados
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: clientes, error } = await supabase
      .from("iptv_clientes")
      .select("*")
      .eq("status", "ativo")
      .eq("notificado", false)
      .lte("data_vencimento", threeDaysFromNow.toISOString().split("T")[0])
      .gte("data_vencimento", new Date().toISOString().split("T")[0]);

    if (error) throw error;

    if (!clientes || clientes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum cliente para notificar",
        sent: 0,
      });
    }

    // Enviar mensagens via Evolution API
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "mastertech";

    let sentCount = 0;

    for (const cliente of clientes) {
      const diasRestantes = Math.ceil(
        (new Date(cliente.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const mensagem = `Olá ${cliente.nome}! 👋

Seu plano IPTV vence em ${diasRestantes} dia(s)!

Para não perder o acesso, realize o pagamento o quanto antes.

Em caso de dúvidas, entre em contato conosco.

Equipe MasterTech Eletrônica 🔧`;

      // Tentar enviar via Evolution API
      if (evolutionApiUrl && evolutionApiKey) {
        try {
          await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
            },
            body: JSON.stringify({
              number: cliente.telefone,
              text: mensagem,
            }),
          });
          sentCount++;
        } catch (err) {
          console.error(`Erro ao enviar para ${cliente.telefone}:`, err);
        }
      } else {
        // Modo simulação (sem API configurada)
        console.log("Mensagem simulada:", { phone: cliente.telefone, message: mensagem });
        sentCount++;
      }

      // Marcar como notificado
      await supabase
        .from("iptv_clientes")
        .update({ notificado: true })
        .eq("id", cliente.id);
    }

    return NextResponse.json({
      success: true,
      message: `${sentCount} lembrete(s) enviado(s) com sucesso!`,
      sent: sentCount,
    });
  } catch (error) {
    console.error("Erro ao processar notificações:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar notificações" },
      { status: 500 }
    );
  }
}
