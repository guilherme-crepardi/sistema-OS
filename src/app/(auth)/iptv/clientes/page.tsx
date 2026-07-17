"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, IptvCliente } from "@/lib/supabase";
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-700", icon: CheckCircle },
  vencido: { label: "Vencido", color: "bg-red-100 text-red-700", icon: XCircle },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

export default function IPTVClientesPage() {
  const [clientes, setClientes] = useState<IptvCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"todos" | "pago" | "nao_pago">("todos");

  useEffect(() => {
    resetMonthlyPayments();
    loadClientes();
  }, [statusFilter, paymentFilter]);

  async function resetMonthlyPayments() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastReset = localStorage.getItem("iptv_last_reset_month");

    if (lastReset === currentMonth) return;

    try {
      await supabase
        .from("iptv_clientes")
        .update({ pagou: false, notificado: false, updated_at: new Date().toISOString() })
        .eq("pagou", true);

      localStorage.setItem("iptv_last_reset_month", currentMonth);
    } catch (error) {
      console.error("Erro ao resetar pagamentos:", error);
    }
  }

  async function loadClientes() {
    try {
      let query = supabase.from("iptv_clientes").select("*").order("nome");

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (paymentFilter === "pago") {
        query = query.eq("pagou", true);
      } else if (paymentFilter === "nao_pago") {
        query = query.eq("pagou", false);
      }

      if (search) {
        query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid(id: string) {
    if (!confirm("Marcar este cliente como pago?")) return;

    try {
      const { error } = await supabase
        .from("iptv_clientes")
        .update({
          status: "ativo",
          pagou: true,
          notificado: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      loadClientes();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar cliente");
    }
  }

  async function handleMarkAsUnpaid(id: string) {
    if (!confirm("Marcar este cliente como não pago?")) return;

    try {
      const { error } = await supabase
        .from("iptv_clientes")
        .update({
          pagou: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      loadClientes();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar cliente");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancelar este cliente?")) return;

    try {
      const { error } = await supabase
        .from("iptv_clientes")
        .update({
          status: "cancelado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      loadClientes();
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      alert("Erro ao cancelar cliente");
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o cliente "${nome}"?`)) return;

    try {
      const { error } = await supabase.from("iptv_clientes").delete().eq("id", id);
      if (error) throw error;
      loadClientes();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir cliente");
    }
  }

  const clientesPagos = clientes.filter((c) => c.pagou).length;
  const clientesNaoPagos = clientes.filter((c) => !c.pagou).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes IPTV</h1>
          <p className="text-gray-500">Gerencie seus clientes de IPTV</p>
        </div>
        <Link
          href="/iptv/clientes/novo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={20} />
          Novo Cliente
        </Link>
      </div>

      {/* Stats de Pagamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clientes Pagos</p>
              <p className="text-2xl font-bold text-green-600">{clientesPagos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clientes Não Pagos</p>
              <p className="text-2xl font-bold text-red-600">{clientesNaoPagos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col gap-4">
          {/* Payment Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setPaymentFilter("todos")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                paymentFilter === "todos"
                  ? "bg-[#2563eb] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setPaymentFilter("pago")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                paymentFilter === "pago"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <CheckCircle size={16} />
              Pagos
            </button>
            <button
              onClick={() => setPaymentFilter("nao_pago")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                paymentFilter === "nao_pago"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <XCircle size={16} />
              Não Pagos
            </button>
          </div>

          {/* Search and Status Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadClientes();
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12">
            <Tv className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum cliente IPTV encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientes.map((cliente) => {
                  const statusConfig = STATUS_CONFIG[cliente.status];
                  const StatusIcon = statusConfig.icon;
                  const isVencido = new Date(cliente.data_vencimento) < new Date();

                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-medium">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{cliente.nome}</p>
                            <p className="text-sm text-gray-500">{cliente.telefone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {cliente.pagou ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <DollarSign size={12} />
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <DollarSign size={12} />
                            Não Pago
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${isVencido ? "text-red-600 font-medium" : "text-gray-600"}`}>
                          {new Date(cliente.data_vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        R$ {cliente.valor.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!cliente.pagou && (
                            <button
                              onClick={() => handleMarkAsPaid(cliente.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Marcar como pago"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {cliente.pagou && (
                            <button
                              onClick={() => handleMarkAsUnpaid(cliente.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Marcar como não pago"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          {cliente.status === "ativo" && (
                            <button
                              onClick={() => handleCancel(cliente.id)}
                              className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                              title="Cancelar"
                            >
                              <Clock size={18} />
                            </button>
                          )}
                          <Link
                            href={`/iptv/clientes/${cliente.id}`}
                            className="p-2 text-gray-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(cliente.id, cliente.nome)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Tv(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  );
}
