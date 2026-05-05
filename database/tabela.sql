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
DROP DATABASE IF EXISTS `ulezi2_xpb`;
CREATE DATABASE IF NOT EXISTS `ulezi2_xpb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ulezi2_xpb`;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A despejar dados para tabela ulezi2_xpb.enrollments: ~6 rows (aproximadamente)
INSERT INTO `enrollments` (`id`, `numero_inscricao`, `student_id`, `course_id`, `center_id`, `offering_id`, `municipio_aluno`, `provincia_aluno`, `status`, `payment_status`, `observacoes`, `documento_requisito_url`, `documento_requisito_nome`, `documento_requisito_mime`, `comprovativo_visualizado_em`, `documento_visualizado_em`, `motivo_rejeicao`, `aprovado_by`, `aprovado_at`, `assigned_by`, `assigned_at`, `created_at`, `updated_at`) VALUES
	(1, 'UXB-2026-83673', 3, 11, 2, 8191, 'Viana', 'Luanda', 'pendente', 'pendente', 'aaaaamfn gkgkk', '/uploads/inscricoes/inscricao_1774914354765-903297569.pdf', 'cv_agidruba_copia.pdf', 'application/pdf', NULL, '2026-03-31 01:18:31', NULL, NULL, NULL, NULL, NULL, '2026-03-31 00:45:54', '2026-03-31 01:18:31'),
	(2, 'UXB-2026-79765', 3, 3, 4, 52, 'Huambo', 'Huqmbo', 'confirmada', 'pago', 'Nececidade', NULL, NULL, NULL, '2026-04-05 21:20:41', NULL, NULL, 1, '2026-03-31 01:23:28', NULL, NULL, '2026-03-31 01:21:40', '2026-04-05 21:20:41'),
	(3, 'UXB-2026-28919', 3, 4, 3, 43, 'Cacuaco', 'Luanda', 'confirmada', 'pago', 'Sem', '/uploads/inscricoes/inscricao_1774934926180-77015034.pdf', 'cv_agidruba_copia.pdf', 'application/pdf', '2026-04-05 21:21:48', '2026-04-05 21:21:57', NULL, 1, '2026-04-02 17:28:30', NULL, NULL, '2026-03-31 06:28:46', '2026-04-05 21:21:57'),
	(4, 'UXB-2026-15944', 15, 4, 3, 43, 'Cacuaco', 'Luanda', 'confirmada', 'pago', 'nenhuma', '/uploads/inscricoes/inscricao_1776863651200-395815556.pdf', 'cv_agidruba_venancio.pdf', 'application/pdf', '2026-04-22 14:23:58', '2026-04-22 14:24:04', NULL, 1, '2026-04-22 14:24:35', NULL, NULL, '2026-04-22 14:14:11', '2026-04-22 14:24:35'),
	(5, 'UXB-2026-85783', 15, 2, 3, 37, 'Cacuaco', 'Luanda', 'pendente', 'pendente', 'Meu', NULL, NULL, NULL, '2026-04-23 00:15:39', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-23 00:12:53', '2026-04-23 00:15:39'),
	(6, 'UXB-2026-94864', 15, 7, 3, 46, 'Cacuaco', 'Luanda', 'confirmada', 'pago', NULL, NULL, NULL, NULL, '2026-04-23 00:28:34', NULL, NULL, 1, '2026-04-23 00:29:15', NULL, NULL, '2026-04-23 00:28:10', '2026-04-23 00:29:15');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
