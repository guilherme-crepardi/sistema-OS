"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, IptvCliente } from "@/lib/supabase";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditarIPTVClientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cliente, setCliente] = useState<IptvCliente | null>(null);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    data_inicio: "",
    data_vencimento: "",
    valor: "",
    pagou: false,
    status: "ativo" as "ativo" | "vencido" | "cancelado",
  });

  useEffect(() => {
    loadCliente();
  }, [id]);

  async function loadCliente() {
    try {
      const { data, error } = await supabase.from("iptv_clientes").select("*").eq("id", id).single();
      if (error) throw error;
      setCliente(data);
      setForm({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email || "",
        data_inicio: data.data_inicio,
        data_vencimento: data.data_vencimento,
        valor: data.valor?.toString() || "",
        pagou: data.pagou || false,
        status: data.status,
      });
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      alert("Cliente não encontrado");
      router.push("/iptv/clientes");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("iptv_clientes")
        .update({
          nome: form.nome,
          telefone: form.telefone,
          email: form.email || null,
          data_inicio: form.data_inicio,
          data_vencimento: form.data_vencimento,
          valor: parseFloat(form.valor) || 0,
          pagou: form.pagou,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/iptv/clientes");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir o cliente "${cliente?.nome}"?`)) return;
    try {
      const { error } = await supabase.from("iptv_clientes").delete().eq("id", id);
      if (error) throw error;
      router.push("/iptv/clientes");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir cliente");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/iptv/clientes"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Editar Cliente IPTV</h1>
            <p className="text-gray-500">{cliente?.nome}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 size={18} />
          Excluir
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone / WhatsApp *
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início *
            </label>
            <input
              type="date"
              value={form.data_inicio}
              onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Vencimento *
            </label>
            <input
              type="date"
              value={form.data_vencimento}
              onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Mensal (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "ativo" | "vencido" | "cancelado" })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            >
              <option value="ativo">Ativo</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pagou}
                onChange={(e) => setForm({ ...form, pagou: e.target.checked })}
                className="w-5 h-5 text-[#2563eb] border-gray-300 rounded focus:ring-[#2563eb]"
              />
              <span className="text-sm font-medium text-gray-700">Cliente Pagou</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/iptv/clientes"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
