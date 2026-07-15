"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, IptvCliente } from "@/lib/supabase";
import { Plus, Tv, AlertTriangle, CheckCircle, XCircle, Send, Clock } from "lucide-react";

export default function IPTVPage() {
  const [clientes, setClientes] = useState<IptvCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

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

  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

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
  };

  const vencendoList = clientes.filter(
    (c) =>
      c.status === "ativo" &&
      new Date(c.data_vencimento) <= threeDaysFromNow &&
      new Date(c.data_vencimento) >= today
  );

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
          <h1 className="text-2xl font-bold text-gray-800">IPTV</h1>
          <p className="text-gray-500">Gerencie seus clientes de IPTV</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Tv}
          color="bg-[#2563eb]"
        />
        <StatCard
          title="Ativos"
          value={stats.ativos}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Vencidos"
          value={stats.vencidos}
          icon={XCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Cancelados"
          value={stats.cancelados}
          icon={XCircle}
          color="bg-gray-500"
        />
        <StatCard
          title="Vencendo (3 dias)"
          value={stats.vencendo}
          icon={AlertTriangle}
          color="bg-yellow-500"
        />
      </div>

      {/* Lista de clientes vencendo */}
      {vencendoList.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            Planos Vencendo em Breve
          </h3>
          <div className="space-y-2">
            {vencendoList.map((cliente) => {
              const diasRestantes = Math.ceil(
                (new Date(cliente.data_vencimento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between bg-white rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-gray-500">{cliente.telefone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">
                      Vence em {diasRestantes} dia(s)
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(cliente.data_vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link para lista completa */}
      <Link
        href="/iptv/clientes"
        className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Ver Todos os Clientes</p>
              <p className="text-sm text-gray-500">{stats.total} clientes cadastrados</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
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
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
