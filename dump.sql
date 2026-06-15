-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 15, 2026 at 03:43 PM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `saliach_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `externallink`
--

DROP TABLE IF EXISTS `externallink`;
CREATE TABLE IF NOT EXISTS `externallink` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExternalLink_url_key` (`url`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `externallink`
--

INSERT INTO `externallink` (`id`, `title`, `url`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'Restitutio', 'https://restitutio.org/', 'Website Restitutio', '2026-06-13 14:32:33.182', '2026-06-13 14:44:04.054'),
(2, 'Biblical Unitarian', 'https://www.biblicalunitarian.com/', 'Website Biblical Unitarian', '2026-06-13 14:43:19.908', '2026-06-13 14:43:39.793');

-- --------------------------------------------------------

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
CREATE TABLE IF NOT EXISTS `group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Group_name_key` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `group`
--

INSERT INTO `group` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'Administrator', NULL, '2026-06-13 06:33:18.140', '2026-06-13 06:34:15.333'),
(2, 'Guest', 'Guest pengguna Saliach AI', '2026-06-15 00:40:10.481', '2026-06-15 10:21:57.851');

-- --------------------------------------------------------

--
-- Table structure for table `grouppermission`
--

DROP TABLE IF EXISTS `grouppermission`;
CREATE TABLE IF NOT EXISTS `grouppermission` (
  `groupId` int NOT NULL,
  `moduleId` int NOT NULL,
  `canRead` tinyint(1) NOT NULL DEFAULT '0',
  `canWrite` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`groupId`,`moduleId`),
  KEY `GroupPermission_moduleId_fkey` (`moduleId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grouppermission`
--

INSERT INTO `grouppermission` (`groupId`, `moduleId`, `canRead`, `canWrite`) VALUES
(1, 1, 1, 1),
(1, 2, 1, 1),
(1, 3, 1, 1),
(1, 4, 1, 1),
(2, 1, 0, 0),
(2, 2, 1, 0),
(2, 3, 0, 0),
(2, 4, 0, 0),
(1, 8, 1, 1),
(1, 9, 1, 1),
(1, 10, 1, 1),
(1, 11, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
CREATE TABLE IF NOT EXISTS `module` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `routePath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Module_parentId_fkey` (`parentId`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `module`
--

INSERT INTO `module` (`id`, `name`, `routePath`, `icon`, `parentId`, `createdAt`, `updatedAt`) VALUES
(1, 'Ingest Dokumen', '/admin/ingest', 'UploadCloud', 3, '2026-06-13 06:35:35.152', '2026-06-13 08:58:36.539'),
(2, 'Chat AI', '/chat', 'MessageSquare', NULL, '2026-06-13 06:38:31.423', '2026-06-13 06:37:54.591'),
(3, 'Admin', NULL, 'Shield', NULL, '2026-06-13 08:58:36.519', '2026-06-13 08:58:36.519'),
(4, 'Sumber Eksternal', '/admin/external-links', 'Link', 3, '2026-06-13 14:25:46.638', '2026-06-13 14:25:46.638'),
(10, 'Manajemen Group', '/management/groups', 'UserCheck', 8, '2026-06-15 00:54:06.814', '2026-06-15 00:54:06.814'),
(9, 'Manajemen User', '/management/users', 'Users', 8, '2026-06-15 00:54:06.792', '2026-06-15 00:54:06.792'),
(8, 'Manajemen', NULL, 'Settings', NULL, '2026-06-15 00:54:06.774', '2026-06-15 00:54:06.774'),
(11, 'Manajemen Akses', '/management/permissions', 'Key', 8, '2026-06-15 00:54:06.842', '2026-06-15 00:54:06.842');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `groupId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_groupId_fkey` (`groupId`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `password`, `name`, `createdAt`, `updatedAt`, `groupId`) VALUES
(1, 'admin@gereja.com', '12345', 'Admin', '2026-06-13 14:21:44.822', '2026-06-15 13:13:56.333', 1),
(2, 'guest@gereja.com', '12345', 'guest', '2026-06-15 00:43:12.318', '2026-06-15 13:13:56.333', 1);

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('8ce163fd-a495-459f-bea6-274d58194e5e', '378fe645560ae8f71b0b790faa5a4a019b26ca4454ded7ed7cdc007a9401b2f0', '2026-06-13 05:21:04.447', '20260613052103_init', NULL, NULL, '2026-06-13 05:21:03.911', 1),
('a4fa4a58-be83-4ffc-a947-e28256772174', 'e43864cdcf630affc52501c9973407463a9569395c33eb3f46ad08592b3e9c77', '2026-06-13 05:24:23.884', '20260613052423_init', NULL, NULL, '2026-06-13 05:24:23.377', 1),
('5125c35c-a42c-4e3f-9c35-abae7c50e7e6', '267f9a9caf91666971421349278a98c98d99c055420d860a9e024b684e97b29f', '2026-06-13 14:24:51.567', '20260613142451_add_external_link', NULL, NULL, '2026-06-13 14:24:51.276', 1);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
