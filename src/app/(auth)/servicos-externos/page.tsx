"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, ServicoExterno } from "@/lib/supabase";
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, MapPin, Repeat, DollarSign, Calendar } from "lucide-react";

type Filtro = "todos" | "externo" | "recorrente" | "pago" | "nao_pago";
type Periodo = "diario" | "semanal" | "mensal" | "anual";

const RECURRENCIA_LABELS: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export default function ServicosExternosPage() {
  const [servicos, setServicos] = useState<ServicoExterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    loadServicos();
  }, [filtro]);

  async function loadServicos() {
    try {
      let query = supabase
        .from("servicos_externos")
        .select("*")
        .order("data_servico", { ascending: false });

      if (filtro === "externo") {
        query = query.eq("tipo", "externo");
      } else if (filtro === "recorrente") {
        query = query.eq("tipo", "recorrente");
      } else if (filtro === "pago") {
        query = query.eq("pago", true);
      } else if (filtro === "nao_pago") {
        query = query.eq("pago", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, servico: string) {
    if (!confirm(`Excluir o serviço "${servico}"?`)) return;

    try {
      const { error } = await supabase.from("servicos_externos").delete().eq("id", id);
      if (error) throw error;
      loadServicos();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      alert("Erro ao excluir serviço");
    }
  }

  const filtrados = servicos.filter((s) => {
    const data = new Date(s.data_servico || s.created_at);
    const now = new Date();

    if (dataInicio || dataFim) {
      if (dataInicio) {
        const inicio = new Date(dataInicio + "T00:00:00");
        if (data < inicio) return false;
      }
      if (dataFim) {
        const fim = new Date(dataFim + "T23:59:59");
        if (data > fim) return false;
      }
    } else {
      const inicio = new Date(now);
      switch (periodo) {
        case "diario":
          inicio.setHours(0, 0, 0, 0);
          break;
        case "semanal":
          inicio.setDate(now.getDate() - 7);
          break;
        case "mensal":
          inicio.setMonth(now.getMonth() - 1);
          break;
        case "anual":
          inicio.setFullYear(now.getFullYear() - 1);
          break;
      }
      if (data < inicio) return false;
    }

    if (!search) return true;
    return s.cliente_nome.toLowerCase().includes(search.toLowerCase());
  });

  const statsFiltrados = filtrados;
  const total = statsFiltrados.length;
  const totalExternos = statsFiltrados.filter((s) => s.tipo === "externo").length;
  const totalRecorrentes = statsFiltrados.filter((s) => s.tipo === "recorrente").length;
  const totalPago = statsFiltrados.filter((s) => s.pago).reduce((acc, s) => acc + s.valor, 0);
  const totalNaoPago = statsFiltrados.filter((s) => !s.pago).reduce((acc, s) => acc + s.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Serviços Externos</h1>
          <p className="text-gray-500">Gerencie seus serviços realizados fora da loja</p>
        </div>
        <Link
          href="/servicos-externos/novo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={20} />
          Novo Serviço
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2563eb] rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total de Serviços</p>
              <p className="text-lg font-bold text-gray-800">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Externos</p>
              <p className="text-lg font-bold text-blue-600">{totalExternos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500 rounded-lg">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Recorrentes</p>
              <p className="text-lg font-bold text-purple-600">{totalRecorrentes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pago</p>
              <p className="text-lg font-bold text-green-600">R$ {totalPago.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500 rounded-lg">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">A Receber</p>
              <p className="text-lg font-bold text-red-600">R$ {totalNaoPago.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col gap-4">
          {/* Periodo */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              { value: "diario" as Periodo, label: "Diário" },
              { value: "semanal" as Periodo, label: "Semanal" },
              { value: "mensal" as Periodo, label: "Mensal" },
              { value: "anual" as Periodo, label: "Anual" },
            ]).map((p) => (
              <button
                key={p.value}
                onClick={() => { setPeriodo(p.value); setDataInicio(""); setDataFim(""); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  !dataInicio && !dataFim && periodo === p.value
                    ? "bg-[#2563eb] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Filtro por Data */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Período:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              />
              <span className="text-sm text-gray-400">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              />
              {(dataInicio || dataFim) && (
                <button
                  onClick={() => { setDataInicio(""); setDataFim(""); }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              { value: "todos" as Filtro, label: "Todos" },
              { value: "externo" as Filtro, label: "Externos", icon: MapPin },
              { value: "recorrente" as Filtro, label: "Recorrentes", icon: Repeat },
              { value: "pago" as Filtro, label: "Pagos", icon: CheckCircle },
              { value: "nao_pago" as Filtro, label: "Não Pagos", icon: XCircle },
            ]).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setFiltro(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    filtro === tab.value
                      ? tab.value === "pago"
                        ? "bg-green-600 text-white"
                        : tab.value === "nao_pago"
                        ? "bg-red-600 text-white"
                        : "bg-[#2563eb] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {TabIcon && <TabIcon size={16} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome do cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum serviço externo encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Cliente
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Telefone
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtrados.map((servico) => (
                  <tr key={servico.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      {servico.tipo === "externo" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <MapPin size={12} />
                          Externo
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <Repeat size={12} />
                            Recorrente
                          </span>
                          {servico.recorrencia && (
                            <p className="text-xs text-gray-500 mt-1">
                              {RECURRENCIA_LABELS[servico.recorrencia] || servico.recorrencia}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="font-medium text-gray-800 text-sm">{servico.servico}</p>
                      <p className="text-xs text-gray-500 sm:hidden">{servico.cliente_nome}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-600">{servico.cliente_nome}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{servico.telefone || "-"}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {new Date(servico.data_servico).toLocaleDateString("pt-BR")}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`font-bold text-sm ${servico.pago ? "text-green-600" : "text-red-600"}`}>
                        R$ {servico.valor.toFixed(2).replace(".", ",")}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {servico.pago ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={12} />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle size={12} />
                          Não Pago
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/servicos-externos/${servico.id}`}
                          className="p-2 text-gray-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(servico.id, servico.servico)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
