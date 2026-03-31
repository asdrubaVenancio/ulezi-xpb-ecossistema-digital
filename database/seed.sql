-- ============================================================
-- ULEZI XPB - Dados Iniciais (Seed)
-- Senha de todos os utilizadores demo: Admin@123456
-- ============================================================
USE ulezi2_xpb;

-- ─── UTILIZADORES INICIAIS1 ────────────────────────────────────────────────────
-- Hash bcrypt rounds=12 para a senha: Admin@123456, Funcionario@123456, User@123456
-- Para gerar novo hash: node -e "require('bcryptjs').hash('Admin@123456',12).then(console.log)"
INSERT INTO users (id, nome, email, telefone, password_hash, role, status, email_verificado) VALUES
(1, 'Administrador Ulezi', '2CentrosFormacao.jsx:450 Uncaught TypeError: centros.map is not a function
    at CentrosFormacao (CentrosFormacao.jsx:450:22)
    at renderWithHooks (chunk-PJEEZAML.js?v=c4fe654c:11548:26)
    at updateFunctionComponent (chunk-PJEEZAML.js?v=c4fe654c:14582:28)
    at beginWork (chunk-PJEEZAML.js?v=c4fe654c:15924:22)
    at HTMLUnknownElement.callCallback2 (chunk-PJEEZAML.js?v=c4fe654c:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-PJEEZAML.js?v=c4fe654c:3699:24)
    at invokeGuardedCallback (chunk-PJEEZAML.js?v=c4fe654c:3733:39)
    at beginWork$1 (chunk-PJEEZAML.js?v=c4fe654c:19765:15)
    at performUnitOfWork (chunk-PJEEZAML.js?v=c4fe654c:19198:20)
    at workLoopSync (chunk-PJEEZAML.js?v=c4fe654c:19137:13)Understand this error
chunk-PJEEZAML.js?v=c4fe654c:14032 The above error occurred in the <CentrosFormacao> component:

    at CentrosFormacao (http://localhost:3000/src/pages/admin/CentrosFormacao.jsx?t=1774889238895:39:17)
    at div
    at main
    at div
    at DashboardAdmin (http://localhost:3000/src/pages/admin/DashboardAdmin.jsx?t=1774889238895:76:34)
    at RotaPrivada (http://localhost:3000/src/routes/Guards.jsx?t=1774888776266:22:31)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=c4fe654c:4131:5)
    at Routes (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=c4fe654c:4601:5)
    at Router (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=c4fe654c:4544:15)
    at BrowserRouter (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=c4fe654c:5290:5)
    at ToastProvider (http://localhost:3000/src/components/ui/Toast.jsx:38:33)
    at AuthProvider (http://localhost:3000/src/context/AuthContext.jsx?t=1774888776266:27:32)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ chunk-PJEEZAML.js?v=c4fe654c:14032Understand this error
chunk-PJEEZAML.js?v=c4fe654c:19413 Uncaught TypeError: centros.map is not a function
    at CentrosFormacao (CentrosFormacao.jsx:450:22)
    at renderWithHooks (chunk-PJEEZAML.js?v=c4fe654c:11548:26)
    at updateFunctionComponent (chunk-PJEEZAML.js?v=c4fe654c:14582:28)
    at beginWork (chunk-PJEEZAML.js?v=c4fe654c:15924:22)
    at beginWork$1 (chunk-PJEEZAML.js?v=c4fe654c:19753:22)
    at performUnitOfWork (chunk-PJEEZAML.js?v=c4fe654c:19198:20)
    at workLoopSync (chunk-PJEEZAML.js?v=c4fe654c:19137:13)
    at renderRootSync (chunk-PJEEZAML.js?v=c4fe654c:19116:15)
    at recoverFromConcurrentError (chunk-PJEEZAML.js?v=c4fe654c:18736:28)
    at performConcurrentWorkOnRoot (chunk-PJEEZAML.js?v=c4fe654c:18684:30)Understand this error
api.js:48 [AXIOS RESPONSE] 200 /training-centers/admin?search=&provincia=&municipio=&status=ativo', '+244923000001',
 '$2b$12$H7XdVMqz2Buudglpgj7oD.CYsc/qCgjgy89wMJvtBommJqcFZP2my', 'admin', 'ativo', 1),
(2, 'Funcionário Demo', 'funcionario@ulezixpb.com', '+244923000002',
 '$2b$12$I4qhhWj681ivU244JfY4z.gCwdDnlwR4YgQtZ5Akjma2NQohp1xve', 'employee', 'ativo', 1),
(3, 'João Estudante', 'joao@demo.com', '+244923111001',
 '$2b$12$Ww7n59QxX.nwfALbTaD5E.gSoGK4pEgIYIGrcZtxeS30.hUvMuRm.', 'student', 'ativo', 1),
(4, 'Maria Investidora', 'maria@demo.com', '+244923222001',
 '$2b$12$Ww7n59QxX.nwfALbTaD5E.gSoGK4pEgIYIGrcZtxeS30.hUvMuRm.', 'investor', 'ativo', 1),
(5, 'TechCorp Angola', 'techcorp@demo.com', '+244923333001',
 '$2b$12$Ww7n59QxX.nwfALbTaD5E.gSoGK4pEgIYIGrcZtxeS30.hUvMuRm.', 'company', 'ativo', 1)
ON DUPLICATE KEY UPDATE
 nome = VALUES(nome),
 telefone = VALUES(telefone),
 password_hash = VALUES(password_hash),
 role = VALUES(role),
 status = VALUES(status),
 email_verificado = VALUES(email_verificado);

-- ─── PERFIS ───────────────────────────────────────────────────────────────────
INSERT INTO student_profiles (user_id, municipio, provincia, is_public) VALUES
(3, 'Luanda', 'Luanda', 1)
ON DUPLICATE KEY UPDATE user_id=user_id;

INSERT INTO investor_profiles (user_id, areas_interesse, descricao, provincia, municipio, is_public) VALUES
(4, 'Tecnologia, Educação, Saúde', 'Investidora com foco em startups angolanas.', 'Luanda', 'Luanda', 1)
ON DUPLICATE KEY UPDATE user_id=user_id;

INSERT INTO company_profiles (user_id, nome_empresa, nif, descricao, sector, provincia, municipio, is_approved, is_public) VALUES
(5, 'TechCorp Angola Lda', '5000000001', 'Empresa líder em tecnologia e soluções digitais em Angola.', 'Tecnologia', 'Luanda', 'Luanda', 1, 1)
ON DUPLICATE KEY UPDATE user_id=user_id;

-- ─── CATEGORIAS DE SERVIÇOS ───────────────────────────────────────────────────
INSERT INTO service_categories (nome, descricao, icone) VALUES
('Tecnologia e TI', 'Desenvolvimento de software, redes e suporte informático', 'monitor'),
('Contabilidade e Finanças', 'Serviços de contabilidade, auditoria e consultoria financeira', 'calculator'),
('Construção Civil', 'Obras, remodelações e projetos de construção', 'building'),
('Educação e Formação', 'Cursos, workshops e formações profissionais', 'book'),
('Saúde e Bem-estar', 'Serviços médicos, clínicas e fisioterapia', 'heart'),
('Marketing e Publicidade', 'Design, branding, gestão de redes sociais', 'megaphone'),
('Logística e Transportes', 'Transporte, entregas e armazenamento', 'truck'),
('Consultoria Empresarial', 'Consultoria de gestão, estratégia e expansão', 'briefcase'),
('Jurídico e Legal', 'Advogados, notários e serviços jurídicos', 'scale'),
('Alimentação e Restauração', 'Restaurantes, catering e serviços de alimentação', 'utensils')
ON DUPLICATE KEY UPDATE nome=nome;

-- ─── CURSOS ───────────────────────────────────────────────────────────────────
INSERT INTO courses (id, nome, descricao, preco, duracao, categoria, nivel, status, created_by) VALUES
(1, 'Informática Básica', 'Fundamentos de informática: Windows, Word, Excel e Internet. Curso ideal para quem começa do zero.', 15000.00, '3 meses', 'Tecnologia', 'basico', 'ativo', 1),
(2, 'Programação Web', 'HTML, CSS, JavaScript e criação de websites modernos. Aprenda a construir sites profissionais.', 25000.00, '6 meses', 'Tecnologia', 'intermedio', 'ativo', 1),
(3, 'Electricidade Industrial', 'Instalações elétricas industriais e domésticas. Normas de segurança e certificação.', 20000.00, '4 meses', 'Engenharia', 'intermedio', 'ativo', 1),
(4, 'Contabilidade Geral', 'Princípios de contabilidade, lançamentos, balanços e relatórios financeiros.', 18000.00, '5 meses', 'Finanças', 'basico', 'ativo', 1),
(5, 'Mecânica Automóvel', 'Manutenção e reparação de veículos ligeiros. Motor, travões, suspensão e diagnóstico.', 22000.00, '6 meses', 'Mecânica', 'intermedio', 'ativo', 1),
(6, 'Canalização e Saneamento', 'Instalações hidráulicas, saneamento básico e manutenção de sistemas de água.', 16000.00, '3 meses', 'Construção', 'basico', 'ativo', 1),
(7, 'Design Gráfico', 'Adobe Photoshop, Illustrator e Canva. Criação de logotipos, flyers e identidade visual.', 20000.00, '4 meses', 'Arte e Design', 'basico', 'ativo', 1),
(8, 'Inglês para Negócios', 'Inglês profissional para o ambiente corporativo. Comunicação, escrita e apresentações.', 12000.00, '3 meses', 'Línguas', 'intermedio', 'ativo', 1),
(9, 'Gestão de Empresas', 'Fundamentos de gestão, liderança, empreendedorismo e plano de negócios.', 30000.00, '6 meses', 'Gestão', 'avancado', 'ativo', 1),
(10, 'Soldadura e Serralharia', 'Técnicas de soldadura MIG, TIG, elétrica e corte de metais. Segurança no trabalho.', 18000.00, '4 meses', 'Metalurgia', 'basico', 'ativo', 1)
ON DUPLICATE KEY UPDATE id=id;

-- ─── CENTROS DE FORMAÇÃO ──────────────────────────────────────────────────────
INSERT INTO training_centers (id, nome, provincia, municipio, endereco, email, telefone, whatsapp, status, created_by) VALUES
(1, 'Centro de Formação Luanda Norte', 'Luanda', 'Luanda', 'Rua Amilcar Cabral, Bairro Ingombota', 'cfln@ulezixpb.com', '+244922100001', '+244922100001', 'ativo', 1),
(2, 'Instituto Técnico de Viana', 'Luanda', 'Viana', 'Avenida Principal, Km 10, Viana', 'itviana@ulezixpb.com', '+244922200002', '+244922200002', 'ativo', 1),
(3, 'Centro Profissional Cacuaco', 'Luanda', 'Cacuaco', 'Rua das Acácias, Bairro Cacuaco', 'cpcacuaco@ulezixpb.com', '+244922300003', '+244922300003', 'ativo', 1),
(4, 'Escola Técnica do Huambo', 'Huambo', 'Huambo', 'Avenida do Técnico, Centro', 'ethuambo@ulezixpb.com', '+244922400004', '+244922400004', 'ativo', 1),
(5, 'Centro de Formação Bengo', 'Bengo', 'Caxito', 'Rua Central, Caxito', 'cfbengo@ulezixpb.com', '+244922500005', '+244922500005', 'ativo', 1)
ON DUPLICATE KEY UPDATE id=id;

-- ─── CURSOS POR CENTRO ────────────────────────────────────────────────────────
INSERT IGNORE INTO center_courses (center_id, course_id) VALUES
(1,1),(1,2),(1,4),(1,7),(1,8),(1,9),
(2,1),(2,3),(2,5),(2,6),(2,10),
(3,1),(3,2),(3,3),(3,4),(3,7),(3,9),
(4,3),(4,5),(4,6),(4,10),
(5,1),(5,4),(5,6);

-- ─── ASSINATURA DEMO PARA TECHCORP ───────────────────────────────────────────
INSERT INTO subscriptions (company_id, plano, valor, data_inicio, data_fim, status, created_by) VALUES
(1, 'anual', 50000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ativa', 1)
ON DUPLICATE KEY UPDATE company_id=company_id;

-- ─── SERVIÇOS DA TECHCORP ────────────────────────────────────────────────────
INSERT IGNORE INTO company_services (company_id, category_id, descricao) VALUES
(1, 1, 'Desenvolvimento de software, websites e aplicações móveis'),
(1, 6, 'Marketing digital, SEO e gestão de redes sociais');

-- ─── OPORTUNIDADE DE INVESTIMENTO DEMO ───────────────────────────────────────
INSERT INTO investment_opportunities (id, company_id, tipo, titulo, descricao, valor, moeda, dados_especificos, status) VALUES
(1, 1, 'participacao',
 'Venda de 30% de Participação na TechCorp Angola',
 'A TechCorp Angola é uma empresa de tecnologia fundada em 2020, com crescimento de 40% ao ano. Procuramos um investidor estratégico para financiar a expansão para Huambo, Benguela e Cabinda. O investidor terá acesso ao conselho de administração e relatórios mensais.',
 5000000.00, 'Kz',
 '{"percentagem": "30%", "prazo_retorno": "3 anos", "retorno_esperado": "25% ao ano", "garantias": "Activos da empresa avaliados em 20M Kz", "direitos": "Acesso ao conselho de administração"}',
 'ativa')
ON DUPLICATE KEY UPDATE id=id;

-- ─── VAGA DE EMPREGO DEMO ─────────────────────────────────────────────────────
INSERT INTO job_postings (titulo, empresa, descricao, requisitos, localizacao, tipo, salario, contacto, status, admin_id) VALUES
('Desenvolvedor Web Full Stack', 'TechCorp Angola',
 'Procuramos um desenvolvedor web motivado para integrar a nossa equipa em expansão. Trabalhará em projetos inovadores de transformação digital para clientes em Angola.',
 'React.js, Node.js, MySQL. Mínimo 2 anos de experiência. Inglês básico.',
 'Luanda, Angola', 'efetivo', '150.000 - 250.000 Kz/mês', 'rh@techcorp.ao', 'ativa', 1),
('Designer Gráfico Júnior', 'Ulezi XPB',
 'Vaga para designer gráfico para criação de conteúdo digital, identidade visual e materiais de marketing.',
 'Adobe Photoshop, Illustrator, Canva. Portfolio obrigatório.',
 'Luanda, Angola', 'efetivo', '80.000 - 120.000 Kz/mês', 'rh@ulezixpb.com', 'ativa', 1)
ON DUPLICATE KEY UPDATE titulo=titulo;

-- ─── NOTIFICAÇÃO DE BOAS-VINDAS PARA ADMIN ───────────────────────────────────
INSERT INTO notifications (user_id, tipo, titulo, mensagem) VALUES
(1, 'sistema', 'Sistema instalado com sucesso!', 'O sistema Ulezi XPB está operacional. Bem-vindo ao painel administrativo.');

SELECT 'Seed executado com sucesso!' as resultado;

-- ─── CONFIGURAÇÕES INICIAIS DO SISTEMA ───────────────────────────────────────
INSERT IGNORE INTO system_settings (chave, valor, descricao) VALUES
('nome_plataforma',    'ULEZI XPB',            'Nome da plataforma'),
('email_contacto',     'info@ulezi.com',         'Email de contacto'),
('telefone_contacto',  '+244 923 000 000',       'Telefone de contacto'),
('site_url',           'https://ulezi.com',       'URL do site'),
('notif_novas_inscricoes', '1',  'Notificar novas inscrições'),
('notif_novas_empresas',   '1',  'Notificar novas empresas'),
('notif_novos_investimentos', '1', 'Notificar novos interesses'),
('notif_por_email',    '0',  'Enviar notificações por email'),
('notif_por_whatsapp', '0',  'Enviar notificações por WhatsApp'),
('2fa_admin',          '0',  'Autenticação dois fatores para admins'),
('bloqueio_tentativas','1',  'Bloquear conta após 5 tentativas'),
('auditoria_ativa',    '1',  'Registar todas as acções administrativas');
