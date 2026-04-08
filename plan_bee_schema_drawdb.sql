-- ========================================================
-- PLAN-BEE DATABASE SCHEMA
-- Purpose: Documentation and DrawDB Entity Presentation
-- ========================================================

CREATE DATABASE IF NOT EXISTS `planbee_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `planbee_db`;

-- 1. Table: users (Core User Information)
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_image` VARCHAR(255) DEFAULT NULL,
  `telegram_chat_id` VARCHAR(50) DEFAULT NULL, -- Linked for Telegram reminders
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 2. Table: user_settings (Personalization Settings)
CREATE TABLE `user_settings` (
  `user_id` INT NOT NULL,
  `theme` ENUM('light', 'dark') DEFAULT 'light',
  `notifications_enabled` TINYINT(1) DEFAULT 1,
  `accent_color` VARCHAR(20) DEFAULT '#FFA726',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Table: plans (Time-based scheduling / Calendar events)
CREATE TABLE `plans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `type` ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `status` VARCHAR(20) DEFAULT 'pending', -- pending, doing, completed, cancelled
  `color` VARCHAR(20) DEFAULT '#FFA726',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_plans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Table: tasks (Single To-do items / Checklist)
CREATE TABLE `tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'doing', 'completed') DEFAULT 'pending',
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `due_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Table: habits (Recurring self-improvement goals)
CREATE TABLE `habits` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `frequency` ENUM('daily', 'weekly') DEFAULT 'daily',
  `goal` INT DEFAULT 1, -- e.g., 1 time per day
  `current_streak` INT DEFAULT 0,
  `last_completed` DATE DEFAULT NULL,
  `preferred_time` TIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_habits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Table: notifications (System and Reminder logs)
CREATE TABLE `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) DEFAULT 'system', -- task, plan, habit, system
  `reference_id` INT DEFAULT NULL, -- linking to task_id or plan_id
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Table: system_config (AI & Global Configurations)
CREATE TABLE `system_config` (
  `key` VARCHAR(50) NOT NULL,
  `value` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB;

-- 8. Table: chat_logs (AI Interaction History)
CREATE TABLE `chat_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `message` TEXT,
  `response` TEXT,
  `tokens_used` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Table: error_logs (System Error Tracking)
CREATE TABLE `error_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `error_message` TEXT,
  `stack_trace` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
