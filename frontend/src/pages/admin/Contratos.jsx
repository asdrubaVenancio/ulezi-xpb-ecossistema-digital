/**
 * Página de Contratos - Admin
 * Módulo 7 - Negócios e Investimentos
 * 
 * Interface para gestão de contratos entre empresas e investidores
 * 
 * @author AsdrubaDeveloper
 * @version 1.0.0
 */

import {
    Building2,
    Calendar,
    CheckCircle,
    ChevronLeft, ChevronRight,
    Clock,
    DollarSign,
    Download,
    Eye,
    FileSignature,
    FileText,
    RefreshCw,
    Search,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

const Contratos = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    assinados: 0,
    concluidos: 0
  });

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/contracts', {
        params: {
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: search || undefined,
          page: currentPage,
          limit: 20
        }
      });
      setContracts(response.data.contratos || []);
      setTotalPages(Math.ceil((response.data.total || 0) / 20));
    } catch (err) {
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/contracts/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [filterStatus, currentPage, search]);

  const handleDownload = async (contractId) => {
    try {
      const response = await api.get(`/contracts/${contractId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrato_${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Contrato baixado');
    } catch (err) {
      toast.error('Erro ao baixar contrato');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      assinado_empresa: 'bg-blue-100 text-blue-800',
      assinado_investidor: 'bg-purple-100 text-purple-800',
      assinado: 'bg-green-100 text-green-800',
      concluido: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      pendente: 'Pendente',
      assinado_empresa: 'Assinado (Empresa)',
      assinado_investidor: 'Assinado (Investidor)',
      assinado: 'Assinado',
      concluido: 'Concluído'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pendente}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-AO');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userType="admin" />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contratos</h1>
          <p className="text-gray-600">Gestão de contratos de investimento</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assinados</p>
                <p className="text-2xl font-bold text-green-600">{stats.assinados}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FileSignature className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.concluidos}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar contratos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="assinado_empresa">Assinados (Empresa)</option>
              <option value="assinado_investidor">Assinados (Investidor)</option>
              <option value="assinado">Assinados</option>
              <option value="concluido">Concluídos</option>
            </select>
            <button
              onClick={fetchContracts}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Nenhum contrato encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Contrato</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Empresa</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Investidor</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{contract.numero_contrato}</p>
                            <p className="text-sm text-gray-500">{formatDate(contract.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{contract.nome_empresa}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{contract.nome_investidor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-medium text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          {new Intl.NumberFormat('pt-AO', {
                            style: 'currency',
                            currency: contract.moeda || 'AOA'
                          }).format(contract.valor)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedContract(contract); setShowModal(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(contract.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes */}
      {showModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Detalhes do Contrato</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedContract.numero_contrato}</h3>
                  {getStatusBadge(selectedContract.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Empresa</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {selectedContract.nome_empresa}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Investidor</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedContract.nome_investidor}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Valor</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-AO', {
                      style: 'currency',
                      currency: selectedContract.moeda || 'AOA'
                    }).format(selectedContract.valor)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Data de Criação</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedContract.created_at)}
                  </p>
                </div>
              </div>

              {selectedContract.data_assinatura_empresa && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Assinatura Empresa</p>
                  <p className="font-medium text-green-900">
                    {formatDate(selectedContract.data_assinatura_empresa)}
                  </p>
                </div>
              )}

              {selectedContract.data_assinatura_investidor && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Assinatura Investidor</p>
                  <p className="font-medium text-purple-900">
                    {formatDate(selectedContract.data_assinatura_investidor)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(selectedContract.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contratos;
