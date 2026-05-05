/**
 * Utilitários para Módulo de Formação Profissional
 * 
 * Funções auxiliares para formatação, validação e manipulação
 * de dados relacionados com centros de formação e cursos.
 * 
 * @author Asdruba developer
 * @version 1.0.0
 */

/**
 * Formata valor monetário para Kwanza (AOA)
 * @param {number} valor - Valor a formatar
 * @returns {string} Valor formatado
 */
export const formatarKwanza = (valor) => {
  if (!valor && valor !== 0) return '0,00 Kz';
  
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
};

/**
 * Formata carga horária para exibição
 * @param {number} horas - Número de horas
 * @returns {string} Horas formatadas
 */
export const formatarCargaHoraria = (horas) => {
  if (!horas) return 'N/A';
  
  if (horas < 60) {
    return `${horas}h`;
  }
  
  const dias = Math.floor(horas / 8);
  const semanas = Math.floor(dias / 5);
  const meses = Math.floor(semanas / 4);
  
  if (meses > 0) {
    return `${meses} mês(es)`;
  } else if (semanas > 0) {
    return `${semanas} semana(s)`;
  } else if (dias > 0) {
    return `${dias} dia(s)`;
  }
  
  return `${horas}h`;
};

/**
 * Formata endereço completo
 * @param {Object} endereco - Objeto de endereço
 * @returns {string} Endereço formatado
 */
export const formatarEndereco = (endereco) => {
  const partes = [];
  
  if (endereco.rua) partes.push(endereco.rua);
  if (endereco.bairro) partes.push(endereco.bairro);
  if (endereco.municipio) partes.push(endereco.municipio);
  if (endereco.provincia) partes.push(endereco.provincia);
  
  return partes.join(', ') || 'Endereço não informado';
};

/**
 * Formata localização (município, província)
 * @param {string} municipio - Município
 * @param {string} provincia - Província
 * @returns {string} Localização formatada
 */
export const formatarLocalizacao = (municipio, provincia) => {
  if (!municipio && !provincia) return 'Localização não informada';
  if (municipio && provincia) return `${municipio}, ${provincia}`;
  return municipio || provincia;
};

/**
 * Valida formulário de centro de formação
 * @param {Object} dados - Dados do formulário
 * @returns {Object} Objeto com erros de validação
 */
export const validarCentroFormacao = (dados) => {
  const erros = {};
  
  // Validação do nome
  if (!dados.nome || dados.nome.trim().length < 3) {
    erros.nome = 'Nome deve ter pelo menos 3 caracteres';
  } else if (dados.nome.trim().length > 200) {
    erros.nome = 'Nome deve ter no máximo 200 caracteres';
  }
  
  // Validação da província
  if (!dados.provincia || dados.provincia.trim().length < 2) {
    erros.provincia = 'Província é obrigatória';
  }
  
  // Validação do município
  if (!dados.municipio || dados.municipio.trim().length < 2) {
    erros.municipio = 'Município é obrigatório';
  }
  
  // Validação do email (se informado)
  if (dados.email && dados.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dados.email)) {
      erros.email = 'Email inválido';
    }
  }
  
  // Validação do telefone (se informado)
  if (dados.telefone && dados.telefone.trim()) {
    const telefoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
    if (!telefoneRegex.test(dados.telefone)) {
      erros.telefone = 'Telefone inválido';
    }
  }
  
  // Validação do WhatsApp (se informado)
  if (dados.whatsapp && dados.whatsapp.trim()) {
    const whatsappRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
    if (!whatsappRegex.test(dados.whatsapp)) {
      erros.whatsapp = 'WhatsApp inválido';
    }
  }
  
  return {
    valido: Object.keys(erros).length === 0,
    erros
  };
};

/**
 * Valida formulário de oferta de curso
 * @param {Object} dados - Dados da oferta
 * @returns {Object} Objeto com erros de validação
 */
export const validarOfertaCurso = (dados) => {
  const erros = {};
  
  // Validação do centro
  if (!dados.center_id) {
    erros.center_id = 'Selecione um centro de formação';
  }
  
  // Validação do curso
  if (!dados.course_id) {
    erros.course_id = 'Selecione um curso';
  }
  
  // Validação do preço
  if (!dados.preco || dados.preco <= 0) {
    erros.preco = 'Preço deve ser maior que zero';
  } else if (dados.preco > 10000000) {
    erros.preco = 'Preço muito alto (máximo: 10.000.000 Kz)';
  }
  
  // Validação da carga horária (se informada)
  if (dados.carga_horaria && dados.carga_horaria > 0) {
    if (dados.carga_horaria > 10000) {
      erros.carga_horaria = 'Carga horária muito alta (máximo: 10.000 horas)';
    }
  } else if (dados.carga_horaria && dados.carga_horaria <= 0) {
    erros.carga_horaria = 'Carga horária deve ser maior que zero';
  }
  
  return {
    valido: Object.keys(erros).length === 0,
    erros
  };
};

/**
 * Gera opções de províncias para select
 * @returns {Array} Array de opções
 */
export const getOpcoesProvincias = () => [
  { value: 'Luanda', label: 'Luanda' },
  { value: 'Benguela', label: 'Benguela' },
  { value: 'Huambo', label: 'Huambo' },
  { value: 'Huíla', label: 'Huíla' },
  { value: 'Lubango', label: 'Lubango' },
  { value: 'Namibe', label: 'Namibe' },
  { value: 'Cunene', label: 'Cunene' },
  { value: 'Cuando Cubango', label: 'Cuando Cubango' },
  { value: 'Bié', label: 'Bié' },
  { value: 'Malanje', label: 'Malanje' },
  { value: 'Uíge', label: 'Uíge' },
  { value: 'Zaire', label: 'Zaire' },
  { value: 'Cabinda', label: 'Cabinda' },
  { value: 'Moxico', label: 'Moxico' },
  { value: 'Lunda Norte', label: 'Lunda Norte' },
  { value: 'Lunda Sul', label: 'Lunda Sul' },
  { value: 'Cuanza Norte', label: 'Cuanza Norte' },
  { value: 'Cuanza Sul', label: 'Cuanza Sul' }
];

/**
 * Gera opções de níveis de curso
 * @returns {Array} Array de opções
 */
export const getOpcoesNiveis = () => [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'profissionalizante', label: 'Profissionalizante' }
];

/**
 * Gera opções de categorias de curso
 * @returns {Array} Array de opções
 */
export const getOpcoesCategorias = () => [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'financas', label: 'Finanças' },
  { value: 'gestao', label: 'Gestão' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'logistica', label: 'Logística' },
  { value: 'producao', label: 'Produção' },
  { value: 'construcao', label: 'Construção Civil' },
  { value: 'hospitalidade', label: 'Hospitalidade' },
  { value: 'beleza', label: 'Beleza e Estética' },
  { value: 'desporto', label: 'Desporto' },
  { value: 'artes', label: 'Artes e Cultura' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'outros', label: 'Outros' }
];

/**
 * Calcula estatísticas de ofertas
 * @param {Array} ofertas - Lista de ofertas
 * @returns {Object} Estatísticas calculadas
 */
export const calcularEstatisticasOfertas = (ofertas) => {
  if (!ofertas || ofertas.length === 0) {
    return {
      total: 0,
      ativas: 0,
      inativas: 0,
      precoMedio: 0,
      precoMinimo: 0,
      precoMaximo: 0,
      totalInscricoes: 0,
      centrosDistintos: 0,
      cursosDistintos: 0
    };
  }
  
  const ofertasAtivas = ofertas.filter(o => o.status === 'ativo');
  const precos = ofertas.map(o => o.preco || 0).filter(p => p > 0);
  const centrosUnicos = new Set(ofertas.map(o => o.center_id));
  const cursosUnicos = new Set(ofertas.map(o => o.course_id));
  const totalInscricoes = ofertas.reduce((sum, o) => sum + (o.total_inscricoes || 0), 0);
  
  return {
    total: ofertas.length,
    ativas: ofertasAtivas.length,
    inativas: ofertas.length - ofertasAtivas.length,
    precoMedio: precos.length > 0 ? precos.reduce((a, b) => a + b, 0) / precos.length : 0,
    precoMinimo: precos.length > 0 ? Math.min(...precos) : 0,
    precoMaximo: precos.length > 0 ? Math.max(...precos) : 0,
    totalInscricoes,
    centrosDistintos: centrosUnicos.size,
    cursosDistintos: cursosUnicos.size
  };
};

/**
 * Filtra ofertas por múltiplos critérios
 * @param {Array} ofertas - Lista de ofertas
 * @param {Object} filtros - Critérios de filtro
 * @returns {Array} Ofertas filtradas
 */
export const filtrarOfertas = (ofertas, filtros) => {
  if (!ofertas || !filtros) return ofertas;
  
  return ofertas.filter(oferta => {
    // Filtro por busca textual
    if (filtros.search) {
      const busca = filtros.search.toLowerCase();
      const matchNome = oferta.nome_curso?.toLowerCase().includes(busca);
      const matchCentro = oferta.nome_centro?.toLowerCase().includes(busca);
      const matchCategoria = oferta.categoria_curso?.toLowerCase().includes(busca);
      
      if (!matchNome && !matchCentro && !matchCategoria) return false;
    }
    
    // Filtro por centro
    if (filtros.center_id && oferta.center_id !== filtros.center_id) return false;
    
    // Filtro por curso
    if (filtros.course_id && oferta.course_id !== filtros.course_id) return false;
    
    // Filtro por status
    if (filtros.status && filtros.status !== 'todos' && oferta.status !== filtros.status) return false;
    
    // Filtro por preço mínimo
    if (filtros.min_preco && (!oferta.preco || oferta.preco < parseFloat(filtros.min_preco))) return false;
    
    // Filtro por preço máximo
    if (filtros.max_preco && (!oferta.preco || oferta.preco > parseFloat(filtros.max_preco))) return false;
    
    return true;
  });
};

/**
 * Ordena ofertas por diferentes critérios
 * @param {Array} ofertas - Lista de ofertas
 * @param {string} criterio - Critério de ordenação
 * @param {boolean} crescente - Ordem crescente (true) ou decrescente (false)
 * @returns {Array} Ofertas ordenadas
 */
export const ordenarOfertas = (ofertas, criterio = 'preco', crescente = true) => {
  if (!ofertas) return [];
  
  const ofertasOrdenadas = [...ofertas];
  
  switch (criterio) {
    case 'preco':
      ofertasOrdenadas.sort((a, b) => (a.preco || 0) - (b.preco || 0));
      break;
    case 'nome':
      ofertasOrdenadas.sort((a, b) => (a.nome_curso || '').localeCompare(b.nome_curso || ''));
      break;
    case 'centro':
      ofertasOrdenadas.sort((a, b) => (a.nome_centro || '').localeCompare(b.nome_centro || ''));
      break;
    case 'inscricoes':
      ofertasOrdenadas.sort((a, b) => (a.total_inscricoes || 0) - (b.total_inscricoes || 0));
      break;
    case 'data':
      ofertasOrdenadas.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      break;
    default:
      return ofertas;
  }
  
  return crescente ? ofertasOrdenadas : ofertasOrdenadas.reverse();
};

/**
 * Gera cor de status para exibição
 * @param {string} status - Status da oferta
 * @returns {Object} Objeto com cores e texto
 */
export const getStatusStyle = (status) => {
  const estilos = {
    ativo: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Ativa'
    },
    inativo: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Inativa'
    },
    pendente: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pendente'
    }
  };
  
  return estilos[status] || estilos.pendente;
};

export default {
  formatarKwanza,
  formatarCargaHoraria,
  formatarEndereco,
  formatarLocalizacao,
  validarCentroFormacao,
  validarOfertaCurso,
  getOpcoesProvincias,
  getOpcoesNiveis,
  getOpcoesCategorias,
  calcularEstatisticasOfertas,
  filtrarOfertas,
  ordenarOfertas,
  getStatusStyle
};
