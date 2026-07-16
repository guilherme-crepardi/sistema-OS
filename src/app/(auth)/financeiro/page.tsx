"use client";

import { useEffect, useState } from "react";
import { supabase, OrdemServico, IptvCliente, Cliente, ServicoExterno } from "@/lib/supabase";
import { DollarSign, TrendingUp, Clock, CheckCircle, Calendar, Filter } from "lucide-react";

type Periodo = "diario" | "semanal" | "mensal" | "anual";
type Origem = "todos" | "os" | "iptv" | "externos";
type StatusPagamento = "todos" | "pago" | "nao_pago";

interface Transacao {
  id: string;
  origem: "OS" | "IPTV" | "EXT";
  descricao: string;
  cliente: string;
  valor: number;
  pago: boolean;
  data: string;
}

export default function FinanceiroPage() {
  const [ordens, setOrdens] = useState<(OrdemServico & { cliente?: Cliente })[]>([]);
  const [iptvClientes, setIptvClientes] = useState<IptvCliente[]>([]);
  const [servicosExternos, setServicosExternos] = useState<ServicoExterno[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const [origem, setOrigem] = useState<Origem>("todos");
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>("todos");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [osData, iptvData, servicosData] = await Promise.all([
        supabase.from("ordens_servico").select("*, cliente:clientes(*)").order("created_at", { ascending: false }),
        supabase.from("iptv_clientes").select("*").order("created_at", { ascending: false }),
        supabase.from("servicos_externos").select("*").order("created_at", { ascending: false }),
      ]);
      setOrdens(osData.data || []);
      setIptvClientes(iptvData.data || []);
      setServicosExternos(servicosData.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function getTransacoes(): Transacao[] {
    const now = new Date();
    const transacoes: Transacao[] = [];

    // Filtrar OS por período
    const osFiltradas = ordens.filter((os) => {
      const data = new Date(os.created_at);
      return isInPeriodo(data, now, periodo);
    });

    // Filtrar IPTV por período
    const iptvFiltrados = iptvClientes.filter((c) => {
      const data = new Date(c.created_at);
      return isInPeriodo(data, now, periodo);
    });

    // Adicionar OS
    if (origem === "todos" || origem === "os") {
      osFiltradas.forEach((os) => {
        transacoes.push({
          id: os.id,
          origem: "OS",
          descricao: `OS #${os.numero} - ${os.descricao || "Sem descrição"}`,
          cliente: os.cliente?.nome || "Sem cliente",
          valor: os.valor || 0,
          pago: os.pago || false,
          data: os.created_at,
        });
      });
    }

    // Adicionar IPTV
    if (origem === "todos" || origem === "iptv") {
      iptvFiltrados.forEach((c) => {
        transacoes.push({
          id: c.id,
          origem: "IPTV",
          descricao: `IPTV - ${c.nome}`,
          cliente: c.nome,
          valor: c.valor || 0,
          pago: c.pagou || false,
          data: c.created_at,
        });
      });
    }

    // Filtrar Serviços Externos por período
    const servicosFiltrados = servicosExternos.filter((s) => {
      const data = new Date(s.created_at);
      return isInPeriodo(data, now, periodo);
    });

    // Adicionar Serviços Externos
    if (origem === "todos" || origem === "externos") {
      servicosFiltrados.forEach((s) => {
        const tipoLabel = s.tipo === "recorrente" ? `Recorrente (${s.recorrencia})` : "Externo";
        transacoes.push({
          id: s.id,
          origem: "EXT",
          descricao: `${tipoLabel} - ${s.servico}`,
          cliente: s.cliente_nome,
          valor: s.valor || 0,
          pago: s.pago || false,
          data: s.created_at,
        });
      });
    }

    // Filtrar por pagamento
    if (statusPagamento === "pago") {
      return transacoes.filter((t) => t.pago);
    } else if (statusPagamento === "nao_pago") {
      return transacoes.filter((t) => !t.pago);
    }

    return transacoes;
  }

  function isInPeriodo(data: Date, now: Date, p: Periodo): boolean {
    const inicio = new Date(now);
    
    switch (p) {
      case "diario":
        inicio.setHours(0, 0, 0, 0);
        break;
      case "semanal":
        inicio.setDate(now.getDate() - now.getDay());
        inicio.setHours(0, 0, 0, 0);
        break;
      case "mensal":
        inicio.setDate(1);
        inicio.setHours(0, 0, 0, 0);
        break;
      case "anual":
        inicio.setMonth(0, 1);
        inicio.setHours(0, 0, 0, 0);
        break;
    }

    return data >= inicio;
  }

  const transacoes = getTransacoes();
  const totalGeral = transacoes.reduce((acc, t) => acc + t.valor, 0);
  const totalPago = transacoes.filter((t) => t.pago).reduce((acc, t) => acc + t.valor, 0);
  const totalNaoPago = transacoes.filter((t) => !t.pago).reduce((acc, t) => acc + t.valor, 0);
  const totalOS = transacoes.filter((t) => t.origem === "OS").reduce((acc, t) => acc + t.valor, 0);
  const totalIPTV = transacoes.filter((t) => t.origem === "IPTV").reduce((acc, t) => acc + t.valor, 0);
  const totalExt = transacoes.filter((t) => t.origem === "EXT").reduce((acc, t) => acc + t.valor, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
        <p className="text-gray-500">Acompanhe seus ganhos e pagamentos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Período */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["diario", "semanal", "mensal", "anual"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  periodo === p
                    ? "bg-[#2563eb] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "diario" ? "Diário" : p === "semanal" ? "Semanal" : p === "mensal" ? "Mensal" : "Anual"}
              </button>
            ))}
          </div>

          {/* Origem */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              { value: "todos", label: "Todos" },
              { value: "os", label: "OS" },
              { value: "iptv", label: "IPTV" },
              { value: "externos", label: "Externos" },
            ] as { value: Origem; label: string }[]).map((o) => (
              <button
                key={o.value}
                onClick={() => setOrigem(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  origem === o.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Status Pagamento */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              { value: "todos", label: "Todos" },
              { value: "pago", label: "Pagos" },
              { value: "nao_pago", label: "Não Pagos" },
            ] as { value: StatusPagamento; label: string }[]).map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusPagamento(s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusPagamento === s.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2563eb] rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Geral</p>
              <p className="text-lg font-bold text-gray-800">R$ {totalGeral.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Recebido</p>
              <p className="text-lg font-bold text-green-600">R$ {totalPago.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">A Receber</p>
              <p className="text-lg font-bold text-red-600">R$ {totalNaoPago.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">OS</p>
              <p className="text-lg font-bold text-blue-600">R$ {totalOS.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">IPTV</p>
              <p className="text-lg font-bold text-purple-600">R$ {totalIPTV.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Externos</p>
              <p className="text-lg font-bold text-orange-600">R$ {totalExt.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Transações ({transacoes.length})
          </h3>
        </div>
        {transacoes.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Cliente
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transacoes.map((t) => (
                <tr key={`${t.origem}-${t.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.origem === "OS" ? "bg-blue-100 text-blue-700" : t.origem === "IPTV" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {t.origem === "EXT" ? "EXT" : t.origem}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <p className="font-medium text-gray-800 text-sm">{t.descricao}</p>
                    <p className="text-xs text-gray-500 sm:hidden">{t.cliente}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                    {t.cliente}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`font-bold text-sm ${t.pago ? "text-green-600" : "text-red-600"}`}>
                      R$ {t.valor.toFixed(2).replace(".", ",")}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    {t.pago ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={12} />
                        Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <Clock size={12} />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(t.data).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
