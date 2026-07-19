"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, OrdemServico, Cliente, getUserId } from "@/lib/supabase";
import { Plus, Search, Eye, Printer, Clock, CheckCircle, AlertCircle, Settings, Trash2 } from "lucide-react";

const STATUS_CONFIG = {
  aberta: { label: "Aberta", color: "bg-red-100 text-red-700", icon: AlertCircle },
  em_andamento: { label: "Em Andamento", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  aguardando_peca: { label: "Aguardando Peça", color: "bg-orange-100 text-orange-700", icon: Clock },
  pronta: { label: "Pronta", color: "bg-green-100 text-green-700", icon: CheckCircle },
  entregue: { label: "Entregue", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
};

type SearchType = "numero" | "cliente" | "equipamento";

export default function OSPage() {
  const [ordens, setOrdens] = useState<(OrdemServico & { cliente?: Cliente })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("numero");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    loadOrdens();
  }, [statusFilter]);

  async function loadOrdens() {
    try {
      const userId = await getUserId();
      if (!userId) return;
      let query = supabase
        .from("ordens_servico")
        .select("*, cliente:clientes(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (search) {
        if (searchType === "numero") {
          query = query.eq("numero", parseInt(search) || 0);
        } else if (searchType === "cliente") {
          query = query.ilike("cliente.nome", `%${search}%`);
        } else if (searchType === "equipamento") {
          query = query.ilike("equipamento", `%${search}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrdens(data || []);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    loadOrdens();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      loadOrdens();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta OS?")) return;
    try {
      const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
      if (error) throw error;
      loadOrdens();
    } catch (error) {
      console.error("Erro ao excluir OS:", error);
      alert("Erro ao excluir OS");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ordens de Serviço</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie as ordens de serviço</p>
        </div>
        <Link
          href="/os/nova"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={20} />
          Nova OS
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col gap-4">
          {/* Search Type Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSearchType("numero")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchType === "numero"
                  ? "bg-[#2563eb] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Número da OS
            </button>
            <button
              onClick={() => setSearchType("cliente")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchType === "cliente"
                  ? "bg-[#2563eb] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Nome do Cliente
            </button>
            <button
              onClick={() => setSearchType("equipamento")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchType === "equipamento"
                  ? "bg-[#2563eb] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Equipamento
            </button>
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder={
                  searchType === "numero"
                    ? "Digite o número da OS..."
                    : searchType === "cliente"
                    ? "Digite o nome do cliente..."
                    : "Digite o modelo do equipamento..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
            >
              Buscar
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            >
              <option value="">Todos os status</option>
              <option value="aberta">Aberta</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_peca">Aguardando Peça</option>
              <option value="pronta">Pronta</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
          </div>
        ) : ordens.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma OS encontrada</p>
          </div>
        ) : (
          ordens.map((os) => {
            const statusConfig = STATUS_CONFIG[os.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={os.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-400 dark:text-gray-500">#{os.numero}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                      {os.valor > 0 && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${os.pago ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {os.pago ? "Pago" : "Não Pago"}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{os.descricao}</p>
                    {os.equipamento && (
                      <p className="text-sm text-blue-600 mt-1">
                        {os.equipamento}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {os.cliente?.nome || "Cliente não informado"} •{" "}
                      {new Date(os.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {os.valor > 0 && (
                      <p className={`text-sm font-bold mt-1 ${os.pago ? "text-green-600" : "text-red-600"}`}>
                        R$ {os.valor.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/os/${os.id}`}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Eye size={18} />
                    </Link>
                    <Link
                      href={`/os/${os.id}?print=true`}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      target="_blank"
                    >
                      <Printer size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(os.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
