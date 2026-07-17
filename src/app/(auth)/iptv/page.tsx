"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, IptvCliente } from "@/lib/supabase";
import { Plus, Tv, AlertTriangle, CheckCircle, XCircle, Send, Clock, DollarSign, Search } from "lucide-react";

type FiltroPagamento = "todos" | "pago" | "pendente";

export default function IPTVPage() {
  const [clientes, setClientes] = useState<IptvCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [filtroPagamento, setFiltroPagamento] = useState<FiltroPagamento>("todos");
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (clientes.length === 0) return;
    const meses = new Set<string>();
    clientes.forEach((c) => {
      const d = new Date(c.data_vencimento);
      meses.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    if (!meses.has(mesSelecionado)) {
      const sorted = Array.from(meses).sort().reverse();
      if (sorted.length > 0) setMesSelecionado(sorted[0]);
    }
  }, [clientes]);

  async function loadClientes() {
    try {
      const { data, error } = await supabase
        .from("iptv_clientes")
        .select("*")
        .order("data_vencimento");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes IPTV:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid(id: string) {
    try {
      const cliente = clientes.find((c) => c.id === id);
      if (!cliente) return;

      const proximoVencimento = new Date(cliente.data_vencimento);
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

      await supabase
        .from("iptv_clientes")
        .update({
          pagou: true,
          notificado: false,
          data_vencimento: proximoVencimento.toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      loadClientes();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  }

  async function handleMarkAsUnpaid(id: string) {
    try {
      await supabase
        .from("iptv_clientes")
        .update({ pagou: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      loadClientes();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  }

  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [anoFiltro, mesFiltro] = mesSelecionado.split("-").map(Number);

  const clientesMes = clientes.filter((c) => {
    const venc = new Date(c.data_vencimento);
    return venc.getFullYear() === anoFiltro && venc.getMonth() + 1 === mesFiltro;
  });

  const clientesFiltrados = clientesMes.filter((c) => {
    if (filtroPagamento === "pago" && !c.pagou) return false;
    if (filtroPagamento === "pendente" && c.pagou) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.nome.toLowerCase().includes(s) && !c.telefone.includes(s)) return false;
    }
    return true;
  });

  const stats = {
    total: clientes.length,
    ativos: clientes.filter((c) => c.status === "ativo").length,
    vencidos: clientes.filter((c) => c.status === "vencido").length,
    cancelados: clientes.filter((c) => c.status === "cancelado").length,
    vencendo: clientes.filter(
      (c) =>
        c.status === "ativo" &&
        new Date(c.data_vencimento) <= threeDaysFromNow &&
        new Date(c.data_vencimento) >= today
    ).length,
    pendentes: clientesMes.filter((c) => !c.pagou).length,
    pagos: clientesMes.filter((c) => c.pagou).length,
    totalReceber: clientesMes.filter((c) => !c.pagou).reduce((acc, c) => acc + c.valor, 0),
    totalPago: clientesMes.filter((c) => c.pagou).reduce((acc, c) => acc + c.valor, 0),
  };

  const vencendoList = clientes.filter(
    (c) =>
      c.status === "ativo" &&
      new Date(c.data_vencimento) <= threeDaysFromNow &&
      new Date(c.data_vencimento) >= today
  );

  const mesesDisponiveis = new Set<string>();
  clientes.forEach((c) => {
    const d = new Date(c.data_vencimento);
    mesesDisponiveis.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  });
  const mesesOrdenados = Array.from(mesesDisponiveis).sort().reverse();

  async function handleSendReminders() {
    if (!confirm(`Enviar lembrete para ${vencendoList.length} cliente(s) que estão com plano vencendo?`)) {
      return;
    }

    setSendingReminders(true);
    try {
      const response = await fetch("/api/iptv-notify", {
        method: "POST",
      });
      const data = await response.json();
      alert(data.message || "Lembretes enviados com sucesso!");
      loadClientes();
    } catch (error) {
      console.error("Erro ao enviar lembretes:", error);
      alert("Erro ao enviar lembretes");
    } finally {
      setSendingReminders(false);
    }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">IPTV</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seus clientes de IPTV</p>
        </div>
        <div className="flex gap-2">
          {vencendoList.length > 0 && (
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
              {sendingReminders ? "Enviando..." : `Enviar Lembretes (${vencendoList.length})`}
            </button>
          )}
          <Link
            href="/iptv/clientes/novo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus size={20} />
            Novo Cliente
          </Link>
        </div>
      </div>

      {/* Stats Gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title="Total" value={stats.total} icon={Tv} color="bg-[#2563eb]" />
        <StatCard title="Ativos" value={stats.ativos} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Pendentes" value={stats.pendentes} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Vencidos" value={stats.vencidos} icon={XCircle} color="bg-red-500" />
        <StatCard title="Cancelados" value={stats.cancelados} icon={XCircle} color="bg-gray-50 dark:bg-gray-700/500" />
        <StatCard title="Vencendo (3 dias)" value={stats.vencendo} icon={AlertTriangle} color="bg-orange-500" />
      </div>

      {/* Lista de clientes vencendo */}
      {vencendoList.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            Planos Vencendo em Breve
          </h3>
          <div className="space-y-2">
            {vencendoList.map((cliente) => {
              const diasRestantes = Math.ceil(
                (new Date(cliente.data_vencimento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={cliente.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.telefone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">Vence em {diasRestantes} dia(s)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(cliente.data_vencimento).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seção de Pagamento por Mês */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Seleção de Mês */}
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            >
              {mesesOrdenados.map((m) => {
                const [a, mes] = m.split("-");
                const nomeMes = new Date(Number(a), Number(mes) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                return <option key={m} value={m}>{nomeMes}</option>;
              })}
            </select>

            {/* Tabs Pagamento */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                { value: "todos" as FiltroPagamento, label: "Todos", color: "bg-[#2563eb]" },
                { value: "pago" as FiltroPagamento, label: "Pagos", color: "bg-green-600" },
                { value: "pendente" as FiltroPagamento, label: "Pendentes", color: "bg-yellow-500" },
              ]).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFiltroPagamento(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filtroPagamento === tab.value
                      ? `${tab.color} text-white`
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Resumo do Mês */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Pagos</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{stats.pagos}</p>
              <p className="text-xs text-green-500 dark:text-green-400">R$ {stats.totalPago.toFixed(2).replace(".", ",")}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pendentes</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{stats.pendentes}</p>
              <p className="text-xs text-yellow-500 dark:text-yellow-400">R$ {stats.totalReceber.toFixed(2).replace(".", ",")}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total no Mês</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{clientesMes.length}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">A Receber</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">R$ {stats.totalReceber.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Tv className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientesFiltrados.map((cliente) => {
                    const isVencido = new Date(cliente.data_vencimento) < new Date();
                    return (
                      <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {cliente.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{cliente.nome}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">{cliente.telefone}</td>
                        <td className="px-4 py-3">
                          <p className={`text-sm ${isVencido ? "text-red-600 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                            {new Date(cliente.data_vencimento).toLocaleDateString("pt-BR")}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">
                          R$ {cliente.valor.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-4 py-3">
                          {cliente.pagou ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} /> Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <Clock size={12} /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!cliente.pagou ? (
                              <button
                                onClick={() => handleMarkAsPaid(cliente.id)}
                                className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Confirmar Pagamento
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkAsUnpaid(cliente.id)}
                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Desfazer
                              </button>
                            )}
                            <Link
                              href={`/iptv/clientes/${cliente.id}`}
                              className="px-3 py-1 text-xs font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Editar
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Link para lista completa */}
      <Link
        href="/iptv/clientes"
        className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">Ver Todos os Clientes</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stats.total} clientes cadastrados</p>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500">→</span>
        </div>
      </Link>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
