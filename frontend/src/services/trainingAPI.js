/**
 * Serviço API para Módulo de Formação Profissional
 * 
 * Centraliza todas as chamadas à API relacionadas com centros de formação,
 * ofertas de cursos e gestão do módulo de formação profissional.
 * 
 * @author Asdruba developer
 * @version 1.0.0
 */

import api from './api';

/**
 * Serviço para Centros de Formação
 */
export const centrosAPI = {
  /**
   * Lista todos os centros de formação
   * @param {Object} params - Parâmetros de filtro
   * @returns {Promise} Promise com lista de centros
   */
  listar: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/training-centers/admin${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Cria um novo centro de formação
   * @param {Object} dados - Dados do centro
   * @returns {Promise} Promise com centro criado
   */
  criar: (dados) => api.post('/training-centers/admin', dados),

  /**
   * Obtém detalhes de um centro específico
   * @param {number} id - ID do centro
   * @returns {Promise} Promise com detalhes do centro
   */
  obter: (id) => api.get(`/training-centers/admin/${id}`),

  /**
   * Atualiza um centro de formação
   * @param {number} id - ID do centro
   * @param {Object} dados - Dados a atualizar
   * @returns {Promise} Promise com centro atualizado
   */
  atualizar: (id, dados) => api.put(`/training-centers/admin/${id}`, dados),

  /**
   * Exclui (soft delete) um centro de formação
   * @param {number} id - ID do centro
   * @returns {Promise} Promise de exclusão
   */
  excluir: (id) => api.delete(`/training-centers/admin/${id}`),

  /**
   * Associa cursos a um centro
   * @param {number} id - ID do centro
   * @param {Object} dados - Dados de associação
   * @returns {Promise} Promise de associação
   */
  associarCursos: (id, dados) => api.post(`/training-centers/admin/${id}/courses`, dados),

  /**
   * Remove associação de curso com centro
   * @param {number} id - ID do centro
   * @param {number} courseId - ID do curso
   * @returns {Promise} Promise de remoção
   */
  removerAssociacao: (id, courseId) => api.delete(`/training-centers/admin/${id}/courses/${courseId}`),

  /**
   * Lista centros públicos (para alunos)
   * @param {Object} params - Parâmetros de filtro
   * @returns {Promise} Promise com lista de centros públicos
   */
  listarPublicos: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/training-centers${queryString ? `?${queryString}` : ''}`);
  }
};

/**
 * Serviço para Ofertas de Cursos
 */
export const ofertasAPI = {
  /**
   * Lista todas as ofertas de cursos
   * @param {Object} params - Parâmetros de filtro
   * @returns {Promise} Promise com lista de ofertas
   */
  listar: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/training-offerings/admin${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtém detalhes de uma oferta específica
   * @param {number} id - ID da oferta
   * @returns {Promise} Promise com detalhes da oferta
   */
  obter: (id) => api.get(`/training-offerings/admin/${id}`),

  /**
   * Cria uma nova oferta de curso
   * @param {Object} dados - Dados da oferta
   * @returns {Promise} Promise com oferta criada
   */
  criar: (dados) => api.post('/training-offerings/admin', dados),

  /**
   * Atualiza uma oferta de curso
   * @param {number} id - ID da oferta
   * @param {Object} dados - Dados a atualizar
   * @returns {Promise} Promise com oferta atualizada
   */
  atualizar: (id, dados) => api.put(`/training-offerings/admin/${id}`, dados),

  /**
   * Desativa uma oferta de curso
   * @param {number} id - ID da oferta
   * @returns {Promise} Promise de desativação
   */
  desativar: (id) => api.delete(`/training-offerings/admin/${id}`),

  /**
   * Lista ofertas públicas (para alunos)
   * @param {Object} params - Parâmetros de filtro
   * @returns {Promise} Promise com lista de ofertas públicas
   */
  listarPublicas: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/training-offerings${queryString ? `?${queryString}` : ''}`);
  }
};

/**
 * Serviço para Cursos (base)
 */
export const cursosAPI = {
  /**
   * Lista todos os cursos base
   * @param {Object} params - Parâmetros de filtro
   * @returns {Promise} Promise com lista de cursos
   */
  listar: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtém detalhes de um curso
   * @param {number} id - ID do curso
   * @returns {Promise} Promise com detalhes do curso
   */
  obter: (id) => api.get(`/courses/${id}`),

  /**
   * Cria um novo curso
   * @param {Object} dados - Dados do curso
   * @returns {Promise} Promise com curso criado
   */
  criar: (dados) => api.post('/admin/courses', dados),

  /**
   * Atualiza um curso
   * @param {number} id - ID do curso
   * @param {Object} dados - Dados a atualizar
   * @returns {Promise} Promise com curso atualizado
   */
  atualizar: (id, dados) => api.put(`/admin/courses/${id}`, dados),

  /**
   * Desativa um curso
   * @param {number} id - ID do curso
   * @returns {Promise} Promise de desativação
   */
  desativar: (id) => api.delete(`/admin/courses/${id}`)
};

/**
 * Serviço combinado para operações frequentes
 */
export const formacaoAPI = {
  /**
   * Obtém estatísticas gerais do módulo de formação
   * @returns {Promise} Promise com estatísticas
   */
  estatisticas: () => api.get('/admin/training-stats'),

  /**
   * Obtém resumo para dashboard administrativo
   * @returns {Promise} Promise com resumo
   */
  dashboard: () => api.get('/admin/training-dashboard'),

  /**
   * Busca centros por localização
   * @param {string} provincia - Província
   * @param {string} municipio - Município (opcional)
   * @returns {Promise} Promise com centros encontrados
   */
  buscarPorLocalizacao: (provincia, municipio = null) => {
    const params = { provincia };
    if (municipio) params.municipio = municipio;
    return centrosAPI.listarPublicos(params);
  },

  /**
   * Busca ofertas por curso e localização
   * @param {number} courseId - ID do curso
   * @param {string} provincia - Província (opcional)
   * @param {string} municipio - Município (opcional)
   * @returns {Promise} Promise com ofertas encontradas
   */
  buscarOfertasPorCurso: (courseId, provincia = null, municipio = null) => {
    const params = { course_id: courseId };
    if (provincia) params.provincia = provincia;
    if (municipio) params.municipio = municipio;
    return ofertasAPI.listarPublicas(params);
  },

  /**
   * Obtém cursos populares com ofertas
   * @param {number} limite - Limite de resultados
   * @returns {Promise} Promise com cursos populares
   */
  cursosPopulares: (limite = 10) => {
    return api.get(`/courses?limit=${limite}&sort=popular`);
  },

  /**
   * Obtém centros com mais ofertas
   * @param {number} limite - Limite de resultados
   * @returns {Promise} Promise com centros ativos
   */
  centrosAtivos: (limite = 10) => {
    return api.get(`/training-centers?limit=${limite}&sort=active_offers`);
  }
};

export default {
  centros: centrosAPI,
  ofertas: ofertasAPI,
  cursos: cursosAPI,
  formacao: formacaoAPI
};
