-- MySQL dump 10.13  Distrib 8.4.0, for Linux (aarch64)
--
-- Host: localhost    Database: smoelenboek_beta
-- ------------------------------------------------------
-- Server version	8.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `location` varchar(255) NOT NULL,
  `date` timestamp NOT NULL,
  `registrationOpen` timestamp NOT NULL,
  `registrationClosed` timestamp NOT NULL,
  `max` int NOT NULL DEFAULT '0',
  `public` tinyint NOT NULL DEFAULT '0',
  `committe_id` int DEFAULT NULL,
  `formId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_bc4a9cd02a9cdc682310c4a9fd` (`formId`),
  KEY `FK_a2e0e187d6be4d5c9e56d29f6b1` (`committe_id`),
  CONSTRAINT `FK_a2e0e187d6be4d5c9e56d29f6b1` FOREIGN KEY (`committe_id`) REFERENCES `committee` (`id`),
  CONSTRAINT `FK_bc4a9cd02a9cdc682310c4a9fd3` FOREIGN KEY (`formId`) REFERENCES `form` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_users_user`
--

DROP TABLE IF EXISTS `activity_users_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_users_user` (
  `activityId` int NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`activityId`,`userId`),
  KEY `IDX_69f8497403a4a93984511a0769` (`activityId`),
  KEY `IDX_34ab5afd90dfbcc6318e8bf21f` (`userId`),
  CONSTRAINT `FK_34ab5afd90dfbcc6318e8bf21f3` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_69f8497403a4a93984511a07699` FOREIGN KEY (`activityId`) REFERENCES `activity` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_users_user`
--

LOCK TABLES `activity_users_user` WRITE;
/*!40000 ALTER TABLE `activity_users_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_users_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `pinned` tinyint NOT NULL DEFAULT '0',
  `type` enum('documents','photos') NOT NULL DEFAULT 'photos',
  `created` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee`
--

DROP TABLE IF EXISTS `committee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `committee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `active` tinyint NOT NULL DEFAULT '1',
  `image` text,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee`
--

LOCK TABLES `committee` WRITE;
/*!40000 ALTER TABLE `committee` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file`
--

DROP TABLE IF EXISTS `file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file` (
  `id` int NOT NULL AUTO_INCREMENT,
  `path` varchar(255) NOT NULL,
  `categoryId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_3f49c0ffff0c98a80ed4fade64c` (`categoryId`),
  CONSTRAINT `FK_3f49c0ffff0c98a80ed4fade64c` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file`
--

LOCK TABLES `file` WRITE;
/*!40000 ALTER TABLE `file` DISABLE KEYS */;
/*!40000 ALTER TABLE `file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form`
--

DROP TABLE IF EXISTS `form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `sheetId` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form`
--

LOCK TABLES `form` WRITE;
/*!40000 ALTER TABLE `form` DISABLE KEYS */;
/*!40000 ALTER TABLE `form` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_answer`
--

DROP TABLE IF EXISTS `form_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_answer` (
  `id` varchar(36) NOT NULL,
  `email` text,
  `firstName` text,
  `lastName` text,
  `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `userId` int DEFAULT NULL,
  `form_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_13eba064964102de7a0194b3614` (`userId`),
  KEY `FK_915184956f85fdd8c8193e8e435` (`form_id`),
  CONSTRAINT `FK_13eba064964102de7a0194b3614` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_915184956f85fdd8c8193e8e435` FOREIGN KEY (`form_id`) REFERENCES `form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_answer`
--

LOCK TABLES `form_answer` WRITE;
/*!40000 ALTER TABLE `form_answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_answer_value`
--

DROP TABLE IF EXISTS `form_answer_value`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_answer_value` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` text NOT NULL,
  `question_id` varchar(36) DEFAULT NULL,
  `answerId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_66d4d409a90e5999d83d92d7c8d` (`question_id`),
  KEY `FK_b33dd3c5b4e793ebc4c7b702bc1` (`answerId`),
  CONSTRAINT `FK_66d4d409a90e5999d83d92d7c8d` FOREIGN KEY (`question_id`) REFERENCES `form_question` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_b33dd3c5b4e793ebc4c7b702bc1` FOREIGN KEY (`answerId`) REFERENCES `form_answer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_answer_value`
--

LOCK TABLES `form_answer_value` WRITE;
/*!40000 ALTER TABLE `form_answer_value` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_answer_value` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_question`
--

DROP TABLE IF EXISTS `form_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_question` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `required` tinyint NOT NULL DEFAULT '0',
  `paragraph` tinyint DEFAULT NULL,
  `key` int NOT NULL,
  `formId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_2072351f9e24ad25ffa22bc93bf` (`formId`),
  CONSTRAINT `FK_2072351f9e24ad25ffa22bc93bf` FOREIGN KEY (`formId`) REFERENCES `form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_question`
--

LOCK TABLES `form_question` WRITE;
/*!40000 ALTER TABLE `form_question` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_question_item`
--

DROP TABLE IF EXISTS `form_question_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_question_item` (
  `id` varchar(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `key` int NOT NULL,
  `questionId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_9bd63710ac46966eafd63793bd2` (`questionId`),
  CONSTRAINT `FK_9bd63710ac46966eafd63793bd2` FOREIGN KEY (`questionId`) REFERENCES `form_question` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_question_item`
--

LOCK TABLES `form_question_item` WRITE;
/*!40000 ALTER TABLE `form_question_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_question_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photo`
--

DROP TABLE IF EXISTS `photo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file` text NOT NULL,
  `photobookId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_abcfd2ccc51efd0bafa11ef9b43` (`photobookId`),
  CONSTRAINT `FK_abcfd2ccc51efd0bafa11ef9b43` FOREIGN KEY (`photobookId`) REFERENCES `photobook` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photo`
--

LOCK TABLES `photo` WRITE;
/*!40000 ALTER TABLE `photo` DISABLE KEYS */;
/*!40000 ALTER TABLE `photo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photobook`
--

DROP TABLE IF EXISTS `photobook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photobook` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photobook`
--

LOCK TABLES `photobook` WRITE;
/*!40000 ALTER TABLE `photobook` DISABLE KEYS */;
/*!40000 ALTER TABLE `photobook` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `protototo_match`
--

DROP TABLE IF EXISTS `protototo_match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `protototo_match` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playDate` timestamp NOT NULL,
  `homeTeam` varchar(255) NOT NULL,
  `awayTeam` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `seasonId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_8005059cf1df9fb624f3a85d4ff` (`seasonId`),
  CONSTRAINT `FK_8005059cf1df9fb624f3a85d4ff` FOREIGN KEY (`seasonId`) REFERENCES `protototo_season` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `protototo_match`
--

LOCK TABLES `protototo_match` WRITE;
/*!40000 ALTER TABLE `protototo_match` DISABLE KEYS */;
/*!40000 ALTER TABLE `protototo_match` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `protototo_prediction_results`
--

DROP TABLE IF EXISTS `protototo_prediction_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `protototo_prediction_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `points` int NOT NULL,
  `userId` int DEFAULT NULL,
  `seasonId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_3605754fd5efcec4ca1a90dd0fa` (`userId`),
  KEY `FK_8a17d7d4ef07d6c72ec3b242bbb` (`seasonId`),
  CONSTRAINT `FK_3605754fd5efcec4ca1a90dd0fa` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_8a17d7d4ef07d6c72ec3b242bbb` FOREIGN KEY (`seasonId`) REFERENCES `protototo_season` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `protototo_prediction_results`
--

LOCK TABLES `protototo_prediction_results` WRITE;
/*!40000 ALTER TABLE `protototo_prediction_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `protototo_prediction_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `protototo_predictions`
--

DROP TABLE IF EXISTS `protototo_predictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `protototo_predictions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setOne` tinyint NOT NULL,
  `setTwo` tinyint NOT NULL,
  `setThree` tinyint NOT NULL,
  `setFour` tinyint DEFAULT NULL,
  `setFive` tinyint DEFAULT NULL,
  `matchId` int DEFAULT NULL,
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_b61302f1fc65919e31286e8eee8` (`matchId`),
  KEY `FK_8d5248b942172767bc0c90289f9` (`userId`),
  CONSTRAINT `FK_8d5248b942172767bc0c90289f9` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_b61302f1fc65919e31286e8eee8` FOREIGN KEY (`matchId`) REFERENCES `protototo_match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `protototo_predictions`
--

LOCK TABLES `protototo_predictions` WRITE;
/*!40000 ALTER TABLE `protototo_predictions` DISABLE KEYS */;
/*!40000 ALTER TABLE `protototo_predictions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `protototo_predictions_external`
--

DROP TABLE IF EXISTS `protototo_predictions_external`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `protototo_predictions_external` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `setOne` tinyint NOT NULL,
  `setTwo` tinyint NOT NULL,
  `setThree` tinyint NOT NULL,
  `setFour` tinyint DEFAULT NULL,
  `setFive` tinyint DEFAULT NULL,
  `matchId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_68f5fae3e3e8c04517dfe9ead81` (`matchId`),
  CONSTRAINT `FK_68f5fae3e3e8c04517dfe9ead81` FOREIGN KEY (`matchId`) REFERENCES `protototo_match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `protototo_predictions_external`
--

LOCK TABLES `protototo_predictions_external` WRITE;
/*!40000 ALTER TABLE `protototo_predictions_external` DISABLE KEYS */;
/*!40000 ALTER TABLE `protototo_predictions_external` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `protototo_results`
--

DROP TABLE IF EXISTS `protototo_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `protototo_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setOne` tinyint NOT NULL,
  `setTwo` tinyint NOT NULL,
  `setThree` tinyint NOT NULL,
  `setFour` tinyint DEFAULT NULL,
  `setFive` tinyint DEFAULT NULL,
  `matchId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_c1293f33ae02368bf9f829d418` (`matchId`),
  CONSTRAINT `FK_c1293f33ae02368bf9f829d4187` FOREIGN KEY (`matchId`) REFERENCES `protototo_match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `protototo_results`
--

LOCK TABLES `protototo_results` WRITE;
/*!40000 ALTER TABLE `protototo_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `protototo_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `protototo_season`
--

DROP TABLE IF EXISTS `protototo_season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `protototo_season` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start` timestamp NOT NULL,
  `end` timestamp NOT NULL,
  `tikkie` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `protototo_season`
--

LOCK TABLES `protototo_season` WRITE;
/*!40000 ALTER TABLE `protototo_season` DISABLE KEYS */;
/*!40000 ALTER TABLE `protototo_season` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(255) NOT NULL,
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_3e02d32dd4707c91433de0390ea` (`userId`),
  CONSTRAINT `FK_3e02d32dd4707c91433de0390ea` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `season`
--

DROP TABLE IF EXISTS `season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `season` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `current` tinyint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `season`
--

LOCK TABLES `season` WRITE;
/*!40000 ALTER TABLE `season` DISABLE KEYS */;
/*!40000 ALTER TABLE `season` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `rank` text NOT NULL,
  `image` text,
  `gender` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `streetName` varchar(255) NOT NULL,
  `houseNumber` varchar(255) NOT NULL,
  `postcode` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `bankaccountNumber` varchar(255) NOT NULL,
  `birthDate` date NOT NULL,
  `bondNumber` varchar(255) NOT NULL,
  `joinDate` date NOT NULL,
  `leaveDate` date DEFAULT NULL,
  `backNumber` int DEFAULT NULL,
  `profilePicture` varchar(255) DEFAULT 'user/default.jpg',
  `refereeLicense` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'offabio@outlook.com','$2b$10$1bnZ.Rtkz5Dzq7ucWQ6IKOlF9KZNVQl6qZ5D8XZ4zTV5JNCZN5cIe','Fabio (Febo)','Dijkshoorn','Catharijnesingel','131','3511GZ','Utrecht','0641569489','NL75 RABO 0136222110','2002-01-18','CPJ1J7G','2019-09-06',NULL,8,'user/1664115313577-177162298.jpeg','VS2/V4');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_committee_season`
--

DROP TABLE IF EXISTS `user_committee_season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_committee_season` (
  `id` int NOT NULL AUTO_INCREMENT,
  `function` text NOT NULL,
  `userId` int DEFAULT NULL,
  `committeeId` int DEFAULT NULL,
  `seasonId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_a8730d10fa3d3769032dbdb9edc` (`userId`),
  KEY `FK_a225675f3f6c3cd47f1e7e1d108` (`committeeId`),
  KEY `FK_b44931e93ece3a4843d63fcd955` (`seasonId`),
  CONSTRAINT `FK_a225675f3f6c3cd47f1e7e1d108` FOREIGN KEY (`committeeId`) REFERENCES `committee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_a8730d10fa3d3769032dbdb9edc` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_b44931e93ece3a4843d63fcd955` FOREIGN KEY (`seasonId`) REFERENCES `season` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_committee_season`
--

LOCK TABLES `user_committee_season` WRITE;
/*!40000 ALTER TABLE `user_committee_season` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_committee_season` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_team_season`
--

DROP TABLE IF EXISTS `user_team_season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_team_season` (
  `id` int NOT NULL AUTO_INCREMENT,
  `function` text NOT NULL,
  `userId` int DEFAULT NULL,
  `teamId` int DEFAULT NULL,
  `seasonId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_d07eeb38e9ea5a1d93c7a76c94d` (`userId`),
  KEY `FK_b232d2ec8962db43e0f99012078` (`teamId`),
  KEY `FK_b25142ab0433134a988dc0cbf00` (`seasonId`),
  CONSTRAINT `FK_b232d2ec8962db43e0f99012078` FOREIGN KEY (`teamId`) REFERENCES `team` (`id`),
  CONSTRAINT `FK_b25142ab0433134a988dc0cbf00` FOREIGN KEY (`seasonId`) REFERENCES `season` (`id`),
  CONSTRAINT `FK_d07eeb38e9ea5a1d93c7a76c94d` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_team_season`
--

LOCK TABLES `user_team_season` WRITE;
/*!40000 ALTER TABLE `user_team_season` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_team_season` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-07-10 13:27:48
