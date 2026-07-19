"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, ServicoExterno, getUserId } from "@/lib/supabase";
import { ArrowLeft, Save, Trash2, DollarSign } from "lucide-react";
import Link from "next/link";

export default function EditarServicoExternoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [servico, setServico] = useState<ServicoExterno | null>(null);
  const [form, setForm] = useState<{
    cliente_nome: string;
    telefone: string;
    tipo: "externo" | "recorrente";
    recorrencia: ServicoExterno["recorrencia"];
    servico: string;
    data_servico: string;
    valor: string;
    observacoes: string;
  }>({
    cliente_nome: "",
    telefone: "",
    tipo: "externo",
    recorrencia: null,
    servico: "",
    data_servico: "",
    valor: "",
    observacoes: "",
  });

  useEffect(() => {
    loadServico();
  }, [id]);

  async function loadServico() {
    try {
      const { data, error } = await supabase
        .from("servicos_externos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setServico(data);
      setForm({
        cliente_nome: data.cliente_nome || "",
        telefone: data.telefone || "",
        tipo: data.tipo || "externo",
        recorrencia: data.recorrencia || null,
        servico: data.servico || "",
        data_servico: data.data_servico || "",
        valor: data.valor?.toString() || "",
        observacoes: data.observacoes || "",
      });
    } catch (error) {
      console.error("Erro ao carregar serviço:", error);
      alert("Serviço não encontrado");
      router.push("/servicos-externos");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!form.cliente_nome.trim()) {
      alert("O campo Cliente é obrigatório");
      return;
    }
    if (!form.servico.trim()) {
      alert("O campo Serviço é obrigatório");
      return;
    }
    if (!form.data_servico) {
      alert("O campo Data do Serviço é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("servicos_externos")
        .update({
          cliente_nome: form.cliente_nome.trim(),
          telefone: form.telefone.trim() || null,
          tipo: form.tipo,
          recorrencia: form.tipo === "recorrente" ? form.recorrencia : null,
          servico: form.servico.trim(),
          data_servico: form.data_servico,
          valor: parseFloat(form.valor) || 0,
          observacoes: form.observacoes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      router.push("/servicos-externos");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar serviço");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    try {
      const { error } = await supabase.from("servicos_externos").delete().eq("id", id);
      if (error) throw error;
      router.push("/servicos-externos");
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      alert("Erro ao excluir serviço");
    }
  };

  const handleTogglePago = async () => {
    try {
      const novoPago = !servico?.pago;
      const { data, error } = await supabase
        .from("servicos_externos")
        .update({ pago: novoPago })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Erro Supabase:", error);
        alert(`Erro: ${error.message}\n\nExecute no Supabase SQL Editor:\nALTER TABLE servicos_externos ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;`);
        return;
      }
      setServico(data?.[0] ? { ...servico!, pago: novoPago } : servico);
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      alert("Erro ao atualizar pagamento");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (!servico) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/servicos-externos"
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Editar Serviço</h1>
            <p className="text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-md">
              {servico.servico}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleTogglePago}
            className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
              servico.pago
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            }`}
          >
            <DollarSign size={16} />
            <span className="hidden sm:inline">{servico.pago ? "Pago" : "Marcar Pago"}</span>
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente *
              </label>
              <input
                type="text"
                value={form.cliente_nome}
                onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                placeholder="Nome do cliente"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo: e.target.value as "externo" | "recorrente",
                    recorrencia: e.target.value === "externo" ? null : form.recorrencia,
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              >
                <option value="externo">Serviço Externo</option>
                <option value="recorrente">Serviço Recorrente</option>
              </select>
            </div>

            {/* Recorrência - condicional */}
            {form.tipo === "recorrente" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recorrência
                </label>
                <select
                  value={form.recorrencia || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recorrencia: e.target.value as ServicoExterno["recorrencia"],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                >
                  <option value="">Selecione</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Serviço *
            </label>
            <input
              type="text"
              value={form.servico}
              onChange={(e) => setForm({ ...form, servico: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              placeholder="Descrição do serviço"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data do Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data do Serviço *
              </label>
              <input
                type="date"
                value={form.data_servico}
                onChange={(e) => setForm({ ...form, data_servico: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link
              href="/servicos-externos"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-center"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
