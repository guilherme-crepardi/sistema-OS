"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, OrdemServico, Cliente, getUserId } from "@/lib/supabase";
import { ArrowLeft, Save, Printer, Edit, X, Trash2, DollarSign } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG = {
  aberta: { label: "Aberta", color: "bg-red-100 text-red-700" },
  em_andamento: { label: "Em Andamento", color: "bg-yellow-100 text-yellow-700" },
  aguardando_peca: { label: "Aguardando Peça", color: "bg-orange-100 text-orange-700" },
  pronta: { label: "Pronta", color: "bg-green-100 text-green-700" },
  entregue: { label: "Entregue", color: "bg-blue-100 text-blue-700" },
};

export default function DetalheOSPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [os, setOs] = useState<(OrdemServico & { cliente?: Cliente }) | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState({
    cliente_id: "",
    equipamento: "",
    descricao: "",
    problema: "",
    valor: "",
    status: "",
    observacoes: "",
  });

  useEffect(() => {
    loadOS();
    loadClientes();
  }, [id]);

  async function loadClientes() {
    const userId = await getUserId();
    if (!userId) return;
    const { data } = await supabase.from("clientes").select("*").eq("user_id", userId).order("nome");
    setClientes(data || []);
  }

  async function loadOS() {
    try {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*, cliente:clientes(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOs(data);
      setForm({
        cliente_id: data.cliente_id || "",
        equipamento: data.equipamento || "",
        descricao: data.descricao,
        problema: data.problema || "",
        valor: data.valor?.toString() || "",
        status: data.status,
        observacoes: data.observacoes || "",
      });
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
      alert("OS não encontrada");
      router.push("/os");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({
          cliente_id: form.cliente_id || null,
          equipamento: form.equipamento || null,
          descricao: form.descricao,
          problema: form.problema || null,
          valor: parseFloat(form.valor) || 0,
          status: form.status,
          observacoes: form.observacoes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      alert("OS atualizada com sucesso!");
      setEditing(false);
      loadOS();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta OS?")) return;
    try {
      const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
      if (error) throw error;
      router.push("/os");
    } catch (error) {
      console.error("Erro ao excluir OS:", error);
      alert("Erro ao excluir OS");
    }
  };

  const handleTogglePago = async () => {
    try {
      const novoPago = !os?.pago;
      const { data, error } = await supabase
        .from("ordens_servico")
        .update({ pago: novoPago })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Erro Supabase:", error);
        alert(`Erro: ${error.message}\n\nExecute no Supabase SQL Editor:\nALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;`);
        return;
      }
      setOs(data?.[0] ? { ...os!, pago: novoPago } : os);
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

  if (!os) return null;

  const statusConfig = STATUS_CONFIG[os.status as keyof typeof STATUS_CONFIG];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header - no print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
        <div className="flex items-center gap-4">
          <Link
            href="/os"
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">OS #{os.numero}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Criada em {new Date(os.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <>
              <button
                onClick={handleTogglePago}
                className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                  os.pago
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                }`}
              >
                <DollarSign size={16} />
                <span className="hidden sm:inline">{os.pago ? "Pago" : "Marcar Pago"}</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
              >
                <Edit size={16} />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </>
          )}
          {editing && (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    cliente_id: os.cliente_id || "",
                    equipamento: os.equipamento || "",
                    descricao: os.descricao,
                    problema: os.problema || "",
                    valor: os.valor?.toString() || "",
                    status: os.status,
                    observacoes: os.observacoes || "",
                  });
                }}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700/500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <X size={16} />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 text-sm"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Print Layout */}
      <div ref={printRef}>
        {/* ==================== VIA DA LOJA ==================== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4 print:shadow-none print:rounded-none">
          <div className="bg-[#1e3a8a] text-white p-3 text-center">
            <h1 className="text-lg font-bold">MASTERTECH ELETRÔNICA</h1>
            <p className="text-blue-200 text-xs">Central de Serviços</p>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-center mb-3 pb-2 border-b-2 border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">Via da Loja</p>
              <p className="text-xs text-gray-500">ORDEM DE SERVIÇO</p>
              <p className="text-xl font-bold text-[#1e3a8a]">Nº {os.numero}</p>
            </div>

            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${os.pago ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {os.pago ? "Pago" : "Não Pago"}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">{new Date(os.created_at).toLocaleDateString("pt-BR")}</p>
            </div>

            <div className="mb-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Dados do Cliente</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-gray-400">Nome</p>
                  <p className="font-medium text-xs">{os.cliente?.nome || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Telefone</p>
                  <p className="font-medium text-xs">{os.cliente?.telefone || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">CPF</p>
                  <p className="font-medium text-xs">{os.cliente?.cpf || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Email</p>
                  <p className="font-medium text-xs">{os.cliente?.email || "—"}</p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Serviço</h3>
              <div className="space-y-1">
                {os.equipamento && (
                  <div>
                    <p className="text-[10px] text-gray-400">Equipamento</p>
                    <p className="font-medium text-xs">{os.equipamento}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400">Serviço Realizado</p>
                  <p className="font-medium text-xs">{os.descricao || "—"}</p>
                </div>
                {os.problema && (
                  <div>
                    <p className="text-[10px] text-gray-400">Problema Relatado</p>
                    <p className="font-medium text-xs">{os.problema}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400">Valor</p>
                  <p className="text-lg font-bold text-[#1e3a8a]">
                    R$ {os.valor.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            </div>

            {os.observacoes && (
              <div className="mb-3">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Observações</h3>
                <p className="text-xs text-gray-600">{os.observacoes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between gap-6">
                <div className="text-center flex-1">
                  <div className="border-b border-gray-400 mb-1 mx-auto w-36"></div>
                  <p className="text-[10px] text-gray-400">Assinatura do Cliente</p>
                </div>
                <div className="text-center flex-1">
                  <div className="border-b border-gray-400 mb-1 mx-auto w-36"></div>
                  <p className="text-[10px] text-gray-400">Responsável Técnico</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== VIA DO CLIENTE ==================== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mt-2 print:shadow-none print:rounded-none">
          <div className="bg-[#1e3a8a] text-white p-2 text-center">
            <h1 className="text-lg font-bold">MASTERTECH ELETRÔNICA</h1>
            <p className="text-blue-200 text-xs">Central de Serviços</p>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-center mb-3 pb-2 border-b-2 border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">Via do Cliente</p>
              <p className="text-xs text-gray-500">ORDEM DE SERVIÇO</p>
              <p className="text-xl font-bold text-[#1e3a8a]">Nº {os.numero}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p className="text-[10px] text-gray-400">Cliente</p>
                <p className="font-medium text-xs">{os.cliente?.nome || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Telefone</p>
                <p className="font-medium text-xs">{os.cliente?.telefone || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Endereço</p>
                <p className="font-medium text-xs">{os.cliente?.endereco || "—"}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between gap-6">
                <div className="text-center flex-1">
                  <div className="border-b border-gray-400 mb-1 mx-auto w-36"></div>
                  <p className="text-[10px] text-gray-400">Assinatura do Cliente</p>
                </div>
                <div className="text-center flex-1">
                  <div className="border-b border-gray-400 mb-1 mx-auto w-36"></div>
                  <p className="text-[10px] text-gray-400">Responsável Técnico</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edição - no print */}
      {editing && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 no-print">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Editar OS</h3>
          <div className="space-y-4">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <select
                value={form.cliente_id}
                onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} - {c.telefone}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equipamento / Aparelho
              </label>
              <input
                type="text"
                value={form.equipamento}
                onChange={(e) => setForm({ ...form, equipamento: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                placeholder="Ex: Samsung Galaxy S23, Notebook Dell..."
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Serviço Realizado
              </label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                placeholder="Ex: Formatação completa, Troca de tela..."
              />
            </div>

            {/* Problema */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Problema Relatado
              </label>
              <textarea
                value={form.problema}
                onChange={(e) => setForm({ ...form, problema: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                >
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_peca">Aguardando Peça</option>
                  <option value="pronta">Pronta</option>
                  <option value="entregue">Entregue</option>
                </select>
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
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    cliente_id: os.cliente_id || "",
                    equipamento: os.equipamento || "",
                    descricao: os.descricao,
                    problema: os.problema || "",
                    valor: os.valor?.toString() || "",
                    status: os.status,
                    observacoes: os.observacoes || "",
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
