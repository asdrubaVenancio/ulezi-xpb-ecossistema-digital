-- --------------------------------------------------------
-- Anfitrião:                    127.0.0.1
-- Versão do servidor:           8.0.39 - MySQL Community Server - GPL
-- SO do servidor:               Win64
-- HeidiSQL Versão:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- A despejar estrutura da base de dados para ulezi2_xpb
CREATE DATABASE IF NOT EXISTS `u200635986_ulezi2_xpb` 

USE `u200635986_ulezi2_xpb`;

-- A despejar estrutura para tabela ulezi2_xpb.audit_logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `acao` varchar(100) NOT NULL,
  `entidade` varchar(100) DEFAULT NULL,
  `entidade_id` int unsigned DEFAULT NULL,
  `dados` json DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_acao` (`acao`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.audit_logs: ~113 rows (aproximadamente)
INSERT INTO `audit_logs` (`id`, `user_id`, `acao`, `entidade`, `entidade_id`, `dados`, `ip`, `user_agent`, `created_at`) VALUES
	(1, 1, 'LOGIN', 'users', 1, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-28 00:32:08'),
	(2, 1, 'LOGIN', 'users', 1, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 01:53:29'),
	(3, 1, 'CREATE_COURSE', 'courses', 11, '{"nome": "Ingles Nivel 1"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 01:55:36'),
	(4, 1, 'UPDATE_COURSE', 'courses', 11, '{"nome": "Ingles Nivel 1", "nivel": "basico", "preco": "15000.00", "descricao": "Primeiros possos da lingua inglesa para todas as idades", "duracao_horas": "80"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 01:56:17'),
	(5, 1, 'UPDATE_COURSE', 'courses', 11, '{"ativo": false}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 01:56:30'),
	(6, 3, 'LOGIN', 'users', 3, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-30 02:15:05'),
	(7, 3, 'LOGIN', 'users', 3, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 11:06:09'),
	(8, 1, 'UPDATE_COURSE', 'courses', 11, '{"nome": "Ingles Nivel 1", "categoria": "Idioma"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 16:43:37'),
	(9, 1, 'UPDATE_COURSE', 'courses', 11, '{"ativo": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 16:43:43'),
	(10, 1, 'LOGIN', 'users', 1, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 17:12:27'),
	(11, 1, 'CREATE_TRAINING_CENTER', 'training_centers', 6, '{"nome": "SolutionCenter", "municipio": "Viana", "provincia": "Luanda"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 17:55:36'),
	(12, 1, 'UPDATE_TRAINING_CENTER', 'training_centers', 6, '{"campos_atualizados": ["nome", "provincia", "municipio", "endereco", "email", "telefone", "descricao"]}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 18:12:00'),
	(13, 1, 'ASSOCIATE_COURSES_CENTER', 'center_courses', 6, '{"total": 1, "cursos_associados": [11]}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 18:21:48'),
	(14, 1, 'DELETE_TRAINING_CENTER', 'training_centers', 1, '{"nome": "Centro de Formação Luanda Norte"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 18:27:52'),
	(15, 1, 'CREATE_TRAINING_OFFERING', 'training_center_courses', 8191, '{"preco": 15, "center_id": "2", "course_id": "11", "certificado_exigido": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 19:01:04'),
	(16, 1, 'CREATE_TRAINING_OFFERING', 'training_center_courses', 8400, '{"preco": 30000, "center_id": "6", "course_id": "8", "certificado_exigido": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 19:23:36'),
	(17, 3, 'CHANGE_PASSWORD', 'users', 3, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-30 19:50:13'),
	(18, 3, 'UPDATE_PROFILE', 'users', 3, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-30 19:50:39'),
	(19, 1, 'CREATE_BANK_COORD', 'bank_coordinates', 1, '{"tipo": "CONTA_BANCARIA", "titulo": "Conta Principal"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-30 23:42:42'),
	(20, 3, 'CREATE_ENROLLMENT', 'enrollments', 2, '{"course_id": 3, "offering_id": 52, "numero_inscricao": "UXB-2026-79765"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-31 01:21:40'),
	(21, 1, 'APPROVE_ENROLLMENT', 'enrollments', 2, '{"motivo_rejeicao": null}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-31 01:23:29'),
	(22, 1, 'UPDATE_TRAINING_OFFERING', 'training_center_courses', 43, '{"campos_atualizados": ["center_id", "course_id", "preco", "carga_horaria", "certificado_exigido", "especificacoes"]}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-31 06:26:13'),
	(23, 3, 'CREATE_ENROLLMENT', 'enrollments', 3, '{"course_id": 4, "offering_id": 43, "numero_inscricao": "UXB-2026-28919"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-03-31 06:28:46'),
	(24, 6, 'REGISTER', 'users', 6, '{"role": "company", "email": "agidrubadeve@gmail.com"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 13:30:47'),
	(25, 6, 'LOGIN', 'users', 6, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 13:50:50'),
	(26, 6, 'UPLOAD_DOCUMENT', 'company_documents', 2, '{"tipo": "nif"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 14:02:39'),
	(27, 6, 'UPDATE_DOCUMENT', 'company_documents', 2, '{"tipo": "nif"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 14:37:55'),
	(28, 6, 'UPDATE_DOCUMENT', 'company_documents', 5, '{"tipo": "nif"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 14:52:05'),
	(29, 1, 'UPDATE_PACKAGE', 'subscription_packages', 1, '{"nome": "Básico", "slug": "basico", "moeda": "AOA", "ordem": 1, "preco": 50000, "descricao": "Plano básico para presença inicial na plataforma.", "beneficios": ["Perfil público", "Vagas de emprego", "Venda de serviços ilimitada."], "duracao_dias": 30, "duracao_meses": 6, "max_vagas_ativas": 5, "suporte_prioritario": false, "consultorias_incluidas": 0, "max_oportunidades_ativas": 10, "publicacoes_vagas_ilimitadas": false, "publicacoes_oportunidades_ilimitadas": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 21:12:48'),
	(30, 1, 'UPDATE_PACKAGE', 'subscription_packages', 1, '{"nome": "Básico", "slug": "basico", "moeda": "AOA", "ordem": 1, "preco": 50000, "descricao": "Plano básico para presença inicial na plataforma.", "beneficios": ["Perfil público", "Vagas de emprego", "Venda de serviços ilimitada."], "duracao_dias": 183, "duracao_meses": 6, "max_vagas_ativas": 5, "suporte_prioritario": false, "consultorias_incluidas": 3, "max_oportunidades_ativas": 10, "publicacoes_vagas_ilimitadas": false, "publicacoes_oportunidades_ilimitadas": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 21:14:54'),
	(31, 1, 'CREATE_PACKAGE', 'subscription_packages', 2, '{"nome": "Proficional", "slug": "profissional", "status": "ativo"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 21:37:34'),
	(32, 1, 'UPDATE_PACKAGE', 'subscription_packages', 1, '{"nome": "Básico", "slug": "basico", "moeda": "AOA", "ordem": 1, "preco": 10000, "descricao": "Plano básico para presença inicial na plataforma.", "beneficios": ["Perfil público", "Vagas de emprego", "Venda de serviços ilimitada."], "duracao_dias": 30, "duracao_meses": 1, "max_vagas_ativas": 5, "suporte_prioritario": false, "consultorias_incluidas": 5, "max_oportunidades_ativas": 5, "publicacoes_vagas_ilimitadas": false, "publicacoes_oportunidades_ilimitadas": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 21:38:23'),
	(33, 7, 'REGISTER', 'users', 7, '{"role": "company", "email": "asdrubadeve@gmail.com"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 21:43:17'),
	(34, 1, 'REJECT_COMPANY', 'company_profiles', 3, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 21:45:02'),
	(35, 7, 'LOGIN', 'users', 7, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 21:46:02'),
	(36, 7, 'CREATE_SUBSCRIPTION_PENDING', 'subscriptions', 2, '{"valor": "10000.00", "package_id": 1}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 22:20:39'),
	(37, 7, 'CREATE_SUBSCRIPTION_WITH_PROOF', 'subscriptions', 3, '{"package_id": "1", "comprovante_url": "/uploads/payments/payments-1775083179330-263211628.pdf", "referencia_pagamento": "ASS-1775083162192"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-01 23:39:39'),
	(38, 1, 'APPROVE_SUBSCRIPTION', 'subscriptions', 3, '{"status": "ativa"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-01 23:40:29'),
	(39, 1, 'REJECT_COMPANY', 'company_profiles', 3, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 09:46:33'),
	(40, 7, 'vaga_criada', 'company_job_postings', 1, '{"titulo": "Técnico de Informática"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-02 09:58:38'),
	(41, 7, 'CREATE_OPPORTUNITY', 'investment_opportunities', 2, '{"tipo": "participacao", "titulo": "Vendo 50% da minha empresa"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-02 11:38:24'),
	(42, 8, 'REGISTER', 'users', 8, '{"role": "investor", "email": "maiervenancio@gmail.com"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-02 12:21:37'),
	(43, 8, 'LOGIN', 'users', 8, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-02 12:22:22'),
	(44, 1, 'APPROVE_ENROLLMENT', 'enrollments', 3, '{"motivo_rejeicao": null}', NULL, NULL, '2026-04-02 17:28:30'),
	(45, 8, 'LOGIN', 'users', 8, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-02 20:57:27'),
	(46, 1, 'CREATE_EMPLOYEE', 'employees', 1, '{"nome": "Bartolomeu Orlando", "cargo": "Gestor Operacional", "email": "kulonga2025@gmail.com"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 22:27:29'),
	(47, 9, 'LOGIN', 'users', 9, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 22:30:15'),
	(48, 9, 'CHANGE_PASSWORD', 'users', 9, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 22:30:57'),
	(49, 8, 'EXPRESS_INTEREST', 'investor_interests', 1, '{"opportunityId": "2"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-02 22:35:25'),
	(50, 9, 'SCHEDULE_MEETING', 'scheduled_meetings', 2, '{"mediation_id": "1"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 22:45:21'),
	(51, 9, 'SCHEDULE_MEETING', 'scheduled_meetings', 3, '{"mediation_id": "1"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-02 22:45:23'),
	(52, 1, 'CANCEL_MEETING', 'scheduled_meetings', 1, '{"motivo": "Imprevisto operacional.", "mediation_id": "1"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 00:21:57'),
	(53, 1, 'CANCEL_MEETING', 'scheduled_meetings', 2, '{"motivo": "Imprevisto operacional.", "mediation_id": "1"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 00:24:52'),
	(54, 1, 'RESCHEDULE_MEETING', 'scheduled_meetings', 3, '{"mediation_id": "1"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 00:26:48'),
	(55, 1, 'UPDATE_MEDIATION', 'mediations', 1, '{"employee_id": 1, "mediator_user_id": 9}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 07:42:05'),
	(56, 9, 'UPDATE_MEDIATION', 'mediations', 1, '{"employee_id": 1, "etapa_atual": "reuniao_inicial", "mediator_user_id": 9}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 07:43:44'),
	(57, 9, 'COMPLETE_MEDIATION', 'mediations', 1, '{"resultado_final": "sucesso"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 07:43:49'),
	(58, 8, 'EXPRESS_INTEREST', 'investor_interests', 2, '{"opportunityId": "1"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-03 22:33:18'),
	(59, 9, 'SCHEDULE_MEETING', 'scheduled_meetings', 4, '{"mediation_id": "2"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:36:58'),
	(60, 9, 'RESCHEDULE_MEETING', 'scheduled_meetings', 4, '{"mediation_id": "2"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:37:51'),
	(61, 9, 'RESCHEDULE_MEETING', 'scheduled_meetings', 4, '{"mediation_id": "2"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:39:05'),
	(62, 9, 'RESCHEDULE_MEETING', 'scheduled_meetings', 4, '{"mediation_id": "2"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:39:35'),
	(63, 9, 'RESCHEDULE_MEETING', 'scheduled_meetings', 4, '{"avisos_email": [], "mediation_id": "2"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:49:30'),
	(64, 7, 'LOGIN', 'users', 7, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-03 22:52:10'),
	(65, 7, 'CREATE_OPPORTUNITY', 'investment_opportunities', 3, '{"tipo": "investimento", "titulo": "Procura de investimento"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-03 22:54:58'),
	(66, 8, 'EXPRESS_INTEREST', 'investor_interests', 3, '{"opportunityId": "3"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-03 22:55:32'),
	(67, 9, 'UPDATE_MEDIATION', 'mediations', 3, '{"employee_id": 1, "etapa_atual": "triagem", "mediator_user_id": 9}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:57:06'),
	(68, 9, 'SCHEDULE_MEETING', 'scheduled_meetings', 5, '{"avisos_email": [], "mediation_id": "3"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 22:58:30'),
	(69, 9, 'COMPLETE_MEDIATION', 'mediations', 3, '{"contract_id": 1, "resultado_final": "sucesso"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-03 23:08:47'),
	(70, 9, 'COMPLETE_MEDIATION', 'mediations', 2, '{"contract_id": null, "resultado_final": "insucesso"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 05:19:06'),
	(71, 7, 'UPDATE_PROFILE', 'users', 7, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-05 08:54:19'),
	(72, 7, 'UPDATE_PROFILE', 'users', 7, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-05 08:54:42'),
	(73, 7, 'servico_empresa_criado', 'company_services', 3, '{"category_id": "10"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-05 10:30:31'),
	(74, 7, 'vaga_editada', 'company_job_postings', 1, '{"titulo": "Técnico de Informática"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-05 18:39:58'),
	(75, 1, 'LOGIN', 'users', 1, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-05 20:58:01'),
	(76, 1, 'CREATE_TRAINING_CENTER', 'training_centers', 7, '{"nome": "Ulezi Center", "municipio": "Viana", "provincia": "Luanda"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-05 21:07:17'),
	(77, 1, 'APPROVE_COMPANY', 'company_profiles', 2, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-05 21:27:36'),
	(78, 1, 'CREATE_COURSE', 'courses', 12, '{"nome": "Soldadura Industrial"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-05 23:54:38'),
	(79, 1, 'CREATE_TRAINING_OFFERING', 'training_center_courses', 13619, '{"preco": 15, "center_id": 7, "course_id": "12", "modalidade": "presencial", "certificado_exigido": false}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 00:18:29'),
	(80, 1, 'CREATE_TRAINING_OFFERING', 'training_center_courses', 13620, '{"preco": 60, "center_id": 7, "course_id": "2", "modalidade": "presencial", "certificado_exigido": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 00:19:42'),
	(81, 1, 'CREATE_TRAINING_OFFERING', 'training_center_courses', 13621, '{"preco": 25, "center_id": "5", "course_id": "12", "modalidade": "presencial", "certificado_exigido": true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 00:23:53'),
	(82, 1, 'CREATE_TRAINING_OFFERING', 'training_center_courses', 13622, '{"preco": 6, "center_id": "6", "course_id": "1", "modalidade": "online", "certificado_exigido": false}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 00:49:44'),
	(83, 10, 'REGISTER', 'users', 10, '{"role": "investor", "email": "maiertenta@gmail.com"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:38:14'),
	(84, 10, 'LOGIN', 'users', 10, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:38:40'),
	(85, 7, 'CREATE_OPPORTUNITY', 'investment_opportunities', 4, '{"tipo": "franquia", "titulo": "Expansão por Fanquia"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 08:43:28'),
	(86, 10, 'EXPRESS_INTEREST', 'investor_interests', 4, '{"opportunityId": "4"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:44:29'),
	(87, 9, 'UPDATE_MEDIATION', 'mediations', 4, '{"employee_id": 1, "etapa_atual": "triagem", "mediator_user_id": 9}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:47:03'),
	(88, 9, 'SCHEDULE_MEETING', 'scheduled_meetings', 6, '{"avisos_email": [], "mediation_id": "4"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:50:57'),
	(89, 9, 'COMPLETE_MEDIATION', 'mediations', 4, '{"contract_id": 2, "resultado_final": "sucesso"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:55:02'),
	(90, 10, 'SIGN_CONTRACT', 'contracts', 2, '{"status": "assinado_investidor"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 08:56:51'),
	(91, 7, 'SIGN_CONTRACT', 'contracts', 1, '{"status": "assinado_empresa"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 08:57:00'),
	(92, 1, 'RUN_AUTO_RENEWALS', 'subscriptions', NULL, '{"count": 0}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 10:04:22'),
	(93, 1, 'RUN_EXPIRATION_CHECK', 'subscription_notifications', NULL, '{"count": 0}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 10:04:32'),
	(94, 1, 'CREATE_EMPLOYEE', 'employees', 2, '{"nome": "Carlo Henrique", "cargo": "Agente de Suporte", "email": "asdrubavenancio@yahoo.com"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 12:40:11'),
	(95, 1, 'UPDATE_EMPLOYEE', 'employees', 2, '{"nome": "Carlo Henrique", "cargo": "Agente de Suporte", "email": "asdrubavenancio@yahoo.com", "departamento": "Suporte"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 12:44:07'),
	(96, 1, 'CREATE_EMPLOYEE', 'employees', 3, '{"nome": "Carlos Henriques", "cargo": "Secretario", "email": "asdrubavenancio@yahoo.com"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 13:03:34'),
	(97, 8, 'SIGN_CONTRACT', 'contracts', 1, '{"status": "assinado_ambos"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-06 13:07:08'),
	(98, 12, 'LOGIN', 'users', 12, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-06 13:09:03'),
	(99, 12, 'CHANGE_PASSWORD', 'users', 12, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-06 13:09:52'),
	(100, 13, 'REGISTER', 'users', 13, '{"role": "company", "email": "solimpo@gmail.com"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 13:54:22'),
	(101, 13, 'LOGIN', 'users', 13, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 13:54:54'),
	(102, 1, 'APPROVE_COMPANY', 'company_profiles', 4, '{}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 13:57:22'),
	(103, 13, 'CREATE_SUBSCRIPTION_WITH_PROOF', 'subscriptions', 4, '{"package_id": "1", "comprovante_url": "/uploads/payments/payments-1775480402657-542364636.pdf", "referencia_pagamento": "ASS-1775480340063"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 14:00:02'),
	(104, 1, 'APPROVE_SUBSCRIPTION', 'subscriptions', 4, '{"status": "ativa"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:03:17'),
	(105, 7, 'LOGIN', 'users', 7, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 14:14:21'),
	(106, 7, 'CREATE_OPPORTUNITY', 'investment_opportunities', 5, '{"tipo": "licenciamento", "titulo": "Licenciamento de Marca"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 14:21:14'),
	(107, 10, 'LOGIN', 'users', 10, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:23:21'),
	(108, 10, 'EXPRESS_INTEREST', 'investor_interests', 5, '{"opportunityId": "5"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:24:34'),
	(109, 9, 'SCHEDULE_MEETING', 'scheduled_meetings', 7, '{"avisos_email": [], "mediation_id": "5"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:34:03'),
	(110, 9, 'UPDATE_MEDIATION', 'mediations', 5, '{"employee_id": 1, "etapa_atual": "reuniao_inicial", "mediator_user_id": 9}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:36:10'),
	(111, 9, 'COMPLETE_MEDIATION', 'mediations', 5, '{"contract_id": 3, "resultado_final": "sucesso"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:36:58'),
	(112, 10, 'SIGN_CONTRACT', 'contracts', 3, '{"status": "assinado_investidor"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-06 14:38:32'),
	(113, 7, 'SIGN_CONTRACT', 'contracts', 3, '{"status": "assinado_ambos"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-06 14:40:56');

-- A despejar estrutura para tabela ulezi2_xpb.bank_coordinates
DROP TABLE IF EXISTS `bank_coordinates`;
CREATE TABLE IF NOT EXISTS `bank_coordinates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tipo` enum('IBAN','MULTICAIXA_EXPRESS','CONTA_BANCARIA','OUTRO') NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `numero` varchar(50) NOT NULL,
  `titular` varchar(200) NOT NULL,
  `banco` varchar(100) DEFAULT NULL,
  `descricao` text,
  `is_active` tinyint(1) DEFAULT '1',
  `ordem` int unsigned DEFAULT '0',
  `created_by` int unsigned NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_ativo` (`is_active`),
  KEY `idx_ordem` (`ordem`),
  CONSTRAINT `bank_coordinates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.bank_coordinates: ~1 rows (aproximadamente)
INSERT INTO `bank_coordinates` (`id`, `tipo`, `titulo`, `numero`, `titular`, `banco`, `descricao`, `is_active`, `ordem`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'CONTA_BANCARIA', 'Conta Principal', '0060000012345678900114', 'Ulezi XPB', 'BAI', NULL, 1, 1, 1, '2026-03-30 23:42:42', '2026-03-30 23:42:42');

-- A despejar estrutura para tabela ulezi2_xpb.center_courses
DROP TABLE IF EXISTS `center_courses`;
CREATE TABLE IF NOT EXISTS `center_courses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `center_id` int unsigned NOT NULL,
  `course_id` int unsigned NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_center_course` (`center_id`,`course_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `center_courses_ibfk_1` FOREIGN KEY (`center_id`) REFERENCES `training_centers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `center_courses_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.center_courses: ~31 rows (aproximadamente)
INSERT INTO `center_courses` (`id`, `center_id`, `course_id`, `created_at`) VALUES
	(1, 1, 1, '2026-03-28 00:01:37'),
	(2, 1, 2, '2026-03-28 00:01:37'),
	(3, 1, 4, '2026-03-28 00:01:37'),
	(4, 1, 7, '2026-03-28 00:01:37'),
	(5, 1, 8, '2026-03-28 00:01:37'),
	(6, 1, 9, '2026-03-28 00:01:37'),
	(7, 2, 1, '2026-03-28 00:01:37'),
	(8, 2, 3, '2026-03-28 00:01:37'),
	(9, 2, 5, '2026-03-28 00:01:37'),
	(10, 2, 6, '2026-03-28 00:01:37'),
	(11, 2, 10, '2026-03-28 00:01:37'),
	(12, 3, 1, '2026-03-28 00:01:37'),
	(13, 3, 2, '2026-03-28 00:01:37'),
	(14, 3, 3, '2026-03-28 00:01:37'),
	(15, 3, 4, '2026-03-28 00:01:37'),
	(16, 3, 7, '2026-03-28 00:01:37'),
	(17, 3, 9, '2026-03-28 00:01:37'),
	(18, 4, 3, '2026-03-28 00:01:37'),
	(19, 4, 5, '2026-03-28 00:01:37'),
	(20, 4, 6, '2026-03-28 00:01:37'),
	(21, 4, 10, '2026-03-28 00:01:37'),
	(22, 5, 1, '2026-03-28 00:01:37'),
	(23, 5, 4, '2026-03-28 00:01:37'),
	(24, 5, 6, '2026-03-28 00:01:37'),
	(25, 6, 11, '2026-03-30 18:21:48'),
	(26, 2, 11, '2026-03-30 19:01:04'),
	(27, 6, 8, '2026-03-30 19:23:36'),
	(28, 7, 12, '2026-04-06 00:18:29'),
	(29, 7, 2, '2026-04-06 00:19:41'),
	(30, 5, 12, '2026-04-06 00:23:53'),
	(31, 6, 1, '2026-04-06 00:49:44');

-- A despejar estrutura para tabela ulezi2_xpb.company_documents
DROP TABLE IF EXISTS `company_documents`;
CREATE TABLE IF NOT EXISTS `company_documents` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `tipo` enum('alvara','nif','certidao','identificacao','outro') NOT NULL,
  `nome_ficheiro` varchar(255) DEFAULT NULL,
  `url_ficheiro` varchar(255) NOT NULL,
  `status_verificacao` enum('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  `verificado_by` int unsigned DEFAULT NULL,
  `verificado_at` datetime DEFAULT NULL,
  `visualizado_at` datetime DEFAULT NULL,
  `visualizado_by` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_tipo` (`company_id`,`tipo`),
  KEY `verificado_by` (`verificado_by`),
  CONSTRAINT `company_documents_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_documents_ibfk_2` FOREIGN KEY (`verificado_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.company_documents: ~12 rows (aproximadamente)
INSERT INTO `company_documents` (`id`, `company_id`, `tipo`, `nome_ficheiro`, `url_ficheiro`, `status_verificacao`, `verificado_by`, `verificado_at`, `visualizado_at`, `visualizado_by`, `created_at`) VALUES
	(1, 2, 'alvara', 'cv_agidruba_copia.pdf', '/uploads/documents/documents-1775046646974-105899007.pdf', 'aprovado', 1, '2026-04-05 21:27:32', '2026-04-05 21:26:09', 1, '2026-04-01 13:30:47'),
	(3, 2, 'certidao', 'cv_agidruba_copia.pdf', '/uploads/documents/documents-1775046646986-759286938.pdf', 'aprovado', 1, '2026-04-05 21:27:32', '2026-04-05 21:27:20', 1, '2026-04-01 13:30:47'),
	(4, 2, 'identificacao', 'cartaDeApresentacaoAliva.pdf', '/uploads/documents/documents-1775046646990-957781503.pdf', 'aprovado', 1, '2026-04-05 21:27:32', '2026-04-05 21:27:24', 1, '2026-04-01 13:30:47'),
	(5, 2, 'nif', 'cartaCopia.pdf', '/uploads/documents/doc_1775051525968-976524886.pdf', 'aprovado', 1, '2026-04-05 21:27:32', '2026-04-05 21:27:15', 1, '2026-04-01 14:02:39'),
	(6, 3, 'alvara', 'cv_agidruba_copia.pdf', '/uploads/documents/documents-1775076197061-94544099.pdf', 'aprovado', NULL, '2026-04-02 09:57:06', NULL, NULL, '2026-04-01 21:43:17'),
	(7, 3, 'nif', 'cartaCopia.pdf', '/uploads/documents/documents-1775076197065-215815664.pdf', 'aprovado', NULL, '2026-04-02 09:57:06', NULL, NULL, '2026-04-01 21:43:17'),
	(8, 3, 'certidao', 'cv_agidruba_Aliva.pdf', '/uploads/documents/documents-1775076197066-737954089.pdf', 'aprovado', NULL, '2026-04-02 09:57:06', NULL, NULL, '2026-04-01 21:43:17'),
	(9, 3, 'identificacao', 'cartaCopia.pdf', '/uploads/documents/documents-1775076197079-494267101.pdf', 'aprovado', NULL, '2026-04-02 09:57:06', NULL, NULL, '2026-04-01 21:43:17'),
	(10, 4, 'alvara', 'cartaCopia.pdf', '/uploads/documents/documents-1775480062225-879691109.pdf', 'aprovado', 1, '2026-04-06 13:57:19', '2026-04-06 13:56:45', 1, '2026-04-06 13:54:22'),
	(11, 4, 'nif', 'cartaDeApresentacaoAliva.pdf', '/uploads/documents/documents-1775480062236-875359875.pdf', 'aprovado', 1, '2026-04-06 13:57:19', '2026-04-06 13:56:51', 1, '2026-04-06 13:54:22'),
	(12, 4, 'certidao', 'cv_agidruba_Aliva.pdf', '/uploads/documents/documents-1775480062239-43558364.pdf', 'aprovado', 1, '2026-04-06 13:57:19', '2026-04-06 13:56:56', 1, '2026-04-06 13:54:22'),
	(13, 4, 'identificacao', 'cartaDeApresentacaoAliva.pdf', '/uploads/documents/documents-1775480062247-825395253.pdf', 'aprovado', 1, '2026-04-06 13:57:19', '2026-04-06 13:57:01', 1, '2026-04-06 13:54:22');

-- A despejar estrutura para tabela ulezi2_xpb.company_job_postings
DROP TABLE IF EXISTS `company_job_postings`;
CREATE TABLE IF NOT EXISTS `company_job_postings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `requisitos` text,
  `localizacao` varchar(200) DEFAULT NULL,
  `tipo` enum('efetivo','temporario','estagio','freelance') DEFAULT 'efetivo',
  `salario` varchar(100) DEFAULT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `status` enum('pendente','aprovada','rejeitada','encerrada') DEFAULT 'pendente',
  `motivo_rejeicao` text,
  `aprovado_by` int unsigned DEFAULT NULL,
  `aprovado_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aprovado_by` (`aprovado_by`),
  KEY `idx_status` (`status`),
  KEY `idx_company` (`company_id`),
  CONSTRAINT `company_job_postings_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_job_postings_ibfk_2` FOREIGN KEY (`aprovado_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.company_job_postings: ~1 rows (aproximadamente)
INSERT INTO `company_job_postings` (`id`, `company_id`, `titulo`, `descricao`, `requisitos`, `localizacao`, `tipo`, `salario`, `contacto`, `status`, `motivo_rejeicao`, `aprovado_by`, `aprovado_at`, `created_at`, `expires_at`) VALUES
	(1, 3, 'Técnico de Informática', 'Precisa-se de um Técnico de Informa para fazer parte da nossa empresa', 'Formação em Informática ou em área similar', 'Luanda-Viana', 'efetivo', '', 'asdrubadeve@gmail.com', 'aprovada', NULL, NULL, '2026-04-02 10:38:33', '2026-04-02 09:58:38', '2026-05-05 17:39:00');

-- A despejar estrutura para tabela ulezi2_xpb.company_profiles
DROP TABLE IF EXISTS `company_profiles`;
CREATE TABLE IF NOT EXISTS `company_profiles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `nome_empresa` varchar(200) NOT NULL,
  `nif` varchar(50) DEFAULT NULL,
  `descricao` text,
  `sector` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `endereco` text,
  `website` varchar(255) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT '0',
  `approved_by` int unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `motivo_rejeicao` text,
  `is_public` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status_verificacao` enum('pendente','em_analise','aprovado_visita','reprovado_visita') DEFAULT 'pendente',
  `visita_verificacao_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `nif` (`nif`),
  UNIQUE KEY `idx_nif_unico` (`nif`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_approved` (`is_approved`),
  KEY `idx_sector` (`sector`),
  KEY `idx_nif` (`nif`),
  CONSTRAINT `company_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_profiles_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.company_profiles: ~4 rows (aproximadamente)
INSERT INTO `company_profiles` (`id`, `user_id`, `nome_empresa`, `nif`, `descricao`, `sector`, `provincia`, `municipio`, `endereco`, `website`, `is_approved`, `approved_by`, `approved_at`, `motivo_rejeicao`, `is_public`, `created_at`, `updated_at`, `status_verificacao`, `visita_verificacao_id`) VALUES
	(1, 5, 'TechCorp Angola Lda', '5000000001', 'Empresa líder em tecnologia e soluções digitais em Angola.', 'Tecnologia', 'Luanda', 'Luanda', NULL, NULL, 1, NULL, NULL, NULL, 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37', 'pendente', NULL),
	(2, 6, 'Filma Tchissola e Filho', '000123456789', NULL, 'Tecnologia, Alimentacao e Restauracao, Marketing e Publicidade', 'Luanda', 'Viana', NULL, NULL, 1, 1, '2026-04-05 21:27:32', NULL, 1, '2026-04-01 13:30:47', '2026-04-05 21:27:32', 'aprovado_visita', NULL),
	(3, 7, 'VayaSoft', '007041257', NULL, 'Tecnologia, Educacao, Consultoria Empresarial, Jurídico e Legal', 'Luanda', 'Viana', NULL, NULL, 1, 1, '2026-04-02 09:55:51', NULL, 1, '2026-04-01 21:43:17', '2026-04-05 08:54:42', 'aprovado_visita', NULL),
	(4, 13, 'Solimpo', '005098356', NULL, 'Tecnologia, Consultoria Empresarial, Marketing e Publicidade', 'Ico e Bengo', 'Calumbo', NULL, NULL, 1, 1, '2026-04-06 13:57:19', NULL, 1, '2026-04-06 13:54:22', '2026-04-06 13:57:19', 'aprovado_visita', NULL);

-- A despejar estrutura para tabela ulezi2_xpb.company_services
DROP TABLE IF EXISTS `company_services`;
CREATE TABLE IF NOT EXISTS `company_services` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  `descricao` text,
  `contacto_email` varchar(255) DEFAULT NULL,
  `contacto_whatsapp` varchar(50) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company_service` (`company_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `company_services_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_services_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.company_services: ~3 rows (aproximadamente)
INSERT INTO `company_services` (`id`, `company_id`, `category_id`, `descricao`, `contacto_email`, `contacto_whatsapp`, `ativo`, `created_at`) VALUES
	(1, 1, 1, 'Desenvolvimento de software, websites e aplicações móveis', NULL, NULL, 1, '2026-03-28 00:01:37'),
	(2, 1, 6, 'Marketing digital, SEO e gestão de redes sociais', NULL, NULL, 1, '2026-03-28 00:01:37'),
	(3, 3, 10, 'Venda e entrega  de magoga ', 'asdrubadeve@gmail.com', '928417014', 1, '2026-04-05 10:30:31');

-- A despejar estrutura para tabela ulezi2_xpb.company_visits
DROP TABLE IF EXISTS `company_visits`;
CREATE TABLE IF NOT EXISTS `company_visits` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `employee_id` int unsigned NOT NULL,
  `data_visita` date NOT NULL,
  `hora_visita` time DEFAULT NULL,
  `endereco_visita` varchar(255) DEFAULT NULL,
  `status` enum('agendada','confirmada','realizada','reagendada','cancelada') DEFAULT 'agendada',
  `resultado` enum('pendente','aprovado','reprovado','condicional') DEFAULT 'pendente',
  `observacoes` text,
  `relatorio_visita` text,
  `documentos_verificados` json DEFAULT NULL,
  `fotos_local` varchar(500) DEFAULT NULL,
  `recomendacoes` text,
  `motivo_rejeicao` varchar(500) DEFAULT NULL,
  `requer_segunda_visita` tinyint(1) DEFAULT '0',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_realizacao` timestamp NULL DEFAULT NULL,
  `created_by` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_company_visits_creator` (`created_by`),
  KEY `idx_company_visits_company` (`company_id`),
  KEY `idx_company_visits_employee` (`employee_id`),
  KEY `idx_company_visits_status` (`status`),
  CONSTRAINT `fk_company_visits_company` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_visits_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_company_visits_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.company_visits: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.consultancy_requests
DROP TABLE IF EXISTS `consultancy_requests`;
CREATE TABLE IF NOT EXISTS `consultancy_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `requester_id` int unsigned NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `descricao` text NOT NULL,
  `status` enum('pendente','em_analise','aprovado','concluido','rejeitado') DEFAULT 'pendente',
  `pago` tinyint(1) DEFAULT '0',
  `valor` decimal(10,2) DEFAULT '0.00',
  `resposta` text,
  `atendido_by` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `requester_id` (`requester_id`),
  KEY `atendido_by` (`atendido_by`),
  CONSTRAINT `consultancy_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultancy_requests_ibfk_2` FOREIGN KEY (`atendido_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.consultancy_requests: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.consultations
DROP TABLE IF EXISTS `consultations`;
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  `tipo_consultoria` varchar(120) NOT NULL,
  `tema` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `preferencia_data` date DEFAULT NULL,
  `preferencia_horario` varchar(50) DEFAULT NULL,
  `duracao_solicitada` int DEFAULT '60',
  `data_agendada` date DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fim` time DEFAULT NULL,
  `duracao_minutos` int DEFAULT NULL,
  `link_reuniao` varchar(255) DEFAULT NULL,
  `local_reuniao` varchar(255) DEFAULT NULL,
  `status` enum('pendente','agendada','confirmada','realizada','cancelada') DEFAULT 'pendente',
  `valor` decimal(12,2) DEFAULT NULL,
  `resumo` text,
  `recomendacoes` text,
  `proximos_passos` text,
  `material_compartilhado` json DEFAULT NULL,
  `motivo_cancelamento` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_consultations_user` (`user_id`),
  KEY `fk_consultations_employee` (`employee_id`),
  CONSTRAINT `fk_consultations_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consultations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.consultations: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.contracts
DROP TABLE IF EXISTS `contracts`;
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `interest_id` int unsigned NOT NULL,
  `opportunity_id` int unsigned NOT NULL,
  `investor_id` int unsigned NOT NULL,
  `company_id` int unsigned NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `conteudo` longtext,
  `pdf_url` varchar(255) DEFAULT NULL,
  `pdf_data` longblob,
  `status` enum('gerado','enviado','assinado_empresa','assinado_investidor','assinado_ambos','cancelado') DEFAULT 'gerado',
  `assinado_empresa` tinyint(1) DEFAULT '0',
  `assinado_investidor` tinyint(1) DEFAULT '0',
  `assinado_empresa_at` datetime DEFAULT NULL,
  `assinado_investidor_at` datetime DEFAULT NULL,
  `enviado_email_empresa` tinyint(1) DEFAULT '0',
  `enviado_email_investidor` tinyint(1) DEFAULT '0',
  `enviado_whatsapp_empresa` tinyint(1) DEFAULT '0',
  `enviado_whatsapp_investidor` tinyint(1) DEFAULT '0',
  `gerado_by` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `interest_id` (`interest_id`),
  KEY `opportunity_id` (`opportunity_id`),
  KEY `investor_id` (`investor_id`),
  KEY `company_id` (`company_id`),
  KEY `gerado_by` (`gerado_by`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`interest_id`) REFERENCES `investor_interests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`opportunity_id`) REFERENCES `investment_opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_ibfk_3` FOREIGN KEY (`investor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_ibfk_4` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_ibfk_5` FOREIGN KEY (`gerado_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.contracts: ~3 rows (aproximadamente)
INSERT INTO `contracts` (`id`, `interest_id`, `opportunity_id`, `investor_id`, `company_id`, `titulo`, `conteudo`, `pdf_url`, `pdf_data`, `status`, `assinado_empresa`, `assinado_investidor`, `assinado_empresa_at`, `assinado_investidor_at`, `enviado_email_empresa`, `enviado_email_investidor`, `enviado_whatsapp_empresa`, `enviado_whatsapp_investidor`, `gerado_by`, `created_at`, `updated_at`) VALUES
	(1, 3, 3, 8, 3, 'Procura de investimento', NULL, NULL, _binary 0x255044462d312e330a25ffffffff0a372030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e74732035203020520a2f5265736f75726365732036203020520a3e3e0a656e646f626a0a362030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a352030206f626a0a3c3c0a2f4c656e67746820313335320a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789ced99cd6edc361080ef7a0abe4094e1fc92c0620f4e7f801e0aa4f1ade821d54a6801bb801ba07dfd62286925ed328d9db6965bd40b78494a2287a319ce37b3314080f02a060889639b72e8ee9b87c607254b8b29640dbff6cdeb2ffadf7eeefaefbebe09dd8706da885134291a0be4049403b42a9c2166054b4c912c406b292109668ed1942d7ce87e69868bc962f08f5f7968624d9c9bdb693c06816039b788186eef9bd75f61400db743f3fd41843b1679cf19419200e331c00fe1f69be6cbdbe6ed23a7b6dce63c4d1d438cd3d4a09d46638daac740100e3a181ec32b9470d0934604651504ae5f56d2a8038280a10eaa9a8d8c34eba0bd46ed10cac359fb63400807d36328cf8a91b1663da9686facc313b7c44a2de79020b516cfbb82715756fe8e41211cb037d14ec5de6bb664a0780c5cc69574d0d393d78d2d69b0cc9575356bbfe891e16f5e995b4ac1125456c61f098989112813122150f9ccdf9bb5de5e993cc8d6984102b464b8b17a1fe3b3538c4ef248db8e9c5ac46020add0d9bc27d99978e05e5890e331640807e151533c203073b120ee4559848439f389c59f98efdaecee726fbc725bdf90efc277b8ec3805680536b7c9633766d2224bd0a495b7c2ac8392c962e5081ff1b3d155f4a4b9b845b9d57ca4731fb44fbb69ed90c0626d1bed0884681cee1be172047ae76eadb337ef3eff087cf7e6db26b6127e6fde350f8d5088795c0acb52d99712d65673421b074460bc66ada46888f3080286ae993a14d11f9d3bda722c33ac262384302de4cdce97f7c65dc3699edafb2ceb094acf1762292bde796325ccf26c1176dc51d7fc746565f9c25b02b4593766865324b8d475bab6cfb471c55486a4a2eb9b1d5c5921284a8bc6b31f479cac3dbbafba5f7266e5cce4fe5c3c74698d1e3dfd671279922f5f9aa5ab19afed9266cd4d9a78c2d600cf7e8c673f165471c78b502297f7fc0ccf1a773c79b26ca45d9d3ae5ac3c86e4de7fa23f97f11fd7a824ae6894793cce66bc988e3e6787a87b9ee75936122f5a2520c581801807420242d29d35ab5ab355f61052c86328da751d0f0673c07008f3cb7d8932d1d5bfb3bab5163a27a0241317bb38de622c4fc5c9e77f359c6a463f4a19c7e8ae977010b5dbf94d700da6394e48dfaf24cf6a8554a27667f9652116a3d28ec5e4b8989cbfa20be2f5084d2b40f0ce06107c600efa740908c42b4060830510d8b802085cba38de904640f0c61a10784482d504a5072320f88a051056c2ace0820a20f85715102e42b003c2127cdd16c7a14df0feaf1003a72a3108084e349f9dfe3d8f74677710883201ac9404004f082c7c2a8f8814a0d8d3c3596ba0c0bd2776e58c1a0f5ed193f949261ed8f6f5eeb5c4ab73568fc1cae93ae6159647ad6b144f52d578673d73151f7a47cc9df5c91fc10420734ca0484842b6b3feb006092c25e7cc7b479cb574ab324a34522eb1234a389828cea0429ba0cfa0366fa45a55797e75432df07b76a32577f07a906712c5c5bc46b6337c71b57e566a48b99870247573de57ab94a16ec4bd5b45c9c768efac612d635c0784521fdd5606b7959febe2a79349c6058cbcb301231f986127cb051809c002468a69012325ac809192ce60e4cd0246de588391f7bdccb54ce03d4c2318f98a058c56c2aca0ca851d77f43f185d5a365a158c88854d847b9e0b239f84a36d85947910dcd96ba11eba578834ccc95cc911f49cc6f1e823bbfa33d4c23b8fd1460c118efebbca61aeb47812d4e35417da39fdc4f492833e566be57ad6ec31bcda86f992794e8a7d79211ff5df15f2d7f25eff80f4d2423f4a2df49722174cb50879b987c85afabf0605cfaf78aa26b857bf68edac60aa56c03f43c17f00269dd7d70a656e6473747265616d0a656e646f626a0a31322030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203130203020520a2f5265736f7572636573203131203020520a3e3e0a656e646f626a0a31312030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31302030206f626a0a3c3c0a2f4c656e67746820313831390a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cdd5add8ee5b60dbef753e80556a1f82709189c8b4dda02bd2890eedc15bd98f8d86881d900db00edeb17a4fc778e7d3633d964ce263b588c29db92487efc48ca93020408ef52805038c55243ffb1fbd4d9a054895842d5f09fa1fbe6bbe1bfffee87bfffe57de87fea20264ca24531b3402d40354054e10aa92ae4c294280788b91424c1ca2965e51c7eea7fecc6abc952b01fbbf3a94b47db79ff388da7201072ad1111c3e3c7ee9b3f63400d8f63f78f0711ee59e4892b821401c653807f86c7bf767f7aecbe7fe1d4b9c65aa7a95348699a1ab4d7945993ea291084071d339ec23b94f0a0674d08ca2a087c7c5b49938e0802197554d59a2993561d75d0a43d82bf5c75380584f090f514fc5dc99459ab9e5574c8ace32b5562a5c835142831a7452b685a65ff770a0ae101872cdaabe427adb964503c05f671251df5fcea7553240db9f2c1ba5a7558edc8f02bafcc914ac8050e56c61f08898911a812122190ffccbf2fd6fa7e0779904b3083048894f102f536c64b50b4207921b6139788183248145ae03ded9d89471e8405399d4285f020dc2cc52302333b827810651112e6ca67167b637eea42bb6bdd7813b6a69069611aae1a970051e0e23179a9625922b2042d7ae015661d95b2ac2847b811672d54f4acd5c3c21fcd36d25b0ce69f0fd323924047db85750442ca1c3e76c24e81263c6f6df6ed875f4e811fbefd5b97a284ff751fba4f9d5048b52d85be54b5a584356a2d98db8008b47b394a4919711e41c0d077934009edd559d0c8c967d84c4608615ac82e7b5bde2e9e3b2ef3d426b36c2770c91662f1159fed62b399f55ddf6cd3a8effeb54359bd0a960071132666c8367461b0961aae8d5ff6802d17b1597c480e8cfffe0eb1ad10142562e639b013cef067b120b590e6c43d170b600f690bec34852ff12868639f0de36b445280887b48d26ca349e7572801b884302e212cac358307aee741f554c69eca7e2689bd2d1155b9d0e03229bd2af9beb9e5a5f091e5b52570e346633b041d54341ba56ad5a477b7f776dfabbd29113c4d6977fe8d7d4bc6fc437ebab3ad558f6c0d5356913ca50da5091be9644f3d683e85777e215795cbdb9b5d0f73edd02a510b53ab4375f0349aee6c6e2e87e6cea8293fadb49251c50231a30e7787351fd5d437ecfbf9bd7e412bf5a2ae86ad61ba91788849902bd39268bc9a9cae13028f62ff27c08be5aa81ebfa84cd7247f4987a0522005fbb626ab6288bffdee4a52f60f9dfdc558291b9ec5c45dc9b83c45c60e5bd95b1c9aa040177dfc0c4d5f82941f34a15ba6f4c33514cb9ec5ab0b3d53499bc5a4f5e9d7b99c0e68816e1def70d5afc4af48c905316775f7396787cbdbc67d09a9fbc47b787ac19370269af8c6682b9933052b17d35dcf862b4a9696c29f69ceaedfcdca6ded9cc49a2643c36736b9672e34d7213c86486db81c05319e1ddf7648cb3f3aef9e29cc9e7b0b9dcfef684253d9ba2fa8bee5db7ec7a4373337cf3b23d929bf73cfbf8d8b0f16ed5c1ae9709b68efe3aec4e35c7aa7acbeefb3ed3b5e62ccd726ed3f1452deb0677dc6e7a813139d30326fb8112aff7764ff211b2bf124b16b0b3a203438a857dd2be857fc396f64e15aba6d3d19a751f0d3e5bd43524b34ab3ed8a7504c3b1dffd3c6b183ca7d9b11190d216f08d381c9ae68a19fe07e4760af6caddadad18b3ec92a5e3769c90396ca174a9e1167ccecceab13d371e0d6a8ee77635c7ba57428effed1cf3d1cdcd7460cb5ed1d4a8bd2feab4f1229bfed6adbd4020e2c8baafb0929090a7e7e5cc4ec44ef05a833fd7502d912fc97b2db6ac40bb5f996b8a258db52c656e8d326bb6f2f8916fdb5d454d76aaeb016a3968ce4453d364085af870f073f1a363736d07c4ecec6505b58dcff9e08a03e7889d72394da3d2b87406d902c019551eeff6e6b226afe9e8f5df110828d65a77663b0eaf431efed45963241a1321868f1d6ec5e70e55a22016ceeb2866eb5c212a54129ac4e95edf99a8cacb042ed6a822c0396ce6d33c3d644b2e42df6d253ba18c9c73125a07e56246d92cd7db89eab297e7262d1b5da75a54d92abb3f485c3f18fdde4f0539a0522c52d7927ffee674142fc352fdee6abb7ba6150ec81c25efcb7de309bda8e3d0b63e75327a0aa51d9658db3cf889d51ddb7ad3c3ce68ab2c7ad4490d59b865a4a7b6fbd6c7dc4a6db728edfaace565bb827ab8abeb54fb391a5db74d408a2301318e840484a4d8fb78a52712ca173b540ebaa121d155dc7f12f9a540f36f22fe45e44d3d5e6ab40eda3f50a9f062e0b2cd73375dcc5efb5407467f984c6ea6a22b0c10e096eb652b1a5be61dd74bc20b0a7571214c13375cdfc40d33e71dd7db921baea7adf8dc61d51ddb63bd98b489cb04266e08bf896b6a5ae75b34bab0c11f98f309f426e9f3d17793a997bb1bbdfb866ff1bbf14b6d9dd49ed407bc3fa9fbeebf3e56f76dbd0dad27627a22b8a275dbc086d7b9963f10af13a5af81d8ed2f8a8a6f6ff94b8249de5bf80b58ec5737f0ff019aa018560a656e6473747265616d0a656e646f626a0a31352030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203133203020520a2f5265736f7572636573203134203020520a3e3e0a656e646f626a0a31342030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31332030206f626a0a3c3c0a2f4c656e677468203534350a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd544d6bdc400cbdfb57e80f64a2d1c7d30c2c3e24fd801e0a69f6567a68bd36149a421a68ff7e19ef261ba72edd9452cfc18c6624cd93de532626a6b34c4cc5722a95869beeb66b46af9ea450057d1bbbf317e3f7cfc3f8eef5050d771da72cd9512061ceb5b056e204b7cab982a398660de214a588ba54cb39604177c3d76e7a122c535bede4b6cb6bcfb9d81eec999c296a4d2242db9beefc959080b653f77ee36e83b97fb42aecc5d9a427fe40db37ddcb6d777562e8a8a9d643e84c391f423306e43064a02765da600ae9e94c9c36d8210bc3e0c2b67e0c45c624ec1c8209400d0d45c584111983f0ec5c31f6244c9b404fb3af8786a16207c71886e999900c9aac52e192223fa0e23daa98bf9ec0b491311c033c3ea2460986f464b31d8a09bb67e7cd4941516d252f2ac6631d8dff71664b5a280aaf64964f2a6a6ac25a555485755ef7ff45aeab5f28cfbe24333b71d29005eb9bcd1e44b117c989dcce569208057b727da0f7e1eda636d9e8e662b9a7cab471db57ca2661339b1964a3c3dcd5cdaaedcc9bc7fdad05baa7d8ec916c1ba086a2213c222ec4c97971cd4f05169ec49c50b0d215334cd0f023cb857fa3b3bd54b0439d65315f8d66199a06e3cf325d1b1232b36d511d67ca6174d3b9cd23b06dbe3caed9e5f5df8fc0ebcbb75d4e4e3fbaebffdc86ca09c509b6260e6b721bc35ac572ab5d3eb4629e6c3861380923e047ff7d7f5abf66814126653599549455148b92ff0490f864ce0a656e6473747265616d0a656e646f626a0a31382030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203136203020520a2f5265736f7572636573203137203020520a3e3e0a656e646f626a0a31372030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31362030206f626a0a3c3c0a2f4c656e677468203532330a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd54cb6ed5400cdde72bfc039d7afc381e4b5759b43c241648a577875894dc4442a248a512fc3e4a6e5fb704d12220b388c6e3b1e7d8e7b81213d35125a666b5b4a4e1b2bbea66a3a7176994a0af6377fc62fcf66918dfbd3ea1e1bae352a53a1a24cc391b6b1217b825d7044733ad1ac4255a137549ab356041d7c3976e7a14acd2bce693abaeae3de7647b63afe44c91594484b697ddf12b21016da7eefdc6dd0673bfb014f6e66cd2137fa0ed9beee5b63b7b62e8c8927913ba52ad37a119036a182ad093326d3085f474244e1bec50856170615b3f86a26212760ec104204343919830a262105e2e27c69e846913e869b9eba16148ece018c3303d1392418b25356e25ea1d2adea38ae5eb094c1b19c331c0e302192d18d2932d762826ec9e9db7160545da4a5e24c6fb3a1affe5cc56b451345ec92c1f55d4d484355554857559b7ff835c673f519efd90ccecc445430e583fdbec4e147b913c91dbd55a11a1602fae77f4be79bba94d36bab958ed2999366efb4ad9246c660b836c7498bbba59dace7cbe71eb7580ee31367b20db19d08c6246788fb81117e703377f2ab0f022e6848695ae98618286dfb35cf8173adb4b053be4228bc53566cb306b307e2fd3b521210bdb0eaae34c358c2e3bb76504ce9bcf0f6b767afee723f0fcf46d578bd3f7eefc3fb7c1b5b8116c4d1bab5d78546aec956acb141b91cb5cbbf5f77fd38a1fdeab6b340a656e6473747265616d0a656e646f626a0a32302030206f626a0a285044464b6974290a656e646f626a0a32312030206f626a0a28554c455a49205850422053697374656d61290a656e646f626a0a32322030206f626a0a28443a32303236303430363132303730375a290a656e646f626a0a32332030206f626a0a28554c455a4920585042290a656e646f626a0a32342030206f626a0a28436f6e747261746f20646520696e76657374696d656e746f202d2031290a656e646f626a0a32352030206f626a0a28436f6e747261746f20646520696e76657374696d656e746f290a656e646f626a0a31392030206f626a0a3c3c0a2f50726f6475636572203230203020520a2f43726561746f72203231203020520a2f4372656174696f6e44617465203232203020520a2f417574686f72203233203020520a2f5469746c65203234203020520a2f5375626a656374203235203020520a3e3e0a656e646f626a0a392030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963610a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a382030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963612d426f6c640a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a342030206f626a0a3c3c0a3e3e0a656e646f626a0a332030206f626a0a3c3c0a2f54797065202f436174616c6f670a2f50616765732031203020520a2f4e616d65732032203020520a3e3e0a656e646f626a0a312030206f626a0a3c3c0a2f54797065202f50616765730a2f436f756e7420340a2f4b696473205b37203020522031322030205220313520302052203138203020525d0a3e3e0a656e646f626a0a322030206f626a0a3c3c0a2f4465737473203c3c0a20202f4e616d6573205b0a5d0a3e3e0a3e3e0a656e646f626a0a787265660a302032360a303030303030303030302036353533352066200a30303030303036303133203030303030206e200a30303030303036303931203030303030206e200a30303030303035393531203030303030206e200a30303030303035393330203030303030206e200a30303030303030323234203030303030206e200a30303030303030313235203030303030206e200a30303030303030303135203030303030206e200a30303030303035383238203030303030206e200a30303030303035373331203030303030206e200a30303030303031383632203030303030206e200a30303030303031373632203030303030206e200a30303030303031363439203030303030206e200a30303030303033393638203030303030206e200a30303030303033383638203030303030206e200a30303030303033373535203030303030206e200a30303030303034373939203030303030206e200a30303030303034363939203030303030206e200a30303030303034353836203030303030206e200a30303030303035363130203030303030206e200a30303030303035333935203030303030206e200a30303030303035343230203030303030206e200a30303030303035343536203030303030206e200a30303030303035343932203030303030206e200a30303030303035353230203030303030206e200a30303030303035353637203030303030206e200a747261696c65720a3c3c0a2f53697a652032360a2f526f6f742033203020520a2f496e666f203139203020520a2f4944205b3c34376661303463396437396438386535373732633838313039623764363837383e203c34376661303463396437396438386535373732633838313039623764363837383e5d0a3e3e0a7374617274787265660a363133380a2525454f460a, 'assinado_ambos', 1, 1, '2026-04-06 08:57:00', '2026-04-06 13:07:07', 1, 1, 0, 0, 9, '2026-04-03 23:08:39', '2026-04-06 13:07:08'),
	(2, 4, 4, 10, 3, 'Expansão por Fanquia', NULL, NULL, _binary 0x255044462d312e330a25ffffffff0a372030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e74732035203020520a2f5265736f75726365732036203020520a3e3e0a656e646f626a0a362030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a352030206f626a0a3c3c0a2f4c656e67746820313335300a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789ced99ddaedb360c80effd147a81ba147f2520c845bb1f601703ba9ebb61179d636303da015d81edf5074a766ce7a8684fd7d567c3122091645ba21852fcc8c40001c2931820248e7dca6178d3bded7c50b2f49842d6f0fbd83dfd6afce3d761fce1db676178d7411f318a264563819c8072805e8533c4ac6089299205e82d2524c1cc319ab28577c36fdd7433590cfef62b6fbbd812e7d9dd3c1e8340b09c7b440c776fbaa7df60400d7753f7e34984071679c519419200e339c04fe1eebbeeebbbeec5474e6db9cf799e3a8618e7a941078dc61a55cf81209c74323c872728e1a4178d08ca2a08dcbeaca451270401439d54351b1969d649478d3a209487b38ee780104ea6e7509e152363cd7a51d1d158a7076e89957ace2141ea2d5e77057557565ee7a0104e389ae8a062af345b32503c072ee34a3ae9e5c1ebc69e3458e6c6ba9a755cf5c8f09957e69e52b0048d95f16742626204ca84440854decbf76ead17f74c1e646fcc20017a32dc59bd8ff1d529aa937ca46d474e3d6230905ee86adeb3ec4c3cf1282cc8f11c32849370d5144f08cc5c2c884751162161ce7c61f12796bb76bbbbdd1b6fdcd637e4bbf01dae3b4e017a81dd6df2b11b33e9912568d2c6afc2ac9392c96ae508eff1b3ea2a7ad15cdca2dc6a3e32b80fda87ddb4754860b1b69d760442340e6f3ae172047ae7f55667cf5f7efa11f8f2f9f75dec25fcd9bdecde764221e6ba1496a5b22f25acbde684560744a05eb35e5234c4650401c3d0cd1d8ae88f2e1ded399619369311429817f2e6e0cb7be375c76999dafb2cdb094acf1762292bbef6c64698f5d9226cddd1d0fd72cfcaf28db704e8b3eecc0ce74870abeb74df3ed3ce1553199286ae9f1de0ca0a41517a345efc38e26cedd97dd5fd92332b6726f7e7e2a16bab7af4fcc924f2205fbe354b5733deb74b5a34376be2015b03bcfa315efd5850c51d2f42895cdef3333c6b3cf0e4c9b2937673ea94b3f21c927bff85f0588d4ae2864699eb71b6e0c57cf4393b443df23ccfb29378d52a01294e04c438111210921eac59d596adb28790421e53d1aeeb783258028643985f1e4b9489aefe83d5adcdd0290599a28e4623cdd17032ac242aee887e2d9a7cd00dfff91f8253cbc42be2c61acbf51605a20e07eb9d5be8cc7106f8712379562b5c1275b8ca2f2b9f1895762c06c6c5c09cef6ff8d6e3316d70c03b3b1cf08125c4d32d0e106f70800d561c60e3060e70e962bd21551cf0c61607b802c06682d2838a03be62c1818d301b94a08203fed5c4819b80eb38b0865ab7c53ab40bd5ff153ee0d4e40301c199ddb3b3be678d1e533dec479971550aeee30581852fe51191820f477a386b0b0b78f434ae84af7acc8a5ecc1361f13076ac776f255ebddbb1c0cad959b308cb55eb1ac55352353e58cfdc8485d181f2607df27ba000c81c0a281292901dac3f6c21014bc930f3d111672bdda668128d944bec88124e268a0b96d0ae62c4a0b66ca45943f9f2ea8656e0f75c464ba6e0d51fcf1b8a8b7945ec60d4e266b5ac548c7231e148eae67cac562943db8847b78a927dd1d139c256c6b80d08a51abaaf03eeeb3cf74b9d4e26195730f2ce0e8c7c60819d2c376024002b1829a6158c94b001464aba8091370b1879630b46def7a2d63a81f7305530f2150b186d84d940950b5b77f43f18dd5a365a138c88854d84475eca201f84a37d3d94799283f37c8276e8de20d2ec19758ba6d7ff00b8fac8a1fe0cadf0ce634994bd5ab5a43e25693e56d3981e7390c766257c964d762962cd831f5f5847fd7785f5adbcbbb02e5eb4a24440c93f0fd6aab4c27a2957c15c6790c77b406ca5ff7b01ffcb2b9e9ac9ebbdffa60e5630356bd99fa0e0bf00f1afccac0a656e6473747265616d0a656e646f626a0a31322030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203130203020520a2f5265736f7572636573203131203020520a3e3e0a656e646f626a0a31312030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31302030206f626a0a3c3c0a2f4c656e67746820313835390a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cdd5add8eddb611bed753f005cc0ce78f24b038174ed302b928907aef8a5e6c7424b4c0ba8013a07dfd6086fa3b473aeb7512fb38f1c2580d250d39c36fbe99a136050810dea400a1708aa586fe7df7a1b341a912b184aae1a7a1fbe62fc3fffed30ffff8dbdbd0ffdc414c98448b6266815a806a80a8c2155255c88529510e10732948829553caca39fcdcffb71baf94a5603f76e743978e96f3f6711a4f4120e45a232286c7f7dd377fc5801a1ec7ee9f0f22dcb3c813570429028ca700ff0a8fdf77df3d763fbc5275aeb1d649750a294daa417b4d9935a99e024178d031e329bc41090f7ad684a0ac82c0c7b79534e9882090514755ad993269d551074dda23f8cb55875340080f594fc1df954c99b5ea594587cc3a7ea249ac14b9860225e6b45805cdaaecff4e41213ce090457b95fca435970c8aa7c03eaea4a39e3f79de144943ae7c30af561d563f32fcce3373a41272818399f14742626204aa844408e43ff3ef8bb97ed8411ee412cc20012265bc40bd8df112142d485e89edc42522860c128516784f6b67e2910761414ea750213c08374ff188c0cc8e201e44598484b9f299c5de989fbab0eeda36de84ad1964569885abc5254014b8784c5e6b5896882c418b1eec0ab38e4a59569423dc88b3162a7ad6ea61e18f661be92d06f3c7c3f48824d0d176e11d81903287f79db053a009cf5b9f7dfbeed753e0bb6fffdea528e1ffddbbee432714526d53a14f556d2a618d5a0be6362002ed5e8e5252469c471030f4dd2450427b75163472720d1b658410a689ecb2b7e9ede2b9e332ab369965abc0259b88c5677cb68bcd62d6777db1cda2befbf70e65f52a5802c44d989823dbd085c35a6ab8767ed903b65cc466f1213970fedb3bc4b64250948899e7c04e38c39fc582d4429a13f75c2c803da42db0d314bec4a3a08dbd18c6d788a40011f790a4d94793cd9f6004e012c2b884b0b0d60c1eb89e07d553197b2afb4812fbb24454e5c2824d5252638a649c9174c8298b564df7f5b5143ef2b5b6946d6c68fc86a0838a6623515bb3deddc3db75af1e26799ad2ecfc1bfb967cf9c7fc74674fab1e791aa62c22794a134a1386d384957c0a6ffc42ae2a952fef743dccad43ab3c2d2cadeed4c1d3e6bd81cde5d0dd1935e5a7954632aa186164d4e1eea0e6a31afa867f5f5eeb6f689d5ed5c5b0354837120d310972655a128b578fd37542e051ecff0478b1dc34705d9f302d77448f99572002f0f556c80c17d1a155862a2d7ebdad483e5a8d2f11bc63133de7f60eb99cb0b71ad25b34cab2cd07933e0761924d83366642c83471ef98e9be1b2f1899cb6ee3897bdb6eb10db5e6c08ae064358680836160e26a6c97a0ed7195970df9ec0cc14431e5b26be0ce5611b9cf4193d7f65e64b06d62e30bef1a072d7e257a46f0646e45492b44c4a3f5f51d87d6fce4f8b087ac95373a6aaf8ce682b90f3174acf8f1c9685311d954ecf9d90f03e626f7ce6e4e1225e3b19b0f42442637dc3ea9e0a924f1de7d72c6790acb339e33b90ed3e5feb7272c859a0a8f4df5dd75cfae373437c7b75db64772db3dcf653e366c76b7ea60d78b82ed467f1d7ea79a6355bde5f77d97ea567396e639f7e9f8aa8677833b6e371ba7b5cdf480c97e1cc51bbebb7e928f90fd9578b2809d341d38522cec93f62dfc1bb6b477aa582d9d0ee6ac7769f0d9a2ae21999734b260dd29bfa97c99350c9e93766c04a4b405fc94a60c9ab61533fc0fc8ade59dbb7b5b3166d9a55ec7ed382173d842e9d2c22df89c99d5637b6e621ad41ccfed6a8e75afab1cff5b1df3c1cfcd7460d35ed1d4a8bd4feab4f12a9f7eee83018140c491755faf2521214fcfcb899f889dffb5e381b9226b897c49de6be966e5defd8a66332c69ac65299a6b94d9b295c78ff6b6dd55d46467c21ea09683e64c34b56086a0850f073f553f3a74d776bcccce5e569edbf89c0fae38708ed82997d3342a8d4b67902d009c51e5f16e6f2e73f29a8e3efd2b0401c55aebce6dc7e175c8c31f3a6bb3446322c4f0bec3adf8dca14a14c4c2791dc56c7d3044854a429338ddeb3b13557951e0628d2a029cc3469fe6e9219b7211fa6e2bd9f966e49c93d03a28171a65335d6fe7b1cb5a9e9bb42c7455b598b235767f0cb97e6efaa39f297240a558a4ae25fffcc5ea285e86a5faddd576f74c2b1c90394ade97fbc6137a51c7a12d7dea64f4144a3b7a19bc47f30eec7e7c6776d8096f95c58e3a99210bb78cf4d456dffa985ba9ed16a55d9fdcbc6e55500f57759d6a5fa2d175d904a4381210e3484840486a8d3301157a22a17cb142e5a01b1a125dc5fd07955f0b34ffa2e2df53bee88e971aad83f6cf5b2abc38b86cf3dccd2d66af7daa03a33f4c263753d115060870cbf5b2158d2df38eeb25e10585bab810a6891bae6fe28699f38eeb6dca0dd7d3567ceeb0ea8eedb15e286de2a2c0c40de137714d4dabbec5a20b1ffc89399f406f923e1f7d75997ab9bbd1bb2ff816bfdb5f1d38bed9506f45d9c74fa73f6b48fb6abf3e16f7657d591ad78b25da02363cceb5fc89789c287d0d446e7f7f547c79cbdf1d4cf2dec3bf81b57e7707ff02ca2f22610a656e6473747265616d0a656e646f626a0a31352030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203133203020520a2f5265736f7572636573203134203020520a3e3e0a656e646f626a0a31342030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31332030206f626a0a3c3c0a2f4c656e677468203534350a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd544d6bdc400cbdfb57e80f64a2d1c7d30c2c3e24fd801e0a69f6567a68bd36149a421a68ff7e19ef261ba72edd9452cfc18c6624cd93de532626a6b34c4cc5722a95869beeb66b46af9ea450057d1bbbf317e3f7cfc3f8eef5050d771da72cd9512061ceb5b056e204b7cab982a398660de214a588ba54cb39604177c3d76e7a122c535bede4b6cb6bcfb9d81eec999c296a4d2242db9beefc959080b653f77ee36e83b97fb42aecc5d9a427fe40db37ddcb6d777562e8a8a9d643e84c391f423306e43064a02765da600ae9e94c9c36d8210bc3e0c2b67e0c45c624ec1c8209400d0d45c584111983f0ec5c31f6244c9b404fb3af8786a16207c71886e999900c9aac52e192223fa0e23daa98bf9ec0b491311c033c3ea2460986f464b31d8a09bb67e7cd4941516d252f2ac6631d8dff71664b5a280aaf64964f2a6a6ac25a555485755ef7ff45aeab5f28cfbe24333b71d29005eb9bcd1e44b117c989dcce569208057b727da0f7e1eda636d9e8e662b9a7cab471db57ca2661339b1964a3c3dcd5cdaaedcc9bc7fdad05baa7d8ec916c1ba086a2213c222ec4c97971cd4f05169ec49c50b0d215334cd0f023cb857fa3b3bd54b0439d65315f8d66199a06e3cf325d1b1232b36d511d67ca6174d3b9cd23b06dbe3caed9e5f5df8fc0ebcbb75d4e4e3fbaebffdc86ca09c509b6260e6b721bc35ac572ab5d3eb4629e6c3861380923e047ff7d7f5abf66814126653599549455148b92ff0490f864ce0a656e6473747265616d0a656e646f626a0a31382030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203136203020520a2f5265736f7572636573203137203020520a3e3e0a656e646f626a0a31372030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31362030206f626a0a3c3c0a2f4c656e677468203532330a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd54cb6ed5400cdde72bfc039d7afc381e4b5759b43c241648a577875894dc4442a248a512fc3e4a6e5fb704d12220b388c6e3b1e7d8e7b81213d35125a666b5b4a4e1b2bbea66a3a7176994a0af6377fc62fcf66918dfbd3ea1e1bae352a53a1a24cc391b6b1217b825d7044733ad1ac4255a137549ab356041d7c3976e7a14acd2bce693abaeae3de7647b63afe44c91594484b697ddf12b21016da7eefdc6dd0673bfb014f6e66cd2137fa0ed9beee5b63b7b62e8c8927913ba52ad37a119036a182ad093326d3085f474244e1bec50856170615b3f86a26212760ec104204343919830a262105e2e27c69e846913e869b9eba16148ece018c3303d1392418b25356e25ea1d2adea38ae5eb094c1b19c331c0e302192d18d2932d762826ec9e9db7160545da4a5e24c6fb3a1affe5cc56b451345ec92c1f55d4d484355554857559b7ff835c673f519efd90ccecc445430e583fdbec4e147b913c91dbd55a11a1602fae77f4be79bba94d36bab958ed2999366efb4ad9246c660b836c7498bbba59dace7cbe71eb7580ee31367b20db19d08c6246788fb81117e703377f2ab0f022e6848695ae98618286dfb35cf8173adb4b053be4228bc53566cb306b307e2fd3b521210bdb0eaae34c358c2e3bb76504ce9bcf0f6b767afee723f0fcf46d578bd3f7eefc3fb7c1b5b8116c4d1bab5d78546aec956acb141b91cb5cbbf5f77fd38a1fdeab6b340a656e6473747265616d0a656e646f626a0a32302030206f626a0a285044464b6974290a656e646f626a0a32312030206f626a0a28554c455a49205850422053697374656d61290a656e646f626a0a32322030206f626a0a28443a32303236303430363039303930335a290a656e646f626a0a32332030206f626a0a28554c455a4920585042290a656e646f626a0a32342030206f626a0a28436f6e747261746f20646520696e76657374696d656e746f202d2032290a656e646f626a0a32352030206f626a0a28436f6e747261746f20646520696e76657374696d656e746f290a656e646f626a0a31392030206f626a0a3c3c0a2f50726f6475636572203230203020520a2f43726561746f72203231203020520a2f4372656174696f6e44617465203232203020520a2f417574686f72203233203020520a2f5469746c65203234203020520a2f5375626a656374203235203020520a3e3e0a656e646f626a0a392030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963610a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a382030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963612d426f6c640a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a342030206f626a0a3c3c0a3e3e0a656e646f626a0a332030206f626a0a3c3c0a2f54797065202f436174616c6f670a2f50616765732031203020520a2f4e616d65732032203020520a3e3e0a656e646f626a0a312030206f626a0a3c3c0a2f54797065202f50616765730a2f436f756e7420340a2f4b696473205b37203020522031322030205220313520302052203138203020525d0a3e3e0a656e646f626a0a322030206f626a0a3c3c0a2f4465737473203c3c0a20202f4e616d6573205b0a5d0a3e3e0a3e3e0a656e646f626a0a787265660a302032360a303030303030303030302036353533352066200a30303030303036303531203030303030206e200a30303030303036313239203030303030206e200a30303030303035393839203030303030206e200a30303030303035393638203030303030206e200a30303030303030323234203030303030206e200a30303030303030313235203030303030206e200a30303030303030303135203030303030206e200a30303030303035383636203030303030206e200a30303030303035373639203030303030206e200a30303030303031383630203030303030206e200a30303030303031373630203030303030206e200a30303030303031363437203030303030206e200a30303030303034303036203030303030206e200a30303030303033393036203030303030206e200a30303030303033373933203030303030206e200a30303030303034383337203030303030206e200a30303030303034373337203030303030206e200a30303030303034363234203030303030206e200a30303030303035363438203030303030206e200a30303030303035343333203030303030206e200a30303030303035343538203030303030206e200a30303030303035343934203030303030206e200a30303030303035353330203030303030206e200a30303030303035353538203030303030206e200a30303030303035363035203030303030206e200a747261696c65720a3c3c0a2f53697a652032360a2f526f6f742033203020520a2f496e666f203139203020520a2f4944205b3c63303539613437363834643732653034613861336365363062386661313061613e203c63303539613437363834643732653034613861336365363062386661313061613e5d0a3e3e0a7374617274787265660a363137360a2525454f460a, 'assinado_ambos', 1, 1, '2026-04-06 08:57:16', '2026-04-06 08:56:51', 0, 0, 0, 0, 9, '2026-04-06 08:54:59', '2026-04-06 10:09:03'),
	(3, 5, 5, 10, 3, 'Licenciamento de Marca', NULL, NULL, _binary 0x255044462d312e330a25ffffffff0a372030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e74732035203020520a2f5265736f75726365732036203020520a3e3e0a656e646f626a0a362030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a352030206f626a0a3c3c0a2f4c656e67746820313334330a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789ced99ddaedb360c80effd147a81ba147f2520c845bb1f601703ba9ebb61179d636303da015d81edf5074a766ce7a8684fd7d567c3122091645ba21852fcc8c40001c2931820248e7dca6178d3bded7c50b2f49842d6f0fbd83dfd6afce3d761fce1db676178d7411f318a264563819c8072805e8533c4ac6089299205e82d2524c1cc319ab28577c36fdd7433590cfef62b6fbbd812e7d9dd3c1e8340b09c7b440c776fbaa7df60400d7753f7e34984071679c519419200e339c04fe1eebbeeebbbeec5474e6db9cf799e3a8618e7a941078dc61a55cf81209c74323c872728e1a4178d08ca2a08dcbeaca451270401439d54351b1969d649478d3a209487b38ee780104ea6e7509e152363cd7a51d1d158a7076e89957ace2141ea2d5e77057557565ee7a0104e389ae8a062af345b32503c072ee34a3ae9e5c1ebc69e3458e6c6ba9a755cf5c8f09957e69e52b0048d95f16742626204ca84440854decbf76ead17f74c1e646fcc20017a32dc59bd8ff1d529aa937ca46d474e3d6230905ee86adeb3ec4c3cf1282cc8f11c32849370d5144f08cc5c2c884751162161ce7c61f12796bb76bbbbdd1b6fdcd637e4bbf01dae3b4e017a81dd6df2b11b33e9912568d2c6afc2ac9392c96ae508eff1b3ea2a7ad15cdca2dc6a3e32b80fda87ddb4754860b1b69d760442340e6f3ae172047ae7f55667cf5f7efa11f8f2f9f75dec25fcd9bdecde764221e6ba1496a5b22f25acbde684560744a05eb35e5234c4650401c3d0cd1d8ae88f2e1ded399619369311429817f2e6e0cb7be375c76999dafb2cdb094acf1762292bbef6c64698f5d9226cddd1d0fd72cfcaf28db704e8b3eecc0ce74870abeb74df3ed3ce1553199286ae9f1de0ca0a41517a345efc38e26cedd97dd5fd92332b6726f7e7e2a16bab7af4fcc924f2205fbe354b5733deb74b5a34376be2015b03bcfa315efd5850c51d2f42895cdef3333c6b3cf0e4c9b2937673ea94b3f21c927bff85e8588d4ae2864699eb71b6e0c57cf4393b443df23ccfb29378d52a01294e04c438111210921eac59d596adb28790421e53d1aeeb783258028643985f1e4b9489aefe83d5adcdd03968565a1d6d17422b915e341a3a801efc33706a197805dca88bc47b10883a1cac756e8133c719dfc78de459ad5049d4e12abfac746254dab1981717f372babfa15b8fc6b48101efec60c00796004fb73040bc8101365861808d1b30c0a58bf5865461c01b5b18e01afe3713941e5418f0150b0c6c84d980041518f0af260cdc845b878135d0ba2dd6a15da0feafd001a7261d0808cee49e9df43d67f488ea413fca0cab52601f2f082c7c298f88147838d2c3595b50c0a327712578d54356f4629e068b7de84cfac7bd7b2bf1eadd0e05e608136b0e61b96a5da37842aac607eb999ba8303a4e1eac4f7e0f1200992301454212b283f5872d206029f9653e3ae26ca5db944ca29172891d51c2c944718112dad58b18d4968d342b285f5eddd00afc9ec968c913bcf6e359437131af871d0c5adcac95957a512e261c49dd9c8fd52a65681bf1e85651722f3a3a43d8ca18b701a1d442f755c07d95e77ea1d3c924e30a46ded981910f2cb093e5068c04600523c5b482911236c048491730f26601236f6cc1c8fb5ed25a27f01ea60a46be6201a38d301ba87261eb8efe07a35bcb466b8211b1b089f0c84b11e48370b4af86324f82077b2db443f7069166cfa85b34bdfe03c0d5470ef5676885771e4b9aecb5aa25f52929f3b19ac6f498833c36ebe0b36cb24b116b1efcf8c23aeabf2bac6fe5dd8575f1921525024afe79b056a515d64bb10ad69ace633d20b6d2ffbd80ffe5154fcde4f5de3f53072b989a95ec4f50f05f202bcc950a656e6473747265616d0a656e646f626a0a31322030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203130203020520a2f5265736f7572636573203131203020520a3e3e0a656e646f626a0a31312030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31302030206f626a0a3c3c0a2f4c656e67746820313834340a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cdd5a5b8fddb6117ed7afe01f30339c1b4960711e9ca605f25020f5be157dd86825b4c0ba8013a0fdfbc10c753b473aebe324f671e285b122259173f9e69b196a538000e14d0a100aa7586ae8df771f3a9b942a114ba81a7e1aba6ffe32fcef3ffdf08fbfbd0dfdcf1dc48449b4286616a805a806882a5c2155855c9812e500319782245839a5ac9cc3cffd7fbbf162b114ecc7ee7ce8d291386f1fa7f9140442ae352262787cdf7df3570ca8e171ecfef920c23d8b3c71459022c0780af0aff0f87df7dd63f7c38d4be71a6b9d964e21a56969d05e53664daaa740101e74cc780a6f50c2833e6b42505641e0e3db4a9a744410c8a8a3aad64c99b4eaa88326ed11fce5aac329208487aca7e0ef4aa6cc5af5594587cc3a7ea24aac14b9860225e6b468054dabecff4e41213ce090457b95fca435970c8aa7c03eafa4a33e7ff2be2992865cf9605fad3aac7664f89d77e64825e402073be38f84c4c40854098910c87fe6df677bfdb0833cc83998410244ca78867a9be325285a90dc88edc42522860c128516784fb233f1c883b020a753a8101e849ba57844606647100fa22c42c25cf999c5de989f3ad3ee5237de84ad29645a9886abc6254014387b4c6e552c4b4496a0450fbcc2aca3529615e50857e2ac858a3e6bf5b0f047b3cdf41683f9e3617a4412e8683bb38e404899c3fb4ed829d0062f5b9b7dfbeed753e0bb6fffdea528e1ffddbbee432714526d5ba16f556d2b618d5a0be6362102ed5e8e5252469c671030f4dd34a084f6ea3cd0c8c957d82c460861dac82e7bdbde2e5e3a2ef3d23666d92ee023db88c5777cb18b8d30ebbb2e6cd3a8effebd4359bd08960071132666c8367566b0961a2e8d5ff6802d67b1597c4a0e8cfff60eb1ad10142562e639b013cef067b120b590e6c43d170b600f690bec34852ff1286873af86f125222940c43d2469b6d1a4f3272801b884302e212cac358307aee741f554c69eca3e92c4be2c115539d36093947aad4a26a15a624e374afbd9ed2d858fecad2d6d1b231ac721e8a0a2d988d4a5bfbb95b772af562621789a936edf522fff989fee6c63d5231bc39443244f49a2e1c3f2cbc99e7ad07c0a6ffc422eea942f6f6e3dccac43ab3b2d28adead4c19366bab3b9b91c9a3ba3a6fcb4924846150bc08c3adc1dce7c54415fb1efebb2fe86c6e9a61e86ad3dba92668849902bd39256bc769cae13028f62ff27c08b65a681ebfa84ad7247f4987a0522005fbac218b1b4501c0ce24b4766ad573fe4c689997cdeee520b85295fcd73c59df87a807c76070a46e6b27320716f6e13738c95f856ca26ab1404dca903135763ad04cd5755e8be91ce4431e5b26bc39eadae315f64d0e415ba970a6ca5428b7beffd062d7e25fa8c90531677552b279ad36eef1bb4e627f7b13d640db9d14a7b653413ccdd84518dc9e58d3af966b4a96b6c2bf60ceb2dfddcaaded9cc49a2643c36736b987263537213c86486ebe70d3c1515de814fc6787636365f3c67f2353c64f2b4baa5425ba2fa8bee5db7ec7a4373337cf3b23d929bf73c107d6ed878b7ea60d7cb025b477f1d76a79a6355bd66f77dafe95a7396896ccca6e34d6deb0677dc6e7ad93139d30326fba112aff7764ff211b2bf124b16b0f3a203438a857dd2be857fc396f64e15aba6d3f19a75200d3e5bd43524b34ab3ed8a7504c3b1df7d9d355a76f0d5b11190d216f08d381c9ae68a19fe07e4760af6caddadad18b3ec52a8e3769c90396ca174aee1167ccecceab13db7210d6a8ee725b1a6e9bc7368f8dfae311fdf5c4d07b6ed054d8ddafba64e1b37d9f473b7f702818823ebbeee4a42429e9e97733b113bc56b4dfe5c59b544be24efb504b3b2ed7ec5af299634d6b214bf35caacd9cae347be6d771535d9c9ae07a8e5a039134dad942168e1c3c1cfc68f8eceb51d12b3b3d7e0bdfadaa35f70e01cb1532ea769561a97ce205b0038a3cae3dd6b425acbfa391d7dfab704028ab5d69dd98ec3eb90873f74d62e89c64488e17d87dbe14b872a51100be77516b3f5b310152a094dc3e95edfd9509597057c58a38a00e7b0594ff3f4906db90cfa6e3bb253cac83927a17552ce5694cd76bd9daa2eb2bcb4d122e8bad4a2ca56d9fd61e2fad1e88f7e32c801956291ba96fcf377a7a37819f2b66539abedee995638207394bc2ff78d27f4ac8e43137dea64b67d5b9a4edfeed8ec9b1e764e5b65d1a34e6ac8c22d233d35e95b1f732db55da3b4cb1398dba4827a28d565aa7d8d4657b10948712420c691908090147b044a24f4447cf12d4c39e8868644d7e1feb3c8af059a7f17f1af225fd4e3a546eba0fd23950a2f062edb3c77d5c5ecb54f7560f487c9e46a2abac000016eb95eb64363cbbce37a497846a13e5c08d3861bae6fc30d33e71dd7db961baea7edf0a5c3aa3bb6c77ab6681b2e0bd87043f86db8a6a675bd45a3331bfc89399f40af923e1f7d3b997ab9bbd1bb0b7c8ddfed6f071cdf6ca8b7a2ece3a7cc9f35a45ddaaf8fc55dac2f49e344e54c441360c3e35ccb9f88c789d2d740e4f65744c5c55bfe7a601aef2dfc1b58eb7737f02fb17816140a656e6473747265616d0a656e646f626a0a31352030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203133203020520a2f5265736f7572636573203134203020520a3e3e0a656e646f626a0a31342030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31332030206f626a0a3c3c0a2f4c656e677468203534350a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd544d6bdc400cbdfb57e80f64a2d1c7d30c2c3e24fd801e0a69f6567a68bd36149a421a68ff7e19ef261ba72edd9452cfc18c6624cd93de532626a6b34c4cc5722a95869beeb66b46af9ea450057d1bbbf317e3f7cfc3f8eef5050d771da72cd9512061ceb5b056e204b7cab982a398660de214a588ba54cb39604177c3d76e7a122c535bede4b6cb6bcfb9d81eec999c296a4d2242db9beefc959080b653f77ee36e83b97fb42aecc5d9a427fe40db37ddcb6d777562e8a8a9d643e84c391f423306e43064a02765da600ae9e94c9c36d8210bc3e0c2b67e0c45c624ec1c8209400d0d45c584111983f0ec5c31f6244c9b404fb3af8786a16207c71886e999900c9aac52e192223fa0e23daa98bf9ec0b491311c033c3ea2460986f464b31d8a09bb67e7cd4941516d252f2ac6631d8dff71664b5a280aaf64964f2a6a6ac25a555485755ef7ff45aeab5f28cfbe24333b71d29005eb9bcd1e44b117c989dcce569208057b727da0f7e1eda636d9e8e662b9a7cab471db57ca2661339b1964a3c3dcd5cdaaedcc9bc7fdad05baa7d8ec916c1ba086a2213c222ec4c97971cd4f05169ec49c50b0d215334cd0f023cb857fa3b3bd54b0439d65315f8d66199a06e3cf325d1b1232b36d511d67ca6174d3b9cd23b06dbe3caed9e5f5df8fc0ebcbb75d4e4e3fbaebffdc86ca09c509b6260e6b721bc35ac572ab5d3eb4629e6c3861380923e047ff7d7f5abf66814126653599549455148b92ff0490f864ce0a656e6473747265616d0a656e646f626a0a31382030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203136203020520a2f5265736f7572636573203137203020520a3e3e0a656e646f626a0a31372030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f46322038203020520a2f46312039203020520a3e3e0a3e3e0a656e646f626a0a31362030206f626a0a3c3c0a2f4c656e677468203532330a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd54cb6ed5400cdde72bfc039d7afc381e4b5759b43c241648a577875894dc4442a248a512fc3e4a6e5fb704d12220b388c6e3b1e7d8e7b81213d35125a666b5b4a4e1b2bbea66a3a7176994a0af6377fc62fcf66918dfbd3ea1e1bae352a53a1a24cc391b6b1217b825d7044733ad1ac4255a137549ab356041d7c3976e7a14acd2bce693abaeae3de7647b63afe44c91594484b697ddf12b21016da7eefdc6dd0673bfb014f6e66cd2137fa0ed9beee5b63b7b62e8c8927913ba52ad37a119036a182ad093326d3085f474244e1bec50856170615b3f86a26212760ec104204343919830a262105e2e27c69e846913e869b9eba16148ece018c3303d1392418b25356e25ea1d2adea38ae5eb094c1b19c331c0e302192d18d2932d762826ec9e9db7160545da4a5e24c6fb3a1affe5cc56b451345ec92c1f55d4d484355554857559b7ff835c673f519efd90ccecc445430e583fdbec4e147b913c91dbd55a11a1602fae77f4be79bba94d36bab958ed2999366efb4ad9246c660b836c7498bbba59dace7cbe71eb7580ee31367b20db19d08c6246788fb81117e703377f2ab0f022e6848695ae98618286dfb35cf8173adb4b053be4228bc53566cb306b307e2fd3b521210bdb0eaae34c358c2e3bb76504ce9bcf0f6b767afee723f0fcf46d578bd3f7eefc3fb7c1b5b8116c4d1bab5d78546aec956acb141b91cb5cbbf5f77fd38a1fdeab6b340a656e6473747265616d0a656e646f626a0a32302030206f626a0a285044464b6974290a656e646f626a0a32312030206f626a0a28554c455a49205850422053697374656d61290a656e646f626a0a32322030206f626a0a28443a32303236303430363133343035365a290a656e646f626a0a32332030206f626a0a28554c455a4920585042290a656e646f626a0a32342030206f626a0a28436f6e747261746f20646520696e76657374696d656e746f202d2033290a656e646f626a0a32352030206f626a0a28436f6e747261746f20646520696e76657374696d656e746f290a656e646f626a0a31392030206f626a0a3c3c0a2f50726f6475636572203230203020520a2f43726561746f72203231203020520a2f4372656174696f6e44617465203232203020520a2f417574686f72203233203020520a2f5469746c65203234203020520a2f5375626a656374203235203020520a3e3e0a656e646f626a0a392030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963610a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a382030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963612d426f6c640a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a342030206f626a0a3c3c0a3e3e0a656e646f626a0a332030206f626a0a3c3c0a2f54797065202f436174616c6f670a2f50616765732031203020520a2f4e616d65732032203020520a3e3e0a656e646f626a0a312030206f626a0a3c3c0a2f54797065202f50616765730a2f436f756e7420340a2f4b696473205b37203020522031322030205220313520302052203138203020525d0a3e3e0a656e646f626a0a322030206f626a0a3c3c0a2f4465737473203c3c0a20202f4e616d6573205b0a5d0a3e3e0a3e3e0a656e646f626a0a787265660a302032360a303030303030303030302036353533352066200a30303030303036303239203030303030206e200a30303030303036313037203030303030206e200a30303030303035393637203030303030206e200a30303030303035393436203030303030206e200a30303030303030323234203030303030206e200a30303030303030313235203030303030206e200a30303030303030303135203030303030206e200a30303030303035383434203030303030206e200a30303030303035373437203030303030206e200a30303030303031383533203030303030206e200a30303030303031373533203030303030206e200a30303030303031363430203030303030206e200a30303030303033393834203030303030206e200a30303030303033383834203030303030206e200a30303030303033373731203030303030206e200a30303030303034383135203030303030206e200a30303030303034373135203030303030206e200a30303030303034363032203030303030206e200a30303030303035363236203030303030206e200a30303030303035343131203030303030206e200a30303030303035343336203030303030206e200a30303030303035343732203030303030206e200a30303030303035353038203030303030206e200a30303030303035353336203030303030206e200a30303030303035353833203030303030206e200a747261696c65720a3c3c0a2f53697a652032360a2f526f6f742033203020520a2f496e666f203139203020520a2f4944205b3c62353435663564663061363765653332373432616266663864383931306462373e203c62353435663564663061363765653332373432616266663864383931306462373e5d0a3e3e0a7374617274787265660a363135340a2525454f460a, 'assinado_ambos', 1, 1, '2026-04-06 14:40:56', '2026-04-06 14:38:32', 1, 1, 0, 0, 9, '2026-04-06 14:36:55', '2026-04-06 14:41:00');

-- A despejar estrutura para tabela ulezi2_xpb.courses
DROP TABLE IF EXISTS `courses`;
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) NOT NULL,
  `descricao` text,
  `preco` decimal(10,2) NOT NULL DEFAULT '0.00',
  `duracao` varchar(50) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `nivel` enum('basico','intermedio','avancado') DEFAULT 'basico',
  `imagem_url` varchar(255) DEFAULT NULL,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_status` (`status`),
  KEY `idx_categoria` (`categoria`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.courses: ~12 rows (aproximadamente)
INSERT INTO `courses` (`id`, `nome`, `descricao`, `preco`, `duracao`, `categoria`, `nivel`, `imagem_url`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'Informática Básica', 'Fundamentos de informática: Windows, Word, Excel e Internet. Curso ideal para quem começa do zero.', 15000.00, '3 meses', 'Tecnologia', 'basico', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(2, 'Programação Web', 'HTML, CSS, JavaScript e criação de websites modernos. Aprenda a construir sites profissionais.', 25000.00, '6 meses', 'Tecnologia', 'intermedio', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(3, 'Electricidade Industrial', 'Instalações elétricas industriais e domésticas. Normas de segurança e certificação.', 20000.00, '4 meses', 'Engenharia', 'intermedio', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(4, 'Contabilidade Geral', 'Princípios de contabilidade, lançamentos, balanços e relatórios financeiros.', 18000.00, '5 meses', 'Finanças', 'basico', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(5, 'Mecânica Automóvel', 'Manutenção e reparação de veículos ligeiros. Motor, travões, suspensão e diagnóstico.', 22000.00, '6 meses', 'Mecânica', 'intermedio', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(6, 'Canalização e Saneamento', 'Instalações hidráulicas, saneamento básico e manutenção de sistemas de água.', 16000.00, '3 meses', 'Construção', 'basico', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(7, 'Design Gráfico', 'Adobe Photoshop, Illustrator e Canva. Criação de logotipos, flyers e identidade visual.', 20000.00, '4 meses', 'Arte e Design', 'basico', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(8, 'Inglês para Negócios', 'Inglês profissional para o ambiente corporativo. Comunicação, escrita e apresentações.', 12000.00, '3 meses', 'Línguas', 'intermedio', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(9, 'Gestão de Empresas', 'Fundamentos de gestão, liderança, empreendedorismo e plano de negócios.', 30000.00, '6 meses', 'Gestão', 'avancado', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(10, 'Soldadura e Serralharia', 'Técnicas de soldadura MIG, TIG, elétrica e corte de metais. Segurança no trabalho.', 18000.00, '4 meses', 'Metalurgia', 'basico', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(11, 'Ingles Nivel 1', 'Primeiros possos da lingua inglesa para todas as idades', 15000.00, '80', 'Idioma', 'basico', NULL, 'ativo', 1, '2026-03-30 01:55:36', '2026-03-30 16:43:43'),
	(12, 'Soldadura Industrial', NULL, 0.00, NULL, 'Industria', 'basico', NULL, 'ativo', 1, '2026-04-05 23:54:37', '2026-04-05 23:54:37');

-- A despejar estrutura para tabela ulezi2_xpb.course_reviews
DROP TABLE IF EXISTS `course_reviews`;
CREATE TABLE IF NOT EXISTS `course_reviews` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` int unsigned NOT NULL,
  `student_id` int unsigned NOT NULL,
  `course_id` int unsigned NOT NULL,
  `nota` tinyint unsigned NOT NULL,
  `comentario` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollment_id` (`enrollment_id`),
  KEY `student_id` (`student_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `course_reviews_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_reviews_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_reviews_ibfk_3` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_reviews_chk_1` CHECK ((`nota` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.course_reviews: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.employees
DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `departamento` varchar(100) DEFAULT 'Geral',
  `cargo` varchar(100) NOT NULL,
  `responsabilidades` json DEFAULT NULL,
  `data_contratacao` date DEFAULT (curdate()),
  `tipo_contrato` enum('efetivo','temporario','estagio','pj') DEFAULT 'efetivo',
  `salario` decimal(12,2) DEFAULT NULL,
  `horario_trabalho` varchar(50) DEFAULT '09:00-18:00',
  `supervisor_id` int unsigned DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `observacoes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `fk_employees_supervisor` (`supervisor_id`),
  KEY `idx_employees_user_id` (`user_id`),
  KEY `idx_employees_status` (`is_active`),
  CONSTRAINT `fk_employees_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.employees: ~2 rows (aproximadamente)
INSERT INTO `employees` (`id`, `user_id`, `departamento`, `cargo`, `responsabilidades`, `data_contratacao`, `tipo_contrato`, `salario`, `horario_trabalho`, `supervisor_id`, `is_active`, `observacoes`, `created_at`, `updated_at`) VALUES
	(1, 9, 'Geral', 'Gestor Operacional', NULL, '2026-04-02', 'efetivo', NULL, '09:00-18:00', NULL, 1, NULL, '2026-04-02 21:27:29', '2026-04-02 21:27:29'),
	(3, 12, 'Geral', 'Secretario', NULL, '2026-04-06', 'efetivo', NULL, '09:00-18:00', NULL, 1, NULL, '2026-04-06 12:03:31', '2026-04-06 12:03:31');

-- A despejar estrutura para tabela ulezi2_xpb.employee_responsibilities
DROP TABLE IF EXISTS `employee_responsibilities`;
CREATE TABLE IF NOT EXISTS `employee_responsibilities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int unsigned NOT NULL,
  `tipo_responsabilidade` enum('verificacao_documentos','verificacao_fisica','mediacao_negocios','suporte_clientes','consultoria','assinaturas','administrativo') NOT NULL,
  `descricao` text,
  `prioridade` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_resp_employee` (`employee_id`),
  CONSTRAINT `fk_employee_resp_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.employee_responsibilities: ~8 rows (aproximadamente)
INSERT INTO `employee_responsibilities` (`id`, `employee_id`, `tipo_responsabilidade`, `descricao`, `prioridade`, `is_active`, `created_at`) VALUES
	(1, 1, 'mediacao_negocios', NULL, 1, 1, '2026-04-02 21:27:29'),
	(2, 1, 'verificacao_fisica', NULL, 2, 1, '2026-04-02 21:27:29'),
	(3, 1, 'suporte_clientes', NULL, 3, 1, '2026-04-02 21:27:29'),
	(4, 1, 'consultoria', NULL, 4, 1, '2026-04-02 21:27:29'),
	(5, 1, 'assinaturas', NULL, 5, 1, '2026-04-02 21:27:29'),
	(12, 3, 'suporte_clientes', NULL, 1, 1, '2026-04-06 12:03:31'),
	(13, 3, 'verificacao_fisica', NULL, 2, 1, '2026-04-06 12:03:31'),
	(14, 3, 'mediacao_negocios', NULL, 3, 1, '2026-04-06 12:03:31');

-- A despejar estrutura para tabela ulezi2_xpb.enrollments
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `numero_inscricao` varchar(20) NOT NULL,
  `student_id` int unsigned NOT NULL,
  `course_id` int unsigned NOT NULL,
  `center_id` int unsigned DEFAULT NULL,
  `offering_id` int DEFAULT NULL,
  `municipio_aluno` varchar(100) DEFAULT NULL,
  `provincia_aluno` varchar(100) DEFAULT NULL,
  `status` enum('pendente','confirmada','cancelada','concluida') DEFAULT 'pendente',
  `payment_status` enum('pendente','pago','reembolsado') DEFAULT 'pendente',
  `observacoes` text,
  `documento_requisito_url` varchar(255) DEFAULT NULL,
  `documento_requisito_nome` varchar(255) DEFAULT NULL,
  `documento_requisito_mime` varchar(120) DEFAULT NULL,
  `comprovativo_visualizado_em` datetime DEFAULT NULL,
  `documento_visualizado_em` datetime DEFAULT NULL,
  `motivo_rejeicao` text,
  `aprovado_by` int DEFAULT NULL,
  `aprovado_at` datetime DEFAULT NULL,
  `assigned_by` int unsigned DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_inscricao` (`numero_inscricao`),
  KEY `center_id` (`center_id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_student` (`student_id`),
  KEY `idx_course` (`course_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_3` FOREIGN KEY (`center_id`) REFERENCES `training_centers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `enrollments_ibfk_4` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.enrollments: ~3 rows (aproximadamente)
INSERT INTO `enrollments` (`id`, `numero_inscricao`, `student_id`, `course_id`, `center_id`, `offering_id`, `municipio_aluno`, `provincia_aluno`, `status`, `payment_status`, `observacoes`, `documento_requisito_url`, `documento_requisito_nome`, `documento_requisito_mime`, `comprovativo_visualizado_em`, `documento_visualizado_em`, `motivo_rejeicao`, `aprovado_by`, `aprovado_at`, `assigned_by`, `assigned_at`, `created_at`, `updated_at`) VALUES
	(1, 'UXB-2026-83673', 3, 11, 2, 8191, 'Viana', 'Luanda', 'pendente', 'pendente', 'aaaaamfn gkgkk', '/uploads/inscricoes/inscricao_1774914354765-903297569.pdf', 'cv_agidruba_copia.pdf', 'application/pdf', NULL, '2026-03-31 01:18:31', NULL, NULL, NULL, NULL, NULL, '2026-03-31 00:45:54', '2026-03-31 01:18:31'),
	(2, 'UXB-2026-79765', 3, 3, 4, 52, 'Huambo', 'Huqmbo', 'confirmada', 'pago', 'Nececidade', NULL, NULL, NULL, '2026-04-05 21:20:41', NULL, NULL, 1, '2026-03-31 01:23:28', NULL, NULL, '2026-03-31 01:21:40', '2026-04-05 21:20:41'),
	(3, 'UXB-2026-28919', 3, 4, 3, 43, 'Cacuaco', 'Luanda', 'confirmada', 'pago', 'Sem', '/uploads/inscricoes/inscricao_1774934926180-77015034.pdf', 'cv_agidruba_copia.pdf', 'application/pdf', '2026-04-05 21:21:48', '2026-04-05 21:21:57', NULL, 1, '2026-04-02 17:28:30', NULL, NULL, '2026-03-31 06:28:46', '2026-04-05 21:21:57');

-- A despejar estrutura para tabela ulezi2_xpb.investment_opportunities
DROP TABLE IF EXISTS `investment_opportunities`;
CREATE TABLE IF NOT EXISTS `investment_opportunities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `tipo` enum('venda_empresa','participacao','licenciamento','franquia','investimento') NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `valor` decimal(15,2) DEFAULT NULL,
  `moeda` varchar(10) DEFAULT 'Kz',
  `dados_especificos` json DEFAULT NULL,
  `imagem_url` varchar(255) DEFAULT NULL,
  `status` enum('ativa','pausada','concluida','cancelada') DEFAULT 'ativa',
  `views_count` int unsigned DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_status` (`status`),
  CONSTRAINT `investment_opportunities_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.investment_opportunities: ~5 rows (aproximadamente)
INSERT INTO `investment_opportunities` (`id`, `company_id`, `tipo`, `titulo`, `descricao`, `valor`, `moeda`, `dados_especificos`, `imagem_url`, `status`, `views_count`, `created_at`, `updated_at`) VALUES
	(1, 1, 'participacao', 'Venda de 30% de Participação na TechCorp Angola', 'A TechCorp Angola é uma empresa de tecnologia fundada em 2020, com crescimento de 40% ao ano. Procuramos um investidor estratégico para financiar a expansão para Huambo, Benguela e Cabinda. O investidor terá acesso ao conselho de administração e relatórios mensais.', 5000000.00, 'Kz', '{"direitos": "Acesso ao conselho de administração", "garantias": "Activos da empresa avaliados em 20M Kz", "percentagem": "30%", "prazo_retorno": "3 anos", "retorno_esperado": "25% ao ano"}', NULL, 'ativa', 0, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(2, 3, 'participacao', 'Vendo 50% da minha empresa', 'A minha empresa é avalia em 10.000.000', 50000000.00, 'AOA', '{"termos": "tudo que a empresa ganhar dividimos e 50%", "prazo_pagamento": "12", "retorno_percentual": "50%", "participacao_percentual": "50%"}', NULL, 'ativa', 0, '2026-04-02 11:38:24', '2026-04-02 11:38:24'),
	(3, 3, 'investimento', 'Procura de investimento', 'Procurode investimento', 10000000.00, 'AOA', '{"termos": "Prometo entregar", "prazo_pagamento": "12", "retorno_percentual": "12000000", "participacao_percentual": "20%"}', NULL, 'ativa', 0, '2026-04-03 22:54:58', '2026-04-03 22:54:58'),
	(4, 3, 'franquia', 'Expansão por Fanquia', 'Pretendo expandir  a empresa a, procurando novos socios', 5000000.00, 'AOA', '{"termos": "Devolução a tempo integral", "prazo_pagamento": "12", "retorno_percentual": "5000000", "participacao_percentual": "5%"}', NULL, 'ativa', 0, '2026-04-06 08:43:28', '2026-04-06 08:43:28'),
	(5, 3, 'licenciamento', 'Licenciamento de Marca', 'Venda de Calçados da cidade da china', 50000.00, 'AOA', '{"termos": "idgeigfbkdbih\\nuiyowrgyy", "prazo_pagamento": "12", "retorno_percentual": "5000", "participacao_percentual": "10%"}', NULL, 'ativa', 0, '2026-04-06 14:21:14', '2026-04-06 14:21:14');

-- A despejar estrutura para tabela ulezi2_xpb.investor_interests
DROP TABLE IF EXISTS `investor_interests`;
CREATE TABLE IF NOT EXISTS `investor_interests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `investor_id` int unsigned NOT NULL,
  `opportunity_id` int unsigned NOT NULL,
  `mensagem` text,
  `status` enum('pendente','em_analise','em_mediacao','aprovado','rejeitado','cancelado','concluido') DEFAULT 'pendente',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_investor_opp` (`investor_id`,`opportunity_id`),
  KEY `opportunity_id` (`opportunity_id`),
  CONSTRAINT `investor_interests_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `investor_interests_ibfk_2` FOREIGN KEY (`opportunity_id`) REFERENCES `investment_opportunities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.investor_interests: ~5 rows (aproximadamente)
INSERT INTO `investor_interests` (`id`, `investor_id`, `opportunity_id`, `mensagem`, `status`, `created_at`, `updated_at`) VALUES
	(1, 8, 2, NULL, 'aprovado', '2026-04-02 22:35:19', '2026-04-03 07:43:49'),
	(2, 8, 1, NULL, 'cancelado', '2026-04-03 22:33:15', '2026-04-04 05:19:03'),
	(3, 8, 3, NULL, 'aprovado', '2026-04-03 22:55:29', '2026-04-06 13:07:08'),
	(4, 10, 4, NULL, 'aprovado', '2026-04-06 08:44:26', '2026-04-06 09:10:31'),
	(5, 10, 5, NULL, 'aprovado', '2026-04-06 14:24:31', '2026-04-06 14:40:56');

-- A despejar estrutura para tabela ulezi2_xpb.investor_profiles
DROP TABLE IF EXISTS `investor_profiles`;
CREATE TABLE IF NOT EXISTS `investor_profiles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `areas_interesse` text,
  `descricao` text,
  `provincia` varchar(100) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `investor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.investor_profiles: ~3 rows (aproximadamente)
INSERT INTO `investor_profiles` (`id`, `user_id`, `areas_interesse`, `descricao`, `provincia`, `municipio`, `is_public`, `created_at`, `updated_at`) VALUES
	(1, 4, 'Tecnologia, Educação, Saúde', 'Investidora com foco em startups angolanas.', 'Luanda', 'Luanda', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(2, 8, NULL, NULL, 'Luanda', 'Viana', 1, '2026-04-02 12:21:36', '2026-04-02 12:21:36'),
	(3, 10, NULL, NULL, 'Luanda', 'Viana', 1, '2026-04-06 08:38:14', '2026-04-06 08:38:14');

-- A despejar estrutura para tabela ulezi2_xpb.job_postings
DROP TABLE IF EXISTS `job_postings`;
CREATE TABLE IF NOT EXISTS `job_postings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `empresa` varchar(200) DEFAULT NULL,
  `descricao` text NOT NULL,
  `requisitos` text,
  `localizacao` varchar(200) DEFAULT NULL,
  `tipo` enum('efetivo','temporario','estagio','freelance') DEFAULT 'efetivo',
  `salario` varchar(100) DEFAULT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `status` enum('ativa','encerrada') DEFAULT 'ativa',
  `admin_id` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `job_postings_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.job_postings: ~2 rows (aproximadamente)
INSERT INTO `job_postings` (`id`, `titulo`, `empresa`, `descricao`, `requisitos`, `localizacao`, `tipo`, `salario`, `contacto`, `status`, `admin_id`, `created_at`, `expires_at`) VALUES
	(1, 'Desenvolvedor Web Full Stack', 'TechCorp Angola', 'Procuramos um desenvolvedor web motivado para integrar a nossa equipa em expansão. Trabalhará em projetos inovadores de transformação digital para clientes em Angola.', 'React.js, Node.js, MySQL. Mínimo 2 anos de experiência. Inglês básico.', 'Luanda, Angola', 'efetivo', '150.000 - 250.000 Kz/mês', 'rh@techcorp.ao', 'ativa', 1, '2026-03-28 00:01:37', NULL),
	(2, 'Designer Gráfico Júnior', 'Ulezi XPB', 'Vaga para designer gráfico para criação de conteúdo digital, identidade visual e materiais de marketing.', 'Adobe Photoshop, Illustrator, Canva. Portfolio obrigatório.', 'Luanda, Angola', 'efetivo', '80.000 - 120.000 Kz/mês', 'rh@ulezixpb.com', 'ativa', 1, '2026-03-28 00:01:37', NULL);

-- A despejar estrutura para tabela ulezi2_xpb.mediations
DROP TABLE IF EXISTS `mediations`;
CREATE TABLE IF NOT EXISTS `mediations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `interest_id` int unsigned NOT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  `mediator_user_id` int unsigned DEFAULT NULL,
  `company_id` int unsigned NOT NULL,
  `investor_id` int unsigned NOT NULL,
  `status` enum('pendente','em_analise','agendada','em_andamento','concluida','cancelada') DEFAULT 'pendente',
  `etapa_atual` enum('triagem','documentacao','reuniao_inicial','negociacao','contrato','assinatura','concluido') DEFAULT 'triagem',
  `data_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_conclusao` timestamp NULL DEFAULT NULL,
  `prioridade` enum('baixa','media','alta','urgente') DEFAULT 'media',
  `observacoes_internas` text,
  `resultado_final` enum('pendente','sucesso','insucesso','cancelado') DEFAULT 'pendente',
  `motivo_cancelamento` varchar(500) DEFAULT NULL,
  `valor_negociado` decimal(15,2) DEFAULT NULL,
  `percentagem_negociado` decimal(5,2) DEFAULT NULL,
  `termos_adicionais` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mediations_interest` (`interest_id`),
  KEY `fk_mediations_employee` (`employee_id`),
  KEY `fk_mediations_company` (`company_id`),
  KEY `fk_mediations_investor` (`investor_id`),
  CONSTRAINT `fk_mediations_company` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mediations_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mediations_interest` FOREIGN KEY (`interest_id`) REFERENCES `investor_interests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mediations_investor` FOREIGN KEY (`investor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.mediations: ~5 rows (aproximadamente)
INSERT INTO `mediations` (`id`, `interest_id`, `employee_id`, `mediator_user_id`, `company_id`, `investor_id`, `status`, `etapa_atual`, `data_inicio`, `data_conclusao`, `prioridade`, `observacoes_internas`, `resultado_final`, `motivo_cancelamento`, `valor_negociado`, `percentagem_negociado`, `termos_adicionais`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 9, 3, 8, 'concluida', 'reuniao_inicial', '2026-04-02 21:35:19', '2026-04-03 06:43:49', 'media', 'Chegaram a um acordo e o investidor pagou todo valor proposto', 'sucesso', NULL, 50000000.00, NULL, NULL, '2026-04-02 21:35:19', '2026-04-03 06:43:49'),
	(2, 2, 1, 9, 1, 8, 'concluida', 'reuniao_inicial', '2026-04-03 21:33:15', '2026-04-04 04:19:03', 'media', NULL, 'insucesso', NULL, NULL, NULL, NULL, '2026-04-03 21:33:15', '2026-04-04 04:19:03'),
	(3, 3, 1, 9, 3, 8, 'concluida', 'reuniao_inicial', '2026-04-03 21:55:29', '2026-04-03 22:08:39', 'media', 'Valor incial', 'sucesso', NULL, 12000000.00, NULL, NULL, '2026-04-03 21:55:29', '2026-04-03 22:08:39'),
	(4, 4, 1, 9, 3, 10, 'concluida', 'reuniao_inicial', '2026-04-06 07:44:26', '2026-04-06 07:54:59', 'media', 'Negociação em curso', 'sucesso', NULL, 5000000.00, NULL, NULL, '2026-04-06 07:44:26', '2026-04-06 07:54:59'),
	(5, 5, 1, 9, 3, 10, 'concluida', 'reuniao_inicial', '2026-04-06 13:24:31', '2026-04-06 13:36:55', 'media', NULL, 'sucesso', NULL, 50000.00, NULL, NULL, '2026-04-06 13:24:31', '2026-04-06 13:36:55');

-- A despejar estrutura para tabela ulezi2_xpb.messages
DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` int unsigned NOT NULL,
  `receiver_id` int unsigned NOT NULL,
  `conteudo` text NOT NULL,
  `lida` tinyint(1) DEFAULT '0',
  `lida_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.messages: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `mensagem` text NOT NULL,
  `lida` tinyint(1) DEFAULT '0',
  `lida_at` datetime DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_lida` (`user_id`,`lida`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.notifications: ~96 rows (aproximadamente)
INSERT INTO `notifications` (`id`, `user_id`, `tipo`, `titulo`, `mensagem`, `lida`, `lida_at`, `link`, `created_at`) VALUES
	(1, 1, 'sistema', 'Sistema instalado com sucesso!', 'O sistema Ulezi XPB está operacional. Bem-vindo ao painel administrativo.', 1, '2026-03-31 01:22:59', NULL, '2026-03-28 00:01:37'),
	(2, 1, 'inscricao', 'Nova inscrição para validação', 'Existe uma nova inscrição (UXB-2026-79765) à espera de análise documental.', 1, '2026-03-31 01:22:56', '/admin?secao=inscricoes', '2026-03-31 01:21:40'),
	(3, 2, 'inscricao', 'Nova inscrição para validação', 'Existe uma nova inscrição (UXB-2026-79765) à espera de análise documental.', 0, NULL, '/admin?secao=inscricoes', '2026-03-31 01:21:40'),
	(4, 3, 'inscricao', 'Inscrição submetida', 'A sua inscrição UXB-2026-79765 foi submetida e aguarda validação administrativa.', 0, NULL, '/dashboard/aluno', '2026-03-31 01:21:40'),
	(5, 3, 'inscricao', 'Inscrição aprovada', 'A sua inscrição foi aprovada. O recibo REC-UXB-2026-79765 já está disponível no histórico.', 0, NULL, '/dashboard/aluno', '2026-03-31 01:23:29'),
	(6, 2, 'inscricao', 'Nova inscrição para validação', 'Existe uma nova inscrição (UXB-2026-28919) à espera de análise documental.', 0, NULL, '/admin?secao=inscricoes', '2026-03-31 06:28:46'),
	(7, 1, 'inscricao', 'Nova inscrição para validação', 'Existe uma nova inscrição (UXB-2026-28919) à espera de análise documental.', 0, NULL, '/admin?secao=inscricoes', '2026-03-31 06:28:46'),
	(8, 3, 'inscricao', 'Inscrição submetida', 'A sua inscrição UXB-2026-28919 foi submetida e aguarda validação administrativa.', 0, NULL, '/dashboard/aluno', '2026-03-31 06:28:46'),
	(9, 1, 'assinatura_pendente', 'Nova assinatura pendente', 'Empresa #3 solicitou o plano Básico. Referência: ULEZI-2-439762', 0, NULL, NULL, '2026-04-01 22:20:39'),
	(10, 1, 'assinatura_pendente', 'Nova assinatura com comprovativo', 'A empresa VayaSoft submeteu a assinatura do plano Básico com comprovativo para validação.', 0, NULL, NULL, '2026-04-01 23:39:39'),
	(11, 2, 'assinatura_pendente', 'Nova assinatura com comprovativo', 'A empresa VayaSoft submeteu a assinatura do plano Básico com comprovativo para validação.', 0, NULL, NULL, '2026-04-01 23:39:39'),
	(12, 7, 'assinatura_aprovada', 'Assinatura activada', 'O pacote Básico foi activado para a sua empresa. O acesso completo já está disponível.', 0, NULL, NULL, '2026-04-01 23:40:25'),
	(13, 3, 'inscricao', 'Inscrição aprovada', 'A sua inscrição foi aprovada. O recibo REC-UXB-2026-28919 já está disponível no histórico.', 0, NULL, '/dashboard/aluno', '2026-04-02 17:28:30'),
	(14, 1, 'interest', 'Novo interesse de investidor', 'Maier Venâncio manifestou interesse em "Vendo 50% da minha empresa". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-02 22:35:19'),
	(15, 9, 'interest', 'Novo interesse de investidor', 'Maier Venâncio manifestou interesse em "Vendo 50% da minha empresa". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-02 22:35:19'),
	(16, 8, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'A sua reuniao com a empresa VayaSoft foi agendada para 2026-04-03 as 10:00:00.', 0, NULL, NULL, '2026-04-02 22:35:19'),
	(17, 7, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Foi agendada uma reuniao de mediacao com o investidor Maier Venâncio para 2026-04-03 as 10:00:00.', 0, NULL, NULL, '2026-04-02 22:35:19'),
	(18, 9, 'nova_mediacao', 'Nova mediacao atribuida', 'Foi-lhe atribuida a mediacao da oportunidade "Vendo 50% da minha empresa" com reuniao inicial marcada para 2026-04-03 as 10:00:00.', 0, NULL, NULL, '2026-04-02 22:35:19'),
	(19, 8, 'reuniao_agendada', 'Reunião de mediação agendada', 'Reunião agendada para 2026-04-03 às 09:00 com a empresa VayaSoft', 0, NULL, NULL, '2026-04-02 22:45:18'),
	(20, 7, 'reuniao_agendada', 'Reunião de mediação agendada', 'Reunião agendada para 2026-04-03 às 09:00 com o investidor Maier Venâncio', 0, NULL, NULL, '2026-04-02 22:45:18'),
	(21, 8, 'reuniao_agendada', 'Reunião de mediação agendada', 'Reunião agendada para 2026-04-03 às 09:00 com a empresa VayaSoft', 0, NULL, NULL, '2026-04-02 22:45:20'),
	(22, 7, 'reuniao_agendada', 'Reunião de mediação agendada', 'Reunião agendada para 2026-04-03 às 09:00 com o investidor Maier Venâncio', 0, NULL, NULL, '2026-04-02 22:45:20'),
	(23, 8, 'reuniao_cancelada', 'Reunião cancelada', 'Imprevisto operacional.', 0, NULL, NULL, '2026-04-03 00:21:52'),
	(24, 7, 'reuniao_cancelada', 'Reunião cancelada', 'Imprevisto operacional.', 0, NULL, NULL, '2026-04-03 00:21:52'),
	(25, 8, 'reuniao_cancelada', 'Reunião cancelada', 'Imprevisto operacional.', 0, NULL, NULL, '2026-04-03 00:24:48'),
	(26, 7, 'reuniao_cancelada', 'Reunião cancelada', 'Imprevisto operacional.', 0, NULL, NULL, '2026-04-03 00:24:48'),
	(27, 8, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 07:00.', 0, NULL, NULL, '2026-04-03 00:26:44'),
	(28, 7, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 07:00.', 0, NULL, NULL, '2026-04-03 00:26:44'),
	(29, 9, 'mediacao_transferida', 'Mediação atribuída', 'Uma mediação foi atribuída a si.', 0, NULL, NULL, '2026-04-03 07:42:05'),
	(30, 8, 'mediacao_concluida', 'Mediação: sucesso', 'A mediação foi concluída com sucesso! Parabéns pelo negócio com VayaSoft.', 0, NULL, NULL, '2026-04-03 07:43:49'),
	(31, 7, 'mediacao_concluida', 'Mediação: sucesso', 'A mediação foi concluída com sucesso! Parabéns pelo negócio com VayaSoft.', 0, NULL, NULL, '2026-04-03 07:43:49'),
	(32, 1, 'interest', 'Novo interesse de investidor', 'Maier Venâncio manifestou interesse em "Venda de 30% de Participação na TechCorp Angola". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-03 22:33:15'),
	(33, 9, 'interest', 'Novo interesse de investidor', 'Maier Venâncio manifestou interesse em "Venda de 30% de Participação na TechCorp Angola". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-03 22:33:15'),
	(34, 8, 'mediacao_iniciada', 'Processo de mediacao iniciado', 'O seu interesse em "Venda de 30% de Participação na TechCorp Angola" entrou em mediacao. O mediador responsavel sera Bartolomeu Orlando.', 0, NULL, NULL, '2026-04-03 22:33:15'),
	(35, 5, 'novo_interesse', 'Novo interesse em sua oportunidade', 'O investidor Maier Venâncio demonstrou interesse em "Venda de 30% de Participação na TechCorp Angola". A equipa da plataforma iniciou a mediacao.', 0, NULL, NULL, '2026-04-03 22:33:15'),
	(36, 9, 'nova_mediacao', 'Nova mediacao atribuida', 'Foi-lhe atribuida a mediacao da oportunidade "Venda de 30% de Participação na TechCorp Angola" entre Maier Venâncio e TechCorp Angola Lda.', 0, NULL, NULL, '2026-04-03 22:33:15'),
	(37, 8, 'reuniao_agendada', 'Reunião de mediação agendada', 'Reunião marcada para 2026-04-03 às 22:38.', 0, NULL, NULL, '2026-04-03 22:36:56'),
	(38, 5, 'reuniao_agendada', 'Reunião de mediação agendada', 'Reunião marcada para 2026-04-03 às 22:38.', 0, NULL, NULL, '2026-04-03 22:36:56'),
	(39, 8, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 22:38:00.', 0, NULL, NULL, '2026-04-03 22:37:47'),
	(40, 5, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 22:38:00.', 0, NULL, NULL, '2026-04-03 22:37:47'),
	(41, 8, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 22:38:00.', 0, NULL, NULL, '2026-04-03 22:39:02'),
	(42, 5, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 22:38:00.', 0, NULL, NULL, '2026-04-03 22:39:02'),
	(43, 8, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 22:40.', 0, NULL, NULL, '2026-04-03 22:39:32'),
	(44, 5, 'reuniao_reagendada', 'Reunião de mediação reagendada', 'Reunião marcada para 2026-04-03 às 22:40.', 0, NULL, NULL, '2026-04-03 22:39:32'),
	(45, 8, 'reuniao_reagendada', 'Reuniao de mediacao reagendada', 'Reuniao marcada para 2026-04-03 as 23:00.', 0, NULL, NULL, '2026-04-03 22:49:27'),
	(46, 5, 'reuniao_reagendada', 'Reuniao de mediacao reagendada', 'Reuniao marcada para 2026-04-03 as 23:00.', 0, NULL, NULL, '2026-04-03 22:49:27'),
	(47, 1, 'interest', 'Novo interesse de investidor', 'Maier Venâncio manifestou interesse em "Procura de investimento". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-03 22:55:29'),
	(48, 9, 'interest', 'Novo interesse de investidor', 'Maier Venâncio manifestou interesse em "Procura de investimento". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-03 22:55:29'),
	(49, 8, 'mediacao_iniciada', 'Processo de mediacao iniciado', 'O seu interesse em "Procura de investimento" entrou em mediacao. O mediador responsavel sera Bartolomeu Orlando.', 0, NULL, NULL, '2026-04-03 22:55:29'),
	(50, 7, 'novo_interesse', 'Novo interesse em sua oportunidade', 'O investidor Maier Venâncio demonstrou interesse em "Procura de investimento". A equipa da plataforma iniciou a mediacao.', 0, NULL, NULL, '2026-04-03 22:55:29'),
	(51, 9, 'nova_mediacao', 'Nova mediacao atribuida', 'Foi-lhe atribuida a mediacao da oportunidade "Procura de investimento" entre Maier Venâncio e VayaSoft.', 0, NULL, NULL, '2026-04-03 22:55:29'),
	(52, 8, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Reuniao marcada para 2026-04-03 as 23:01.', 0, NULL, NULL, '2026-04-03 22:58:27'),
	(53, 7, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Reuniao marcada para 2026-04-03 as 23:01.', 0, NULL, NULL, '2026-04-03 22:58:27'),
	(54, 8, 'mediacao_concluida', 'Mediacao: sucesso', 'A mediacao foi concluida com sucesso! Parabens pelo negocio com VayaSoft.', 0, NULL, NULL, '2026-04-03 23:08:39'),
	(55, 7, 'mediacao_concluida', 'Mediacao: sucesso', 'A mediacao foi concluida com sucesso! Parabens pelo negocio com VayaSoft.', 0, NULL, NULL, '2026-04-03 23:08:39'),
	(56, 8, 'contrato_gerado', 'Contrato gerado', 'O contrato da oportunidade "Procura de investimento" foi gerado e ja esta disponivel no seu perfil.', 0, NULL, NULL, '2026-04-03 23:08:39'),
	(57, 7, 'contrato_gerado', 'Contrato gerado', 'O contrato da oportunidade "Procura de investimento" foi gerado e ja esta disponivel no perfil da empresa.', 0, NULL, NULL, '2026-04-03 23:08:39'),
	(58, 8, 'mediacao_concluida', 'Mediacao: insucesso', 'A mediacao nao resultou em acordo. As partes nao chegaram a um consenso.', 0, NULL, NULL, '2026-04-04 05:19:03'),
	(59, 5, 'mediacao_concluida', 'Mediacao: insucesso', 'A mediacao nao resultou em acordo. As partes nao chegaram a um consenso.', 0, NULL, NULL, '2026-04-04 05:19:03'),
	(60, 6, 'empresa_aprovada', '🎉 Empresa aprovada!', 'A sua empresa foi verificada e aprovada. Já pode publicar oportunidades de investimento.', 0, NULL, NULL, '2026-04-05 21:27:32'),
	(61, 1, 'interest', 'Novo interesse de investidor', 'Nuno Almeida manifestou interesse em "Expansão por Fanquia". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-06 08:44:26'),
	(62, 9, 'interest', 'Novo interesse de investidor', 'Nuno Almeida manifestou interesse em "Expansão por Fanquia". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-06 08:44:26'),
	(63, 10, 'mediacao_iniciada', 'Processo de mediacao iniciado', 'O seu interesse em "Expansão por Fanquia" entrou em mediacao. O mediador responsavel sera Bartolomeu Orlando.', 0, NULL, NULL, '2026-04-06 08:44:26'),
	(64, 7, 'novo_interesse', 'Novo interesse em sua oportunidade', 'O investidor Nuno Almeida demonstrou interesse em "Expansão por Fanquia". A equipa da plataforma iniciou a mediacao.', 0, NULL, NULL, '2026-04-06 08:44:26'),
	(65, 9, 'nova_mediacao', 'Nova mediacao atribuida', 'Foi-lhe atribuida a mediacao da oportunidade "Expansão por Fanquia" entre Nuno Almeida e VayaSoft.', 0, NULL, NULL, '2026-04-06 08:44:26'),
	(66, 10, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Reuniao marcada para 2026-04-06 as 08:50.', 0, NULL, NULL, '2026-04-06 08:50:54'),
	(67, 7, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Reuniao marcada para 2026-04-06 as 08:50.', 0, NULL, NULL, '2026-04-06 08:50:54'),
	(68, 10, 'mediacao_concluida', 'Mediacao: sucesso', 'A mediacao foi concluida com sucesso! Parabens pelo negocio com VayaSoft.', 0, NULL, NULL, '2026-04-06 08:54:59'),
	(69, 7, 'mediacao_concluida', 'Mediacao: sucesso', 'A mediacao foi concluida com sucesso! Parabens pelo negocio com VayaSoft.', 0, NULL, NULL, '2026-04-06 08:54:59'),
	(70, 10, 'assinatura_contrato', 'Assinatura pendente de contrato', 'O contrato da oportunidade "Expansão por Fanquia" foi criado e aguarda a sua confirmacao de assinatura digital no sistema.', 0, NULL, NULL, '2026-04-06 08:54:59'),
	(71, 7, 'assinatura_contrato', 'Assinatura pendente de contrato', 'O contrato da oportunidade "Expansão por Fanquia" foi criado e aguarda a sua confirmacao de assinatura digital no sistema.', 0, NULL, NULL, '2026-04-06 08:54:59'),
	(72, 7, 'assinatura_contrato', 'Assinatura pendente de contrato', 'A contraparte ja confirmou a assinatura do contrato #2. Falta agora a sua confirmacao digital para concluir o documento.', 0, NULL, '/contratos/2', '2026-04-06 08:56:51'),
	(73, 8, 'assinatura_contrato', 'Assinatura pendente de contrato', 'A contraparte ja confirmou a assinatura do contrato #1. Falta agora a sua confirmacao digital para concluir o documento.', 0, NULL, '/contratos/1', '2026-04-06 08:57:00'),
	(74, 8, 'contrato_assinado', 'Contrato validado', 'O contrato #1 foi assinado por ambas as partes e o PDF final ja esta disponivel no sistema.', 0, NULL, '/contratos/1', '2026-04-06 13:07:08'),
	(75, 7, 'contrato_assinado', 'Contrato validado', 'O contrato #1 foi assinado por ambas as partes e o PDF final ja esta disponivel no sistema.', 0, NULL, '/contratos/1', '2026-04-06 13:07:08'),
	(76, 13, 'empresa_aprovada', '🎉 Empresa aprovada!', 'A sua empresa foi verificada e aprovada. Já pode publicar oportunidades de investimento.', 0, NULL, NULL, '2026-04-06 13:57:19'),
	(77, 1, 'assinatura_pendente', 'Nova assinatura com comprovativo', 'A empresa Solimpo submeteu a assinatura do plano Básico com comprovativo para validação.', 0, NULL, NULL, '2026-04-06 14:00:02'),
	(78, 2, 'assinatura_pendente', 'Nova assinatura com comprovativo', 'A empresa Solimpo submeteu a assinatura do plano Básico com comprovativo para validação.', 0, NULL, NULL, '2026-04-06 14:00:02'),
	(79, 9, 'assinatura_pendente', 'Nova assinatura com comprovativo', 'A empresa Solimpo submeteu a assinatura do plano Básico com comprovativo para validação.', 0, NULL, NULL, '2026-04-06 14:00:02'),
	(80, 12, 'assinatura_pendente', 'Nova assinatura com comprovativo', 'A empresa Solimpo submeteu a assinatura do plano Básico com comprovativo para validação.', 0, NULL, NULL, '2026-04-06 14:00:02'),
	(81, 13, 'assinatura_aprovada', 'Assinatura activada', 'O pacote Básico foi activado para a sua empresa. O acesso completo já está disponível.', 0, NULL, NULL, '2026-04-06 14:03:14'),
	(82, 1, 'interest', 'Novo interesse de investidor', 'Nuno Almeida manifestou interesse em "Licenciamento de Marca". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-06 14:24:31'),
	(83, 9, 'interest', 'Novo interesse de investidor', 'Nuno Almeida manifestou interesse em "Licenciamento de Marca". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-06 14:24:31'),
	(84, 12, 'interest', 'Novo interesse de investidor', 'Nuno Almeida manifestou interesse em "Licenciamento de Marca". Faca a triagem e inicie a mediacao antes de qualquer contacto com a empresa.', 0, NULL, NULL, '2026-04-06 14:24:31'),
	(85, 10, 'mediacao_iniciada', 'Processo de mediacao iniciado', 'O seu interesse em "Licenciamento de Marca" entrou em mediacao. O mediador responsavel sera Bartolomeu Orlando.', 0, NULL, NULL, '2026-04-06 14:24:31'),
	(86, 7, 'novo_interesse', 'Novo interesse em sua oportunidade', 'O investidor Nuno Almeida demonstrou interesse em "Licenciamento de Marca". A equipa da plataforma iniciou a mediacao.', 0, NULL, NULL, '2026-04-06 14:24:31'),
	(87, 9, 'nova_mediacao', 'Nova mediacao atribuida', 'Foi-lhe atribuida a mediacao da oportunidade "Licenciamento de Marca" entre Nuno Almeida e VayaSoft.', 0, NULL, NULL, '2026-04-06 14:24:31'),
	(88, 10, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Reuniao marcada para 2026-04-06 as 14:35.', 0, NULL, NULL, '2026-04-06 14:34:00'),
	(89, 7, 'reuniao_agendada', 'Reuniao de mediacao agendada', 'Reuniao marcada para 2026-04-06 as 14:35.', 0, NULL, NULL, '2026-04-06 14:34:00'),
	(90, 10, 'mediacao_concluida', 'Mediacao: sucesso', 'A mediacao foi concluida com sucesso! Parabens pelo negocio com VayaSoft.', 0, NULL, NULL, '2026-04-06 14:36:55'),
	(91, 7, 'mediacao_concluida', 'Mediacao: sucesso', 'A mediacao foi concluida com sucesso! Parabens pelo negocio com VayaSoft.', 0, NULL, NULL, '2026-04-06 14:36:55'),
	(92, 10, 'assinatura_contrato', 'Assinatura pendente de contrato', 'O contrato da oportunidade "Licenciamento de Marca" foi criado e aguarda a sua confirmacao de assinatura digital no sistema.', 0, NULL, NULL, '2026-04-06 14:36:55'),
	(93, 7, 'assinatura_contrato', 'Assinatura pendente de contrato', 'O contrato da oportunidade "Licenciamento de Marca" foi criado e aguarda a sua confirmacao de assinatura digital no sistema.', 0, NULL, NULL, '2026-04-06 14:36:55'),
	(94, 7, 'assinatura_contrato', 'Assinatura pendente de contrato', 'A contraparte ja confirmou a assinatura do contrato #3. Falta agora a sua confirmacao digital para concluir o documento.', 0, NULL, '/contratos/3', '2026-04-06 14:38:32'),
	(95, 10, 'contrato_assinado', 'Contrato validado', 'O contrato #3 foi assinado por ambas as partes e o PDF final ja esta disponivel no sistema.', 0, NULL, '/contratos/3', '2026-04-06 14:40:56'),
	(96, 7, 'contrato_assinado', 'Contrato validado', 'O contrato #3 foi assinado por ambas as partes e o PDF final ja esta disponivel no sistema.', 0, NULL, '/contratos/3', '2026-04-06 14:40:56');

-- A despejar estrutura para tabela ulezi2_xpb.password_resets
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.password_resets: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.payments
DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` int unsigned NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `metodo` enum('transferencia','referencia','multibanco','dinheiro','outro') DEFAULT 'outro',
  `referencia` varchar(100) DEFAULT NULL,
  `comprovativo_url` varchar(255) DEFAULT NULL,
  `status` enum('pendente','confirmado','rejeitado','reembolsado') DEFAULT 'pendente',
  `confirmado_by` int unsigned DEFAULT NULL,
  `confirmado_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `confirmado_by` (`confirmado_by`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`confirmado_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.payments: ~2 rows (aproximadamente)
INSERT INTO `payments` (`id`, `enrollment_id`, `valor`, `metodo`, `referencia`, `comprovativo_url`, `status`, `confirmado_by`, `confirmado_at`, `created_at`, `updated_at`) VALUES
	(1, 2, 20000.00, 'transferencia', 'BAI | 006012 | 2026-03-31', '/uploads/inscricoes/inscricao_1774916500565-584008620.pdf', 'confirmado', 1, '2026-03-31 01:23:28', '2026-03-31 01:21:40', '2026-03-31 01:23:28'),
	(2, 3, 18000.00, 'transferencia', 'Express | 00643 | 2026-03-31', '/uploads/inscricoes/inscricao_1774934926179-230709602.pdf', 'confirmado', 1, '2026-04-02 17:28:30', '2026-03-31 06:28:46', '2026-04-02 17:28:30');

-- A despejar estrutura para tabela ulezi2_xpb.receipts
DROP TABLE IF EXISTS `receipts`;
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` int unsigned NOT NULL,
  `numero_recibo` varchar(30) NOT NULL,
  `pdf_url` varchar(255) DEFAULT NULL,
  `pdf_data` longblob,
  `enviado_email` tinyint(1) DEFAULT '0',
  `enviado_whatsapp` tinyint(1) DEFAULT '0',
  `enviado_email_at` datetime DEFAULT NULL,
  `enviado_whatsapp_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollment_id` (`enrollment_id`),
  UNIQUE KEY `numero_recibo` (`numero_recibo`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.receipts: ~2 rows (aproximadamente)
INSERT INTO `receipts` (`id`, `enrollment_id`, `numero_recibo`, `pdf_url`, `pdf_data`, `enviado_email`, `enviado_whatsapp`, `enviado_email_at`, `enviado_whatsapp_at`, `created_at`) VALUES
	(1, 2, 'REC-UXB-2026-79765', NULL, _binary 0x255044462d312e330a25ffffffff0a382030206f626a0a3c3c0a2f54797065202f4578744753746174650a2f636120302e310a3e3e0a656e646f626a0a31302030206f626a0a3c3c0a2f54797065202f4578744753746174650a2f636120310a3e3e0a656e646f626a0a372030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e74732035203020520a2f5265736f75726365732036203020520a3e3e0a656e646f626a0a362030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f457874475374617465203c3c0a2f4773312038203020520a2f477332203130203020520a3e3e0a2f466f6e74203c3c0a2f46322039203020520a2f4631203131203020520a3e3e0a3e3e0a656e646f626a0a352030206f626a0a3c3c0a2f4c656e67746820313339300a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789ccd594d6f1b3710bdeb57f00f8499ef2101c387a46d801e0aa4f1ade8415eed16059a02a981f6ef17c3d5dada5d359583286b0bb06079450edf3cbe791c628204e91526484530979aba8fbb4fbbd7ef1e30fdf6b07bfd5dfff7ef5dfff3bb37a97bd8414642b562e4a2500b704d904da50256032fc2c89e207b29c44a5510ddc4d343f7e7eed30ecfcdf5e6eef8392606c95e13bbe7629aee3eee5eff40c920dd0dbb5f6e944485a50ac9709be0d774f7e3eefbbbddfb889522d6f7bb1846ab662a0901d25ffdd78c7f580c86295e97ad4c217929b9a24cab623aae4aa513d5bd54022d0a42b3b55d36b4592e5cc6a131c5246d68b0ced0c5d0ec3631a41b1b9c6ed32bd2746307430213530239ffefde7bb68140c1c90633abcece566db0ded0ba67062ac6596a2a91647c8cf5985c6f3fb791ec1bea5dad33f5bd552f0e46b749dae7c636d8e1d9f362664b5eea9979ad5aff848ec0579e593297e47e6ec574cfc4c242c095899980db6b7a9f537c41e3258b3941a6358db9b1177462f3856c1529d9909253cdd5cb445992ffd988178cac986b2403300bae462610912064955ef9b9634bc9c294cc29175d8d2dac24b5f38ec79c2e6257480425574a1f772a4d428e7fff718afedb0f5f2e221fdefeb4a3f4cfeec32a9d72f2c54863822ca779432c09b2c2ec31bd389b964b91a405b34e0284098f0224fdfd7e120225d3c7dda04efdde82f9d590f7b7a13437045f90954a92d43c9bd07276552d427460626062a3033bd79019d6cfee80ab16221909a05cb2184d4c9a7455e4c820149141b9b176f80264c649087381f524289daaf4cb5af74d85402149e55ced7137214eac093d6cc5a329a343d34db12198f29980af4a75e4320f189f02dedb3096b3e7d7572998496935a43abbb85a54d8dec53ecfd8eba7ca243b21ad72a551cdad5ab7656e0a67405c047902664f83e0c6004ac958419600aa8cc6c49a390881a46617ac37dd12d25a32a02ec23e857424fcdce3cc2c9e896dad2f8cd9b4da0a738840479cc777b7fe705a8e361319a0eca28bc84f602fae8e7630da1c5bd48c54d6e27d70b5deaa711fc25d37166dd045a4732ced122caf6a07141257c850ec522b20acaaa4bc75f566a3a7ca754200768ded859a6e9cb74d7fd14ceef3484f6b6c93dca8b3a15b1170f0d66a2bbae3e935e44d7c2cc6270f2d4fa8df1e7cd1f3f598dba95ccd438db79733c95c7511ed2c03bdb9c5ef623803786378a99eadd6d2f707b7a8d55bc2ea3557e545902fcbee30d2d9d22b1cd91e37d358809f1a458db18fbda14d796b90057cb18ab93b6f5d9b2e1a5dcf37fd546baec2ab71c30c62c0d2870eb52a7aeca485ee5f5aafae9e5c2a9c05695dfb3b1b2262ebacfafe4524122d03d122e2fff200ad1dd711bc840d44d1772de7f5fd585dcd831c5262dff4f802d49e2c93e03cf427aca31d69653c24606c7df4791b4e3469a9b9d652928226543dd7669f0cd631ea40bece519e7ae7c39976d855cd9c41228a7e795df75caaf4623228c921b8155cebfca0a24767172d32b86d770b37f14074c4c405e5202abdcad9cee2b7a5652c0f2403f08a976ac7636c6cfec1695c4c3b15e231ddbeb1141064205face0849ec4b09ffae4ddd82d977bff7cc457c71b8b67715a1b91435fa3233696866387758d78485babb7db621f0b898b0ab5955919adc0a807d63b9fb6889b31e48ddd60c4ae2513e9daccc87805f66861b8f56de232eb851899085e342bac3d0c33230d0ccc344c1df28d61a61257422b5ba1ec0de838864d66e8e5721d5db3155face6097772e4677bc640072d939db1302c432b2d752c2dd124d8368fb5665f570839d860ad9fbd715b5367019e00791f97c4cd588512ed635f5389124075bbfe9041b29addfc09d0e97a4b445bcac7de50d39f460589abc8d1595c8d08ff02282d3f510a656e6473747265616d0a656e646f626a0a31342030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203132203020520a2f5265736f7572636573203133203020520a3e3e0a656e646f626a0a31332030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f4631203131203020520a3e3e0a3e3e0a656e646f626a0a31322030206f626a0a3c3c0a2f4c656e677468203734370a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd55cb8adc3814ddfb2bf40351eefb4a507891d7c02c0666ba76218b8a2d43201d0881e4f70749b6cb9d6a663a0984a25c949ef73cee310608109e6180900463ca61ba1f9ebf2a5f3f4ce59f3f5e84e9cb0091502d19b928e4049c394024950c980d3c09237b80c8e8260e9a12b15296f065fa347c1ef0b12b5e9cd7710c06c19344c770be1f9ebfc18010cecbf0f6c44865acd327025167175302275363cb46b61018db62b3d7d1650ca8e1e43606d270322468df6cc5d9d8690ccfea02cbc50bb7cdf538303437b4d9d48a4b1f371b03433899bab81a5a1f2ff5e96cb9176373bd40552651bd4826d0a4203406aa459731c0bb70fe73787d1efe7e221196a325ba61820e4cfc1fa65a5bc15aa7ab5d4c2dbbd43a0bac741533cb6d6be36936dc37cbca69a3c2691d53829d90e5f18dda16565ea0dd50e5c936593669ece976d0559ecaba7317eda7b85289a672c3151fb8aaa5a14dae5dba5a42c7b197a1150f423895e697e624f5950143a78dd215c26295d6a359ba29e0a0459bce3b7db9d9b01f80ae36fd226eced1c86e70cbb15b6c6e3aa2f3414336b4d2d49d8e861f83d45dd3668f669c69455c6c7176ae109ab45399bd42e22ba8d6919513aaf3f5c6f5c49f01471235a71b707a0027cbc5ad3bcb991702e96557a775a1e65e365fc6a06d4f6d98ab85059a0aea17cb9e1c8cb6827b9c10f84440ef995858a8261e311370fb6cbf0fc069eddd06e97e50d14869fbfff118a72fef0688e9109b354603c4d40213b7006d437b8ef6e170f7f2af01c3b7e1ee269fe5f640390631620a10151e2cd327c6336a8a2a181c242aeccae42e8c3e4ce3e607f98f74f26bc3eda9dab56871d392830fe6d4363f133033d2c2c04c0b1303135bcd34efba205faa46ed997fd076e81e152458968820df2194477a7e4b8f826bc4f5d742ef3a6cfd520d87f5e57185bb8681f740b66ab199409ff03af931389262aafa5ae2e8dfeb05ddea35d9ae753d4cc32dc5ac6bd122105d5b89656dfe3dd7d71cbb86c7de85bfb1fbfe05e5fee3520a656e6473747265616d0a656e646f626a0a31362030206f626a0a285044464b6974290a656e646f626a0a31372030206f626a0a28554c455a49205850422053697374656d61290a656e646f626a0a31382030206f626a0a28443a32303236303333313030323332385a290a656e646f626a0a31392030206f626a0a28feff00520065006300690062006f00200064006500200049006e007300630072006900e700e3006f0020002d0020005500580042002d0032003000320036002d00370039003700360035290a656e646f626a0a32302030206f626a0a28554c455a4920585042290a656e646f626a0a32312030206f626a0a28feff0043006f006d00700072006f00760061006e0074006500200064006500200049006e007300630072006900e700e3006f00200065006d00200043007500720073006f290a656e646f626a0a31352030206f626a0a3c3c0a2f50726f6475636572203136203020520a2f43726561746f72203137203020520a2f4372656174696f6e44617465203138203020520a2f5469746c65203139203020520a2f417574686f72203230203020520a2f5375626a656374203231203020520a3e3e0a656e646f626a0a31312030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963610a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a392030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963612d426f6c640a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a342030206f626a0a3c3c0a3e3e0a656e646f626a0a332030206f626a0a3c3c0a2f54797065202f436174616c6f670a2f50616765732031203020520a2f4e616d65732032203020520a3e3e0a656e646f626a0a312030206f626a0a3c3c0a2f54797065202f50616765730a2f436f756e7420320a2f4b696473205b3720302052203134203020525d0a3e3e0a656e646f626a0a322030206f626a0a3c3c0a2f4465737473203c3c0a20202f4e616d6573205b0a5d0a3e3e0a3e3e0a656e646f626a0a787265660a302032320a303030303030303030302036353533352066200a30303030303033353532203030303030206e200a30303030303033363136203030303030206e200a30303030303033343930203030303030206e200a30303030303033343639203030303030206e200a30303030303030333536203030303030206e200a30303030303030323136203030303030206e200a30303030303030313036203030303030206e200a30303030303030303135203030303030206e200a30303030303033333637203030303030206e200a30303030303030303631203030303030206e200a30303030303033323639203030303030206e200a30303030303032303233203030303030206e200a30303030303031393332203030303030206e200a30303030303031383139203030303030206e200a30303030303033313438203030303030206e200a30303030303032383433203030303030206e200a30303030303032383638203030303030206e200a30303030303032393034203030303030206e200a30303030303032393430203030303030206e200a30303030303033303333203030303030206e200a30303030303033303631203030303030206e200a747261696c65720a3c3c0a2f53697a652032320a2f526f6f742033203020520a2f496e666f203135203020520a2f4944205b3c39323761623762383661343732363230666130343939353138316165363433363e203c39323761623762383661343732363230666130343939353138316165363433363e5d0a3e3e0a7374617274787265660a333636330a2525454f460a, 0, 0, NULL, NULL, '2026-03-31 01:23:29'),
	(2, 3, 'REC-UXB-2026-28919', NULL, _binary 0x255044462d312e330a25ffffffff0a382030206f626a0a3c3c0a2f54797065202f4578744753746174650a2f636120302e310a3e3e0a656e646f626a0a31302030206f626a0a3c3c0a2f54797065202f4578744753746174650a2f636120310a3e3e0a656e646f626a0a372030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e74732035203020520a2f5265736f75726365732036203020520a3e3e0a656e646f626a0a362030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f457874475374617465203c3c0a2f4773312038203020520a2f477332203130203020520a3e3e0a2f466f6e74203c3c0a2f46322039203020520a2f4631203131203020520a3e3e0a3e3e0a656e646f626a0a352030206f626a0a3c3c0a2f4c656e67746820313336380a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789ccd59cb8e1b3710bceb2bf803a6fbdd6c40d0c14e622087008ef716e4a01dcd0401e200ce02c9ef07e4482b6946b6b50bcbb3d241bb7a90cdea6255b3890912a457982015c15c22751f579f56afdf3d60fae361f5fa87fedf3fbbfed7776f52f7b0828c846ac5c845210a7024c8a6128061e04518d913642f85582904d14d3c3d747faf3eadf0d25c6feef6ef636290ec91d83d17d374f771f5fa274a06e96e58fdb65612159610926193e0f774f7f3eac7bbd5fb1a2bd558dfafea301a9aa9240448fff4df32fe613218a6fabc6e650ac94bc981725815d37e552a9da86e2508b428089dadedbaa1cd72e1320e8da94ed28606eb0c5d0ccd368921ad6d70daa457a4696d3b4302135302b9fc71ef3ddb40a0e064839985b3b3850dd61b5af7c440c5384ba452938c8fb1ee93ebedb1a9c95e53ef6a9da96f2dbc38186d92b4f78d6db0dd93e7c5cc96bcc485792dac3fa223f08d6796cc25b95f5a31dd33b1b01070303113707b1e5ecf293ea1f194c59c20d39cc6dcd80b7a60f3956c1529d9909253e4f072a02cc95736e215232be6a8c900cc82b3910944a41232a4577eead852b2302573ca4567630b2b4974def198d349ec0a89a0e4a0f471a5d22464ffff5fa7e8bffdf07c11f9f0f69715a5ff561f66e994931fd63426c8729a37c492202b9c7d4dafcea6e5522469c1ac0701c2847b0192fe7e7b100225d3c7dda04efdd62af3c390b79baa346b8267642548929a67139aceaeaa4588764c0c4c6cedafc2c1c8f1c51d705323929100ca258bd18149075d15d933084564506eac1d9e81cc3809612e309f04a553957eea75df5508149204e7b0c7dd8478604dd5c3661e4d191d9a6e8a0d95295f08f8a654472ee701e331e0ad0da39d3ddd5fa56026a5d990eaece26ad5617b17d3855365929d9066b9d2eae616d62d999bc2191027419e80d9d320b83080523206c8144095b130b1561c5481a4562e586fba24a45132a04ec23e857424fc798d7356e299d8d2fac2984dc36698430d74c4797c75eb77a776b498c80065179d447e027be75a05a1cac2c2d8a266a43217ef9dabf516c67d15ee5858b44127919e60c986c60d4ffe0a536f5a1028240ec850ecda62405855497969ff66a3a3779d50805deb06434d6be76509503493fb79a46714189abba251f5308be6b7e3c1d56d5c459589e989f4fb432d7ad97fb99dc2d5bcaaeff2f225994327d19ee06dcd2fd0fade0d9d17c694e2a2254bdfefdcaa212f89a5470ee549902faba661a48bfe2a6c5ab7d5d1658fdda046d3c706d0a26435c8023e59055e58c5f32a7b8ac8213c1bf7732daf76dcb9d6916e9e5b2a9c0569eeef9d0d56e3ec2c7cfb22f28896816812f1e77dbe35dd2ada2f600751edae96cbaabe7750f3da4c9552374e8f2f40e3c932099e877e449b95c0ca781418ad7322f3a2494be4885292822654bdd44c3f1451fba82bf2718ef2a1433e5c687addb460334844b52b1ef3ce4a482f268392ec2ab72ad73adfa9e8be7aab8d30d8b41b8475fd42ed7b890bca4e547a958bfdc3ef4bcbba3c900cc0335eaaed0fab75fb0f4ee362dad90ff7e9f685c5802003f9640527f4442edb4337bc1b7be272ef5f8ef8e67863f12c4ef34a64d747ed7bd5a3f4631f758e38d66e59ab6317c5be2ea45e47a8cdaa95b116d897d2bdf36923b8863e9ebc174e82964ca4f36a46c68baec71aa61d1a9a7fbf904aa6062f9a15e6454ced7cd3c0c042c3a10fbe30cc54eac5cfacb050f606b4ab73837a78c95c47d76cc527ab39e24e8efce4a2b1a28396c92e153132346b89d15a6a2360d93c46649f3b84ec6cb0d6b55eb879a967019e00795faf825b615595685bf735956a01b4e0a59041b2c86e7e04f4708925a22de563ffa7e94fa382d40bc7b1b2b81911fe072fc73a440a656e6473747265616d0a656e646f626a0a31342030206f626a0a3c3c0a2f54797065202f506167650a2f506172656e742031203020520a2f4d65646961426f78205b302030203539352e3238203834312e38395d0a2f436f6e74656e7473203132203020520a2f5265736f7572636573203133203020520a3e3e0a656e646f626a0a31332030206f626a0a3c3c0a2f50726f63536574205b2f504446202f54657874202f496d61676542202f496d61676543202f496d616765495d0a2f466f6e74203c3c0a2f4631203131203020520a3e3e0a3e3e0a656e646f626a0a31322030206f626a0a3c3c0a2f4c656e677468203734390a2f46696c746572202f466c6174654465636f64650a3e3e0a73747265616d0a789cbd55cb8a1b4714ddf757d40fb87cdfb70a442fecc4812c02c96817b250fa01814c2018ecdf37b7aad5ea190dc9c4862024d1f5bce7714f638204e90d26484530979aa6c7e1ed77cba73fa6e5971fdea5e9e3009950ad18b928d4025c394126950a580dbc08237b82cce8260e5a0ab15295f471fa6bf87bc097ae7877dec63119242f921dd3f97178fb0113423aafc3af27465ac6983e11883abb981238991a5b35b295c0d8569b3d46d731a1a693db9848d3c990a07dab2dcec64e637a130bac2ebe70db1cc781a1b9a1cda6b6b8f471b33131a493a98baba1f5f1257e9dadf6626c8e0b546512d58b54022d0a4263a2287a1913fc96ce3f0edf9f879f5f4984d56c85ee98a00313ff86296a5b30ea74b58ba95597a873818daec5cc6adbda789a0df7cdb271daa870dac6946027647d79a3b685c10bb41b429e6a935593c69e5e0fbac913ac3b77d1be8a2b956c2a775cf181ab280d6d72edd245091dc75e86061e84745a9a5f9a93d437060c9dae946e10560b5a8f66e9a68083166dbaeef4d566c37e00badaf48db8b96623bbc32dc76eb1b9e988ce070dd9d096a6ee7434fc9824764d577b34e34c1be2c55667e780d0a49d96d90312df40b58e0c4e28e6e3c6edc4af014792b5963b707a0027ebc5ad3bcb995702e96587d3ba50732f9b2f63d2b6271ae6666181a682fac5aa1707a36bc13d4e087c22a0df99585828128f9809b87daeff4fc069f46e83f438a868a6727dfef318a7ef1f06c8e5109b11a30972698189d7006d437b8ef6e1f4f0fea701d3e7e1e12e9fe5fe40390631624990159e2cd357c6336ac92a981c242beccad42e8c3e4de3e607f98774f25bc3eda9dab56871d392830fe6d4363f37ce895606165a99e2892d32cd431764e70b1317be303f53e61508ddb38224ab9211e4194279a1e7afe9b1e01671fdb5d0bb0e5bbf84e1305e1e37b85b18780f640b8bcd04fa8ad7c97f83232597d0d70a677fae1774ab47b2ddea7a9a86d714b3ae458b40746d252e5bf3efb9bee5d82d3cf62efc1fbbef0bec16e3550a656e6473747265616d0a656e646f626a0a31362030206f626a0a285044464b6974290a656e646f626a0a31372030206f626a0a28554c455a49205850422053697374656d61290a656e646f626a0a31382030206f626a0a28443a32303236303430323136323833305a290a656e646f626a0a31392030206f626a0a28feff00520065006300690062006f00200064006500200049006e007300630072006900e700e3006f0020002d0020005500580042002d0032003000320036002d00320038003900310039290a656e646f626a0a32302030206f626a0a28554c455a4920585042290a656e646f626a0a32312030206f626a0a28feff0043006f006d00700072006f00760061006e0074006500200064006500200049006e007300630072006900e700e3006f00200065006d00200043007500720073006f290a656e646f626a0a31352030206f626a0a3c3c0a2f50726f6475636572203136203020520a2f43726561746f72203137203020520a2f4372656174696f6e44617465203138203020520a2f5469746c65203139203020520a2f417574686f72203230203020520a2f5375626a656374203231203020520a3e3e0a656e646f626a0a31312030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963610a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a392030206f626a0a3c3c0a2f54797065202f466f6e740a2f42617365466f6e74202f48656c7665746963612d426f6c640a2f53756274797065202f54797065310a2f456e636f64696e67202f57696e416e7369456e636f64696e670a3e3e0a656e646f626a0a342030206f626a0a3c3c0a3e3e0a656e646f626a0a332030206f626a0a3c3c0a2f54797065202f436174616c6f670a2f50616765732031203020520a2f4e616d65732032203020520a3e3e0a656e646f626a0a312030206f626a0a3c3c0a2f54797065202f50616765730a2f436f756e7420320a2f4b696473205b3720302052203134203020525d0a3e3e0a656e646f626a0a322030206f626a0a3c3c0a2f4465737473203c3c0a20202f4e616d6573205b0a5d0a3e3e0a3e3e0a656e646f626a0a787265660a302032320a303030303030303030302036353533352066200a30303030303033353332203030303030206e200a30303030303033353936203030303030206e200a30303030303033343730203030303030206e200a30303030303033343439203030303030206e200a30303030303030333536203030303030206e200a30303030303030323136203030303030206e200a30303030303030313036203030303030206e200a30303030303030303135203030303030206e200a30303030303033333437203030303030206e200a30303030303030303631203030303030206e200a30303030303033323439203030303030206e200a30303030303032303031203030303030206e200a30303030303031393130203030303030206e200a30303030303031373937203030303030206e200a30303030303033313238203030303030206e200a30303030303032383233203030303030206e200a30303030303032383438203030303030206e200a30303030303032383834203030303030206e200a30303030303032393230203030303030206e200a30303030303033303133203030303030206e200a30303030303033303431203030303030206e200a747261696c65720a3c3c0a2f53697a652032320a2f526f6f742033203020520a2f496e666f203135203020520a2f4944205b3c33366562313736326339323135363064636133356638653764373662363161333e203c33366562313736326339323135363064636133356638653764373662363161333e5d0a3e3e0a7374617274787265660a333634330a2525454f460a, 0, 0, NULL, NULL, '2026-04-02 17:28:30');

-- A despejar estrutura para tabela ulezi2_xpb.scheduled_meetings
DROP TABLE IF EXISTS `scheduled_meetings`;
CREATE TABLE IF NOT EXISTS `scheduled_meetings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `mediation_id` int unsigned NOT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  `mediator_user_id` int unsigned DEFAULT NULL,
  `company_id` int unsigned NOT NULL,
  `investor_id` int unsigned NOT NULL,
  `data_reuniao` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time DEFAULT NULL,
  `local_reuniao` varchar(255) DEFAULT NULL,
  `tipo_reuniao` enum('presencial','video_chamada','telefonica') DEFAULT 'presencial',
  `link_video` varchar(255) DEFAULT NULL,
  `status` enum('agendada','confirmada','realizada','cancelada','reagendada') DEFAULT 'agendada',
  `objetivo` text,
  `pauta` text,
  `resultado` text,
  `observacoes` text,
  `lembretes_enviados` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_scheduled_meetings_mediation` (`mediation_id`),
  KEY `fk_scheduled_meetings_employee` (`employee_id`),
  KEY `fk_scheduled_meetings_company` (`company_id`),
  KEY `fk_scheduled_meetings_investor` (`investor_id`),
  CONSTRAINT `fk_scheduled_meetings_company` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scheduled_meetings_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_scheduled_meetings_investor` FOREIGN KEY (`investor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scheduled_meetings_mediation` FOREIGN KEY (`mediation_id`) REFERENCES `mediations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.scheduled_meetings: ~7 rows (aproximadamente)
INSERT INTO `scheduled_meetings` (`id`, `mediation_id`, `employee_id`, `mediator_user_id`, `company_id`, `investor_id`, `data_reuniao`, `hora_inicio`, `hora_fim`, `local_reuniao`, `tipo_reuniao`, `link_video`, `status`, `objetivo`, `pauta`, `resultado`, `observacoes`, `lembretes_enviados`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, NULL, 3, 8, '2026-04-03', '10:00:00', '11:00:00', NULL, 'video_chamada', NULL, 'cancelada', 'Reuniao inicial de apresentacao mediada pela equipa Ulezi XPB.', 'Apresentacao das partes, validacao de interesse e alinhamento dos proximos passos.', NULL, 'Imprevisto operacional.', NULL, '2026-04-02 21:35:19', '2026-04-02 23:21:52'),
	(2, 1, 1, NULL, 3, 8, '2026-04-03', '09:00:00', '10:00:00', NULL, 'presencial', NULL, 'cancelada', NULL, NULL, NULL, 'Imprevisto operacional.', NULL, '2026-04-02 21:45:18', '2026-04-02 23:24:48'),
	(3, 1, 1, NULL, 3, 8, '2026-04-03', '07:00:00', '08:00:00', NULL, 'presencial', NULL, 'reagendada', NULL, NULL, NULL, NULL, NULL, '2026-04-02 21:45:20', '2026-04-02 23:26:44'),
	(4, 2, 1, 9, 1, 8, '2026-04-03', '23:00:00', '23:05:00', 'Nossa casa Viana', 'presencial', NULL, 'reagendada', 'Esclarecer pontos', NULL, NULL, NULL, NULL, '2026-04-03 21:36:56', '2026-04-03 21:49:27'),
	(5, 3, 1, 9, 3, 8, '2026-04-03', '23:01:00', '23:05:00', 'GoogleMet', 'video_chamada', 'https://meet.google.com/kbb-bdpk-ekd', 'agendada', 'Ajustar os pontos', NULL, NULL, NULL, NULL, '2026-04-03 21:58:27', '2026-04-03 21:58:27'),
	(6, 4, 1, 9, 3, 10, '2026-04-06', '08:50:00', '08:54:00', 'Viana', 'presencial', NULL, 'agendada', 'Negociar a proposta', 'Valor proposto é de 5.000.000,00KZ\nOs termos e as condições são:\n1-aaaaaaaaaaaaaaa\n2-bbbbbbbbbbbb', NULL, NULL, NULL, '2026-04-06 07:50:54', '2026-04-06 07:50:54'),
	(7, 5, 1, 9, 3, 10, '2026-04-06', '14:35:00', '14:40:00', 'Zango 1, mercado', 'telefonica', NULL, 'agendada', 'Efetivação de Licenciamento de marca', NULL, NULL, NULL, NULL, '2026-04-06 13:34:00', '2026-04-06 13:34:00');

-- A despejar estrutura para tabela ulezi2_xpb.service_categories
DROP TABLE IF EXISTS `service_categories`;
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `icone` varchar(50) DEFAULT 'briefcase',
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.service_categories: ~10 rows (aproximadamente)
INSERT INTO `service_categories` (`id`, `nome`, `descricao`, `icone`, `status`, `created_at`) VALUES
	(1, 'Tecnologia e TI', 'Desenvolvimento de software, redes e suporte informático', 'monitor', 'ativo', '2026-03-28 00:01:37'),
	(2, 'Contabilidade e Finanças', 'Serviços de contabilidade, auditoria e consultoria financeira', 'calculator', 'ativo', '2026-03-28 00:01:37'),
	(3, 'Construção Civil', 'Obras, remodelações e projetos de construção', 'building', 'ativo', '2026-03-28 00:01:37'),
	(4, 'Educação e Formação', 'Cursos, workshops e formações profissionais', 'book', 'ativo', '2026-03-28 00:01:37'),
	(5, 'Saúde e Bem-estar', 'Serviços médicos, clínicas e fisioterapia', 'heart', 'ativo', '2026-03-28 00:01:37'),
	(6, 'Marketing e Publicidade', 'Design, branding, gestão de redes sociais', 'megaphone', 'ativo', '2026-03-28 00:01:37'),
	(7, 'Logística e Transportes', 'Transporte, entregas e armazenamento', 'truck', 'ativo', '2026-03-28 00:01:37'),
	(8, 'Consultoria Empresarial', 'Consultoria de gestão, estratégia e expansão', 'briefcase', 'ativo', '2026-03-28 00:01:37'),
	(9, 'Jurídico e Legal', 'Advogados, notários e serviços jurídicos', 'scale', 'ativo', '2026-03-28 00:01:37'),
	(10, 'Alimentação e Restauração', 'Restaurantes, catering e serviços de alimentação', 'utensils', 'ativo', '2026-03-28 00:01:37');

-- A despejar estrutura para tabela ulezi2_xpb.student_profiles
DROP TABLE IF EXISTS `student_profiles`;
CREATE TABLE IF NOT EXISTS `student_profiles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `genero` enum('masculino','feminino','outro') DEFAULT NULL,
  `bio` text,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `student_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.student_profiles: ~1 rows (aproximadamente)
INSERT INTO `student_profiles` (`id`, `user_id`, `municipio`, `provincia`, `data_nascimento`, `genero`, `bio`, `is_public`, `created_at`, `updated_at`) VALUES
	(1, 3, 'Luanda', 'Luanda', NULL, NULL, NULL, 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37');

-- A despejar estrutura para tabela ulezi2_xpb.subscriptions
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `package_id` int unsigned DEFAULT NULL,
  `tipo_plano` varchar(100) DEFAULT NULL,
  `plano` enum('mensal','trimestral','anual') NOT NULL DEFAULT 'mensal',
  `valor` decimal(10,2) NOT NULL,
  `valor_pago` decimal(12,2) DEFAULT NULL,
  `moeda` varchar(10) NOT NULL DEFAULT 'AOA',
  `metodo_pagamento` varchar(50) DEFAULT NULL,
  `referencia_pagamento` varchar(100) DEFAULT NULL,
  `pagamento_status` enum('pendente','confirmado','falhou','reembolsado') DEFAULT 'confirmado',
  `comprovante_url` varchar(255) DEFAULT NULL,
  `comprovante_visualizado_em` datetime DEFAULT NULL,
  `auto_renovar` tinyint(1) NOT NULL DEFAULT '0',
  `is_renewal` tinyint(1) NOT NULL DEFAULT '0',
  `renovada_de` int unsigned DEFAULT NULL,
  `approved_by` int unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `motivo_rejeicao` text,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `status` enum('ativa','expirada','cancelada','vencida','renovada','pendente') DEFAULT 'ativa',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_company` (`company_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.subscriptions: ~3 rows (aproximadamente)
INSERT INTO `subscriptions` (`id`, `company_id`, `user_id`, `package_id`, `tipo_plano`, `plano`, `valor`, `valor_pago`, `moeda`, `metodo_pagamento`, `referencia_pagamento`, `pagamento_status`, `comprovante_url`, `comprovante_visualizado_em`, `auto_renovar`, `is_renewal`, `renovada_de`, `approved_by`, `approved_at`, `motivo_rejeicao`, `data_inicio`, `data_fim`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 1, 5, NULL, 'anual', 'anual', 50000.00, 50000.00, 'AOA', NULL, NULL, 'confirmado', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, '2026-03-28', '2027-03-28', 'ativa', 1, '2026-03-28 00:01:37', '2026-03-31 23:08:53'),
	(3, 3, 7, 1, 'basico', 'mensal', 10000.00, 10000.00, 'AOA', 'transferencia', 'ASS-1775083162192', 'confirmado', '/uploads/payments/payments-1775083179330-263211628.pdf', '2026-04-01 23:40:12', 0, 0, NULL, 1, '2026-04-01 23:40:25', NULL, '2026-04-01', '2026-05-01', 'ativa', 7, '2026-04-01 23:39:39', '2026-04-01 23:40:25'),
	(4, 4, 13, 1, 'basico', 'mensal', 10000.00, 10000.00, 'AOA', 'transferencia', 'ASS-1775480340063', 'confirmado', '/uploads/payments/payments-1775480402657-542364636.pdf', '2026-04-06 14:03:07', 0, 0, NULL, 1, '2026-04-06 14:03:14', NULL, '2026-04-06', '2026-05-06', 'ativa', 13, '2026-04-06 14:00:02', '2026-04-06 14:03:14');

-- A despejar estrutura para tabela ulezi2_xpb.subscription_notifications
DROP TABLE IF EXISTS `subscription_notifications`;
CREATE TABLE IF NOT EXISTS `subscription_notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `subscription_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `dias_restantes` int DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT '0',
  `email_sent_at` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pendente',
  `sent_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_subscription_notifications_subscription` (`subscription_id`),
  KEY `fk_subscription_notifications_user` (`user_id`),
  KEY `fk_subscription_notifications_sender` (`sent_by`),
  CONSTRAINT `fk_subscription_notifications_sender` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_subscription_notifications_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscription_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.subscription_notifications: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.subscription_packages
DROP TABLE IF EXISTS `subscription_packages`;
CREATE TABLE IF NOT EXISTS `subscription_packages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `preco` decimal(12,2) NOT NULL,
  `moeda` varchar(10) DEFAULT 'AOA',
  `duracao_dias` int NOT NULL DEFAULT '30',
  `duracao_meses` int NOT NULL DEFAULT '1',
  `consultorias_incluidas` int DEFAULT '0',
  `suporte_prioritario` tinyint(1) DEFAULT '0',
  `publicacoes_oportunidades_ilimitadas` tinyint(1) DEFAULT '1',
  `max_oportunidades_ativas` int DEFAULT '10',
  `beneficios` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `ordem` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `publicacoes_vagas_ilimitadas` tinyint(1) DEFAULT '0',
  `max_vagas_ativas` int DEFAULT '3',
  `status` enum('ativo','inativo','pendente','rejeitado') DEFAULT 'ativo',
  `created_by` int unsigned DEFAULT NULL,
  `approved_by` int unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `motivo_rejeicao` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.subscription_packages: ~2 rows (aproximadamente)
INSERT INTO `subscription_packages` (`id`, `slug`, `nome`, `descricao`, `preco`, `moeda`, `duracao_dias`, `duracao_meses`, `consultorias_incluidas`, `suporte_prioritario`, `publicacoes_oportunidades_ilimitadas`, `max_oportunidades_ativas`, `beneficios`, `is_active`, `ordem`, `created_at`, `updated_at`, `publicacoes_vagas_ilimitadas`, `max_vagas_ativas`, `status`, `created_by`, `approved_by`, `approved_at`, `motivo_rejeicao`) VALUES
	(1, 'basico', 'Básico', 'Plano básico para presença inicial na plataforma.', 10000.00, 'AOA', 30, 1, 5, 0, 1, 5, '["Perfil público", "Vagas de emprego", "Venda de serviços ilimitada."]', 1, 1, '2026-03-31 22:12:51', '2026-04-01 20:38:23', 0, 5, 'ativo', NULL, NULL, NULL, NULL),
	(2, 'profissional', 'Proficional', 'Pacote proficional ', 20000.00, 'AOA', 91, 3, 10, 0, 1, 15, '["3 meses para disfrutar dos benificios da plataforma", "10 Consultoria com as nossa equipe", "15 Serviços a vensa activos", "8 vagas para pubicares"]', 1, 0, '2026-04-01 20:37:34', '2026-04-01 20:37:34', 0, 8, 'ativo', 1, NULL, NULL, NULL);

-- A despejar estrutura para tabela ulezi2_xpb.support_messages
DROP TABLE IF EXISTS `support_messages`;
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` int unsigned NOT NULL,
  `sender_id` int unsigned NOT NULL,
  `mensagem` text NOT NULL,
  `anexos` json DEFAULT NULL,
  `is_internal` tinyint(1) DEFAULT '0',
  `lida` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_support_messages_ticket` (`ticket_id`),
  KEY `fk_support_messages_sender` (`sender_id`),
  CONSTRAINT `fk_support_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_support_messages_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.support_messages: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.support_tickets
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(40) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  `assunto` varchar(255) NOT NULL,
  `categoria` enum('tecnico','comercial','financeiro','documentacao','reclamacao','outro') NOT NULL,
  `prioridade` enum('baixa','media','alta','urgente') DEFAULT 'media',
  `status` enum('aberto','em_atendimento','aguardando_resposta','resolvido','fechado') DEFAULT 'aberto',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `fk_support_tickets_user` (`user_id`),
  KEY `fk_support_tickets_employee` (`employee_id`),
  CONSTRAINT `fk_support_tickets_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_support_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.support_tickets: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela ulezi2_xpb.system_settings
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `chave` varchar(100) NOT NULL,
  `valor` text,
  `descricao` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chave` (`chave`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.system_settings: ~12 rows (aproximadamente)
INSERT INTO `system_settings` (`id`, `chave`, `valor`, `descricao`, `updated_at`) VALUES
	(1, 'nome_plataforma', 'ULEZI XPB', 'Nome da plataforma', '2026-03-28 00:01:37'),
	(2, 'email_contacto', 'info@ulezi.com', 'Email de contacto', '2026-03-28 00:01:37'),
	(3, 'telefone_contacto', '+244 923 000 000', 'Telefone de contacto', '2026-03-28 00:01:37'),
	(4, 'site_url', 'https://ulezi.com', 'URL do site', '2026-03-28 00:01:37'),
	(5, 'notif_novas_inscricoes', '1', 'Notificar novas inscrições', '2026-03-28 00:01:37'),
	(6, 'notif_novas_empresas', '1', 'Notificar novas empresas', '2026-03-28 00:01:37'),
	(7, 'notif_novos_investimentos', '1', 'Notificar novos interesses', '2026-03-28 00:01:37'),
	(8, 'notif_por_email', '0', 'Enviar notificações por email', '2026-03-28 00:01:37'),
	(9, 'notif_por_whatsapp', '0', 'Enviar notificações por WhatsApp', '2026-03-28 00:01:37'),
	(10, '2fa_admin', '0', 'Autenticação dois fatores para admins', '2026-03-28 00:01:37'),
	(11, 'bloqueio_tentativas', '1', 'Bloquear conta após 5 tentativas', '2026-03-28 00:01:37'),
	(12, 'auditoria_ativa', '1', 'Registar todas as acções administrativas', '2026-03-28 00:01:37');

-- A despejar estrutura para tabela ulezi2_xpb.training_centers
DROP TABLE IF EXISTS `training_centers`;
CREATE TABLE IF NOT EXISTS `training_centers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) NOT NULL,
  `provincia` varchar(100) NOT NULL,
  `municipio` varchar(100) NOT NULL,
  `endereco` text,
  `email` varchar(150) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `descricao` text,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_provincia` (`provincia`),
  KEY `idx_municipio` (`municipio`),
  CONSTRAINT `training_centers_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.training_centers: ~7 rows (aproximadamente)
INSERT INTO `training_centers` (`id`, `nome`, `provincia`, `municipio`, `endereco`, `email`, `telefone`, `descricao`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'Centro de Formação Luanda Norte', 'Luanda', 'Luanda', 'Rua Amilcar Cabral, Bairro Ingombota', 'cfln@ulezixpb.com', '+244922100001', NULL, 'inativo', 1, '2026-03-28 00:01:37', '2026-03-30 18:27:52'),
	(2, 'Instituto Técnico de Viana', 'Luanda', 'Viana', 'Avenida Principal, Km 10, Viana', 'itviana@ulezixpb.com', '+244922200002', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(3, 'Centro Profissional Cacuaco', 'Luanda', 'Cacuaco', 'Rua das Acácias, Bairro Cacuaco', 'cpcacuaco@ulezixpb.com', '+244922300003', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(4, 'Escola Técnica do Huambo', 'Huambo', 'Huambo', 'Avenida do Técnico, Centro', 'ethuambo@ulezixpb.com', '+244922400004', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(5, 'Centro de Formação Bengo', 'Bengo', 'Caxito', 'Rua Central, Caxito', 'cfbengo@ulezixpb.com', '+244922500005', NULL, 'ativo', 1, '2026-03-28 00:01:37', '2026-03-28 00:01:37'),
	(6, 'SolutionCenter', 'Luanda', 'Viana', 'Angola,Luanda', 'agidrubavenancio@gmail.com', '+244929411670', 'Bom aprender e capacitar-se', 'ativo', 1, '2026-03-30 17:55:36', '2026-03-30 18:12:00'),
	(7, 'Ulezi Center', 'Luanda', 'Viana', 'Angola,Luanda', 'ulezi@gmail.com', '+244929411670', 'Centro de formação', 'ativo', 1, '2026-04-05 21:07:17', '2026-04-05 21:07:17');

-- A despejar estrutura para tabela ulezi2_xpb.training_center_courses
DROP TABLE IF EXISTS `training_center_courses`;
CREATE TABLE IF NOT EXISTS `training_center_courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `center_id` int NOT NULL,
  `course_id` int NOT NULL,
  `preco` decimal(12,2) NOT NULL DEFAULT '0.00',
  `carga_horaria` int DEFAULT NULL,
  `modalidade` enum('presencial','online') NOT NULL DEFAULT 'presencial',
  `certificado_exigido` tinyint(1) NOT NULL DEFAULT '0',
  `especificacoes` text,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_center_course` (`center_id`,`course_id`),
  KEY `idx_tcc_center` (`center_id`),
  KEY `idx_tcc_course` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14057 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.training_center_courses: ~31 rows (aproximadamente)
INSERT INTO `training_center_courses` (`id`, `center_id`, `course_id`, `preco`, `carga_horaria`, `modalidade`, `certificado_exigido`, `especificacoes`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 15000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(4, 1, 2, 25000.00, 6, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(5, 1, 4, 18000.00, 5, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(8, 1, 7, 20000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(11, 1, 8, 12000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(14, 1, 9, 30000.00, 6, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(17, 2, 1, 15000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(21, 2, 3, 20000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:52', '2026-03-30 09:43:52'),
	(24, 2, 5, 22000.00, 6, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(28, 2, 6, 16000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(31, 2, 10, 18000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(34, 3, 1, 15000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(37, 3, 2, 25000.00, 6, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(40, 3, 3, 20000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(43, 3, 4, 18000.00, 5, 'presencial', 1, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-31 05:26:13'),
	(46, 3, 7, 20000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(49, 3, 9, 30000.00, 6, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(52, 4, 3, 20000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(55, 4, 5, 22000.00, 6, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(58, 4, 6, 16000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(61, 4, 10, 18000.00, 4, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(64, 5, 1, 15000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(67, 5, 4, 18000.00, 5, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(70, 5, 6, 16000.00, 3, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 09:43:53', '2026-03-30 09:43:53'),
	(8115, 6, 11, 15000.00, 80, 'presencial', 0, NULL, 'ativo', 1, '2026-03-30 17:26:10', '2026-03-30 17:26:10'),
	(8191, 2, 11, 15.00, 80, 'presencial', 1, 'Ideial para todos', 'ativo', 1, '2026-03-30 18:01:04', '2026-03-30 18:01:04'),
	(8400, 6, 8, 30000.00, 100, 'presencial', 1, 'Para quem esta ja está no nivel intermediario', 'ativo', 1, '2026-03-30 18:23:36', '2026-03-30 18:23:36'),
	(13619, 7, 12, 15.00, 180, 'presencial', 0, 'Curso para somente para s maiores de idade', 'ativo', 1, '2026-04-05 23:18:29', '2026-04-05 23:18:29'),
	(13620, 7, 2, 60.00, 220, 'presencial', 1, 'Para quem é formado em TI e quer dar um Salto', 'ativo', 1, '2026-04-05 23:19:42', '2026-04-05 23:19:42'),
	(13621, 5, 12, 25.00, 60, 'presencial', 1, 'Para maiores de idade', 'ativo', 1, '2026-04-05 23:23:53', '2026-04-05 23:23:53'),
	(13622, 6, 1, 6.00, 20, 'online', 0, 'Para todos', 'ativo', 1, '2026-04-05 23:49:44', '2026-04-05 23:49:44');

-- A despejar estrutura para tabela ulezi2_xpb.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','company','investor','admin','employee') NOT NULL DEFAULT 'student',
  `status` enum('ativo','inativo','bloqueado') NOT NULL DEFAULT 'ativo',
  `email_verificado` tinyint(1) DEFAULT '0',
  `foto_perfil` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_change_required` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.users: ~12 rows (aproximadamente)
INSERT INTO `users` (`id`, `nome`, `email`, `telefone`, `password_hash`, `role`, `status`, `email_verificado`, `foto_perfil`, `created_at`, `updated_at`, `password_change_required`) VALUES
	(1, 'Administrador Ulezi', 'admin@ulezixpb.com', '+244923000001', '$2b$12$H7XdVMqz2Buudglpgj7oD.CYsc/qCgjgy89wMJvtBommJqcFZP2my', 'admin', 'ativo', 1, NULL, '2026-03-28 00:01:37', '2026-03-28 00:01:37', 0),
	(2, 'Funcionário Demo', 'funcionario@ulezixpb.com', '+244923000002', '$2b$12$I4qhhWj681ivU244JfY4z.gCwdDnlwR4YgQtZ5Akjma2NQohp1xve', 'employee', 'ativo', 1, NULL, '2026-03-28 00:01:37', '2026-03-28 00:01:37', 0),
	(3, 'João Estudante', 'joao@demo.com', '929411670', '$2a$12$QVnyZ7Q5yljmDDJlNVL2ZOqEgpwH2qUmqVVMFgEK3bcGQ2VZE8OF6', 'student', 'ativo', 1, NULL, '2026-03-28 00:01:37', '2026-03-30 19:50:39', 0),
	(4, 'Maria Investidora', 'maria@demo.com', '+244923222001', '$2b$12$Ww7n59QxX.nwfALbTaD5E.gSoGK4pEgIYIGrcZtxeS30.hUvMuRm.', 'investor', 'ativo', 1, NULL, '2026-03-28 00:01:37', '2026-03-28 00:01:37', 0),
	(5, 'TechCorp Angola', 'techcorp@demo.com', '+244923333001', '$2b$12$Ww7n59QxX.nwfALbTaD5E.gSoGK4pEgIYIGrcZtxeS30.hUvMuRm.', 'company', 'ativo', 1, NULL, '2026-03-28 00:01:37', '2026-03-28 00:01:37', 0),
	(6, 'Armindo Tchissola', 'agidrubadeve@gmail.com', '929411670', '$2a$12$O4rZeoNqDDBHZdhvkOpM9O14PyhjH4.E/AGo52sZDYtC6j7.XdEeS', 'company', 'ativo', 0, NULL, '2026-04-01 13:30:47', '2026-04-01 13:30:47', 0),
	(7, 'Asdruba Venancio', 'asdrubadeve@gmail.com', '929411670', '$2a$12$iVio0tW4MDv7.JKcPIq//OWjUWD5a31g0fwLidBu16cpuKeELQVie', 'company', 'ativo', 0, NULL, '2026-04-01 21:43:17', '2026-04-01 21:43:17', 0),
	(8, 'Maier Venâncio', 'maiervenancio@gmail.com', '+244929411670', '$2a$12$hulDumhSUP8FndR7gB435Og.p0skr8ko7x1rGDtKTk4csTjmEsasu', 'investor', 'ativo', 0, NULL, '2026-04-02 12:21:36', '2026-04-02 12:21:36', 0),
	(9, 'Bartolomeu Orlando', 'kulonga2025@gmail.com', '929411670', '$2a$12$.yboe4ikF7k5snEKrbsWauv7noLMWFZOme9aCHjWMUdOEdytHA4hK', 'employee', 'ativo', 1, NULL, '2026-04-02 22:27:29', '2026-04-02 22:30:57', 0),
	(10, 'Nuno Almeida', 'maiertenta@gmail.com', '950680880', '$2a$12$SZYVYZYymsTXip3Z/ptCvuSk4q5sAf5xTifZmvmJrhkujVNRVLSaq', 'investor', 'ativo', 0, NULL, '2026-04-06 08:38:14', '2026-04-06 08:38:14', 0),
	(12, 'Carlos Henriques', 'asdrubavenancio@yahoo.com', '909411670', '$2a$12$vqiCCMVY2xMTCZnMzWb.7eaFd3lakMJuza2iOSeT9nwTiWvTkrf3W', 'employee', 'ativo', 1, NULL, '2026-04-06 13:03:31', '2026-04-06 13:09:52', 0),
	(13, 'Irineu ', 'solimpo@gmail.com', '929411678', '$2a$12$tKpkwAaGwmlspvHfgRSSP.duSTG9uRofJj9lRB44pUyvb5I30r1iC', 'company', 'ativo', 0, NULL, '2026-04-06 13:54:22', '2026-04-06 13:54:22', 0);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
