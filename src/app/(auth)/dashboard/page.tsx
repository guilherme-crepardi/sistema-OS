"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Settings, Tv, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

interface Stats {
  totalClientes: number;
  totalOS: number;
  osAbertas: number;
  osEmAndamento: number;
  osProntas: number;
  totalIptv: number;
  iptvAtivos: number;
  iptvVencidos: number;
  iptvVencendo: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    totalOS: 0,
    osAbertas: 0,
    osEmAndamento: 0,
    osProntas: 0,
    totalIptv: 0,
    iptvAtivos: 0,
    iptvVencidos: 0,
    iptvVencendo: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [clientes, os, iptv] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("ordens_servico").select("status"),
        supabase.from("iptv_clientes").select("status, data_vencimento"),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const osData: any[] = os.data || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iptvData: any[] = iptv.data || [];

      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      setStats({
        totalClientes: clientes.count || 0,
        totalOS: osData.length,
        osAbertas: osData.filter((o) => o.status === "aberta").length,
        osEmAndamento: osData.filter((o) => o.status === "em_andamento").length,
        osProntas: osData.filter((o) => o.status === "pronta").length,
        totalIptv: iptvData.length,
        iptvAtivos: iptvData.filter((i) => i.status === "ativo").length,
        iptvVencidos: iptvData.filter((i) => i.status === "vencido").length,
        iptvVencendo: iptvData.filter(
          (i) =>
            i.status === "ativo" &&
            new Date(i.data_vencimento) <= threeDaysFromNow &&
            new Date(i.data_vencimento) >= today
        ).length,
      });
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    } finally {
      setLoading(false);
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
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Clientes"
          value={stats.totalClientes}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="OS Abertas"
          value={stats.osAbertas + stats.osEmAndamento}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="IPTV Ativos"
          value={stats.iptvAtivos}
          icon={Tv}
          color="green"
        />
        <StatCard
          title="Vencendo em 3 dias"
          value={stats.iptvVencendo}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Status das OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ordens de Serviço</h3>
          <div className="space-y-3">
            <StatusRow
              label="Abertas"
              value={stats.osAbertas}
              total={stats.totalOS}
              color="bg-red-500"
            />
            <StatusRow
              label="Em Andamento"
              value={stats.osEmAndamento}
              total={stats.totalOS}
              color="bg-yellow-500"
            />
            <StatusRow
              label="Prontas"
              value={stats.osProntas}
              total={stats.totalOS}
              color="bg-green-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status IPTV</h3>
          <div className="space-y-3">
            <StatusRow
              label="Ativos"
              value={stats.iptvAtivos}
              total={stats.totalIptv}
              color="bg-green-500"
            />
            <StatusRow
              label="Vencidos"
              value={stats.iptvVencidos}
              total={stats.totalIptv}
              color="bg-red-500"
            />
            <StatusRow
              label="Vencendo em breve"
              value={stats.iptvVencendo}
              total={stats.totalIptv}
              color="bg-yellow-500"
            />
          </div>
        </div>
      </div>
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
  color: "blue" | "yellow" | "green" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    red: "bg-red-500",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-800">{value}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
