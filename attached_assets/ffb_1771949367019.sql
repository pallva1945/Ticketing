-- phpMyAdmin SQL Dump
-- version 4.2.0
-- http://www.phpmyadmin.net
--
-- Host: 185.51.66.22:53311
-- Generation Time: Feb 24, 2026 at 01:14 PM
-- Server version: 11.4.7-MariaDB-deb12-log
-- PHP Version: 5.4.45-0+deb7u14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `ffb`
--

-- --------------------------------------------------------

--
-- Table structure for table `affiliates`
--

CREATE TABLE IF NOT EXISTS `affiliates` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=21 ;

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_sources`
--

CREATE TABLE IF NOT EXISTS `affiliate_sources` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5 ;

-- --------------------------------------------------------

--
-- Table structure for table `agents`
--

CREATE TABLE IF NOT EXISTS `agents` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1190 ;

-- --------------------------------------------------------

--
-- Table structure for table `arenas`
--

CREATE TABLE IF NOT EXISTS `arenas` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `city_id` bigint(20) unsigned DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `check_duplicities`
--

CREATE TABLE IF NOT EXISTS `check_duplicities` (
`id` int(10) unsigned NOT NULL,
  `tablename` varchar(255) NOT NULL,
  `fields` varchar(255) NOT NULL,
  `type` enum('max_count','exact_count') NOT NULL,
  `limitation` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `status` enum('unchecked','checked','error','') NOT NULL DEFAULT 'unchecked',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=3 ;

-- --------------------------------------------------------

--
-- Table structure for table `check_duplicities_results`
--

CREATE TABLE IF NOT EXISTS `check_duplicities_results` (
`id` int(10) unsigned NOT NULL,
  `check_value_id` int(10) unsigned NOT NULL,
  `table_id` bigint(20) unsigned NOT NULL,
  `level` tinyint(2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `check_results`
--

CREATE TABLE IF NOT EXISTS `check_results` (
`id` int(10) unsigned NOT NULL,
  `check_value_id` int(10) unsigned NOT NULL,
  `table_id` bigint(20) unsigned NOT NULL,
  `level` tinyint(2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1613585245 ;

-- --------------------------------------------------------

--
-- Table structure for table `check_stat_table_contents`
--

CREATE TABLE IF NOT EXISTS `check_stat_table_contents` (
`id` int(10) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `list_query` text NOT NULL,
  `table1_query` text NOT NULL,
  `table2_query` text NOT NULL,
  `last_run_at` timestamp NULL DEFAULT NULL,
  `checked_rows` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=5 ;

-- --------------------------------------------------------

--
-- Table structure for table `check_stat_table_content_results`
--

CREATE TABLE IF NOT EXISTS `check_stat_table_content_results` (
`id` int(10) unsigned NOT NULL,
  `check_stat_table_content_id` int(10) unsigned NOT NULL,
  `list_data` varchar(255) NOT NULL,
  `table1_data` text NOT NULL,
  `table2_data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=2432 ;

-- --------------------------------------------------------

--
-- Table structure for table `check_values`
--

CREATE TABLE IF NOT EXISTS `check_values` (
`id` int(10) unsigned NOT NULL,
  `tablename` varchar(255) NOT NULL,
  `fieldname` varchar(255) NOT NULL,
  `checktype` enum('number','string','notnull','notempty') NOT NULL,
  `rule_hard` varchar(255) NOT NULL,
  `rule_hard_comment` varchar(255) NOT NULL,
  `rule_soft` varchar(255) NOT NULL,
  `rule_soft_comment` varchar(255) NOT NULL,
  `link` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=128 ;

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE IF NOT EXISTS `cities` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `country_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=44711 ;

-- --------------------------------------------------------

--
-- Table structure for table `clubs`
--

CREATE TABLE IF NOT EXISTS `clubs` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city_id` bigint(20) unsigned DEFAULT NULL,
  `color_1` varchar(7) DEFAULT NULL COMMENT 'Primary hex color code',
  `color_2` varchar(7) DEFAULT NULL COMMENT 'Secondary hex color code',
  `color_3` varchar(7) DEFAULT NULL COMMENT 'Tertiary hex color code',
  `ff_code` int(11) NOT NULL,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=11713 ;

-- --------------------------------------------------------

--
-- Table structure for table `club_management_columns`
--

CREATE TABLE IF NOT EXISTS `club_management_columns` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('text','number','float','boolean','date') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `column_order` int(11) DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=7 ;

-- --------------------------------------------------------

--
-- Table structure for table `club_management_column_values`
--

CREATE TABLE IF NOT EXISTS `club_management_column_values` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `column_id` bigint(20) unsigned NOT NULL,
  `value` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=18 ;

-- --------------------------------------------------------

--
-- Table structure for table `coaches`
--

CREATE TABLE IF NOT EXISTS `coaches` (
`id` bigint(20) unsigned NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(50) NOT NULL,
  `likedin` varchar(255) NOT NULL,
  `instagram` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `competitions`
--

CREATE TABLE IF NOT EXISTS `competitions` (
`id` bigint(20) unsigned NOT NULL,
  `season_id` bigint(20) unsigned DEFAULT NULL,
  `league_id` bigint(20) unsigned DEFAULT NULL,
  `league_name` varchar(100) DEFAULT NULL,
  `league_short_name` varchar(100) DEFAULT NULL,
  `league_veryshort_name` varchar(100) DEFAULT NULL,
  `country_id` bigint(20) unsigned DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `visible` tinyint(4) DEFAULT NULL,
  `ff_code` varchar(100) NOT NULL,
  `mkosz_code` varchar(255) DEFAULT NULL,
  `has_synergy_source` tinyint(4) DEFAULT NULL COMMENT 'null = not set, 0 = no, 1 = yes',
  `has_standing` tinyint(1) NOT NULL DEFAULT 1,
  `uuid` char(36) NOT NULL DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `roster_import_type` enum('wb','stats','stats_and_wb') NOT NULL DEFAULT 'stats'
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=2727 ;

-- --------------------------------------------------------

--
-- Table structure for table `competition_phases`
--

CREATE TABLE IF NOT EXISTS `competition_phases` (
`id` bigint(20) unsigned NOT NULL,
  `phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `visible` tinyint(4) DEFAULT 1,
  `priority` tinyint(4) DEFAULT NULL,
  `standings_type` enum('normal','group','lnp_normal') NOT NULL DEFAULT 'normal',
  `standings_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `standing_order` tinyint(4) DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `import_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=4369 ;

-- --------------------------------------------------------

--
-- Table structure for table `competition_phase_groups`
--

CREATE TABLE IF NOT EXISTS `competition_phase_groups` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `group_id` bigint(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=119 ;

-- --------------------------------------------------------

--
-- Table structure for table `competition_teams`
--

CREATE TABLE IF NOT EXISTS `competition_teams` (
`id` bigint(20) unsigned NOT NULL,
  `club_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `team_name` varchar(100) DEFAULT NULL,
  `short_name` varchar(255) DEFAULT NULL,
  `abbreviation` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `coach_id` bigint(20) unsigned DEFAULT NULL,
  `genius_conference_name` varchar(50) DEFAULT NULL,
  `genius_division_name` varchar(50) DEFAULT NULL,
  `sponsor_name` varchar(100) DEFAULT NULL,
  `logo` varchar(100) DEFAULT NULL,
  `arena_id` bigint(20) unsigned DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `tecnicalsponsor` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=56151 ;

-- --------------------------------------------------------

--
-- Table structure for table `continents`
--

CREATE TABLE IF NOT EXISTS `continents` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE IF NOT EXISTS `countries` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `ioc_code` varchar(50) NOT NULL,
  `alpha2_code` varchar(255) DEFAULT NULL,
  `currencies` varchar(255) DEFAULT NULL,
  `calling_code` varchar(255) DEFAULT NULL,
  `vat` tinyint(3) unsigned DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `continent_id` smallint(6) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=209 ;

-- --------------------------------------------------------

--
-- Table structure for table `garbage_time_yes`
--

CREATE TABLE IF NOT EXISTS `garbage_time_yes` (
  `lead` int(11) NOT NULL,
  `time_left_sec` int(11) NOT NULL,
  `possession` tinyint(4) NOT NULL CHECK (`possession` in (0,1)),
  `win_probability` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE IF NOT EXISTS `groups` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `ff_postfix` varchar(100) NOT NULL,
  `ff_phase_group` varchar(100) NOT NULL,
  `separator` varchar(1) NOT NULL DEFAULT '_',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=23 ;

-- --------------------------------------------------------

--
-- Table structure for table `highschools`
--

CREATE TABLE IF NOT EXISTS `highschools` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `interests`
--

CREATE TABLE IF NOT EXISTS `interests` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=7 ;

-- --------------------------------------------------------

--
-- Table structure for table `leagues`
--

CREATE TABLE IF NOT EXISTS `leagues` (
`id` bigint(20) unsigned NOT NULL,
  `ff_code` varchar(50) DEFAULT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `continent_id` bigint(20) unsigned DEFAULT NULL,
  `country_id` bigint(20) unsigned DEFAULT NULL,
  `value` smallint(6) DEFAULT NULL,
  `period_minute` tinyint(4) DEFAULT NULL,
  `overtime_minute` tinyint(4) DEFAULT NULL,
  `regular_period_count` tinyint(3) unsigned DEFAULT NULL,
  `is_international` tinyint(4) DEFAULT NULL,
  `type` enum('','usa_league','international_league','international_cup','national','domestic_league','domestic_cup','canada_league','hungary_league','mexican_league','ncaa','ncaa_conference','philipphine_league') DEFAULT NULL,
  `report_filter` enum('genius','automatic','manual') DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `is_county` tinyint(4) DEFAULT NULL,
  `is_adult` tinyint(4) DEFAULT NULL,
  `is_live` tinyint(1) NOT NULL DEFAULT 0,
  `game_format` enum('5x5','3x3') NOT NULL DEFAULT '5x5',
  `division` tinyint(4) NOT NULL DEFAULT 1,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `roster_import_type` enum('wb','stats','stats_and_wb') NOT NULL DEFAULT 'stats'
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPACT AUTO_INCREMENT=253 ;

-- --------------------------------------------------------

--
-- Table structure for table `log_skipped_synergy_players`
--

CREATE TABLE IF NOT EXISTS `log_skipped_synergy_players` (
`id` int(10) unsigned NOT NULL,
  `synergy_id_hash` varchar(255) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=15 ;

-- --------------------------------------------------------

--
-- Table structure for table `mapping_agents`
--

CREATE TABLE IF NOT EXISTS `mapping_agents` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `source_id` varchar(255) NOT NULL,
  `mapping_source_id` bigint(20) unsigned NOT NULL,
  `agent_id` bigint(20) unsigned NOT NULL,
  `url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4689 ;

-- --------------------------------------------------------

--
-- Table structure for table `mapping_competitions`
--

CREATE TABLE IF NOT EXISTS `mapping_competitions` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `source_id` varchar(255) DEFAULT NULL,
  `mapping_source_id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `season_id` bigint(20) unsigned NOT NULL,
  `season` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=25 ;

-- --------------------------------------------------------

--
-- Table structure for table `mapping_players`
--

CREATE TABLE IF NOT EXISTS `mapping_players` (
`id` bigint(20) unsigned NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `source_id` varchar(255) DEFAULT NULL,
  `mapping_source_id` bigint(20) unsigned NOT NULL,
  `mapping_team_id` bigint(20) unsigned DEFAULT NULL,
  `mapping_competition_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `height` tinyint(3) unsigned DEFAULT NULL,
  `weight` tinyint(3) unsigned DEFAULT NULL,
  `jersey` varchar(5) DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=10345 ;

-- --------------------------------------------------------

--
-- Table structure for table `mapping_sources`
--

CREATE TABLE IF NOT EXISTS `mapping_sources` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=7 ;

-- --------------------------------------------------------

--
-- Table structure for table `mapping_teams`
--

CREATE TABLE IF NOT EXISTS `mapping_teams` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `source_id` varchar(255) DEFAULT NULL,
  `mapping_source_id` bigint(20) unsigned NOT NULL,
  `mapping_competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1297 ;

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

CREATE TABLE IF NOT EXISTS `media` (
`id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `collection_name` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `disk` varchar(255) NOT NULL,
  `conversions_disk` varchar(255) DEFAULT NULL,
  `size` bigint(20) unsigned NOT NULL,
  `manipulations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`manipulations`)),
  `custom_properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`custom_properties`)),
  `generated_conversions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`generated_conversions`)),
  `responsive_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`responsive_images`)),
  `order_column` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=200151 ;

-- --------------------------------------------------------

--
-- Table structure for table `media_categories`
--

CREATE TABLE IF NOT EXISTS `media_categories` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('player','team','competition','daily','other') DEFAULT 'player',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=31 ;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_access_tokens`
--

CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
  `id` varchar(100) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `client_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_auth_codes`
--

CREATE TABLE IF NOT EXISTS `oauth_auth_codes` (
  `id` varchar(100) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `client_id` bigint(20) unsigned NOT NULL,
  `scopes` text DEFAULT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_clients`
--

CREATE TABLE IF NOT EXISTS `oauth_clients` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `secret` varchar(100) DEFAULT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `redirect` text NOT NULL,
  `personal_access_client` tinyint(1) NOT NULL,
  `password_client` tinyint(1) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=6 ;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_personal_access_clients`
--

CREATE TABLE IF NOT EXISTS `oauth_personal_access_clients` (
`id` bigint(20) unsigned NOT NULL,
  `client_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_refresh_tokens`
--

CREATE TABLE IF NOT EXISTS `oauth_refresh_tokens` (
  `id` varchar(100) NOT NULL,
  `access_token_id` varchar(100) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_coupons`
--

CREATE TABLE IF NOT EXISTS `payment_coupons` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `type` enum('credit','package') NOT NULL DEFAULT 'credit',
  `credit_amount` int(10) unsigned DEFAULT NULL,
  `payment_package_id` bigint(20) unsigned DEFAULT NULL,
  `system_maximum` int(10) unsigned DEFAULT NULL,
  `user_maximum` int(10) unsigned DEFAULT NULL,
  `is_before_only_first_order` tinyint(1) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=21 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_credit_purchases`
--

CREATE TABLE IF NOT EXISTS `payment_credit_purchases` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `amount` bigint(20) NOT NULL,
  `eur` decimal(8,2) DEFAULT NULL,
  `live_after` datetime DEFAULT NULL,
  `stripe_session_id` varchar(255) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `status` enum('created','completed','cancelled','failed') DEFAULT 'created',
  `description` text DEFAULT NULL,
  `is_from_admin` tinyint(1) NOT NULL DEFAULT 0,
  `coupon_id` bigint(20) unsigned DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=573 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_credit_tiers`
--

CREATE TABLE IF NOT EXISTS `payment_credit_tiers` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `price` decimal(8,2) DEFAULT NULL,
  `minimum` int(10) unsigned DEFAULT NULL,
  `discount` tinyint(3) unsigned DEFAULT NULL,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_credit_uses`
--

CREATE TABLE IF NOT EXISTS `payment_credit_uses` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `credit` bigint(20) unsigned NOT NULL DEFAULT 1,
  `purchasable_id` bigint(20) unsigned DEFAULT NULL,
  `purchasable_type` varchar(255) DEFAULT NULL,
  `module` varchar(255) DEFAULT NULL,
  `season_id` bigint(20) unsigned DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0,
  `period_type` enum('monthly','yearly') DEFAULT NULL,
  `shopping_status` enum('created','pending','future','completed','cancelled') NOT NULL DEFAULT 'completed',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `coupon_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=687 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_extensions`
--

CREATE TABLE IF NOT EXISTS `payment_extensions` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('historical','ncaa_pbp','ncaa_pbp_historical') NOT NULL DEFAULT 'historical',
  `payment_package_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=6 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_packages`
--

CREATE TABLE IF NOT EXISTS `payment_packages` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_press` tinyint(1) NOT NULL DEFAULT 0,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `is_purchasable` tinyint(1) NOT NULL DEFAULT 1,
  `is_trial` tinyint(1) NOT NULL DEFAULT 0,
  `price_monthly` int(10) unsigned DEFAULT NULL,
  `price_yearly` int(10) unsigned DEFAULT NULL,
  `price_playtag` int(10) unsigned NOT NULL DEFAULT 1,
  `save` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `leagues` smallint(5) unsigned DEFAULT NULL,
  `clubs` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `users` tinyint(3) unsigned DEFAULT NULL,
  `is_data` tinyint(1) NOT NULL DEFAULT 0,
  `is_analyst_ui` tinyint(1) NOT NULL DEFAULT 0,
  `is_custom_screens` tinyint(1) NOT NULL DEFAULT 0,
  `custom_screens` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `is_playtag` tinyint(1) NOT NULL DEFAULT 0,
  `is_videotag` tinyint(1) NOT NULL DEFAULT 0,
  `is_api` tinyint(1) NOT NULL DEFAULT 0,
  `is_historical` tinyint(1) NOT NULL DEFAULT 0,
  `historical_seasons` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `historical_price` int(10) unsigned NOT NULL DEFAULT 0,
  `is_ncaa_pbp` tinyint(1) NOT NULL DEFAULT 0,
  `ncaa_pbp_price` int(10) unsigned NOT NULL DEFAULT 0,
  `ncaa_pbp_historical_price` int(10) unsigned NOT NULL DEFAULT 0,
  `is_medium_validation` tinyint(1) NOT NULL DEFAULT 0,
  `is_logo_hashtag_post` tinyint(1) NOT NULL DEFAULT 0,
  `consultation` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `training` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_public_items`
--

CREATE TABLE IF NOT EXISTS `payment_public_items` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('player_shooting_chart','team_shooting_chart','player_overview','team_overview') NOT NULL DEFAULT 'player_shooting_chart',
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `search_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`search_data`)),
  `htmlData` longtext DEFAULT NULL,
  `htmlData2` longtext DEFAULT NULL,
  `price` int(10) unsigned NOT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `is_sale` tinyint(1) NOT NULL DEFAULT 0,
  `sale_badge` varchar(255) DEFAULT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_public_purchases`
--

CREATE TABLE IF NOT EXISTS `payment_public_purchases` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `payment_public_item_id` bigint(20) unsigned DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `shipping_price_id` bigint(20) unsigned DEFAULT NULL,
  `shipping_price` decimal(6,2) DEFAULT NULL,
  `stripe_session_id` varchar(255) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `status` enum('created','completed','cancelled','failed') NOT NULL DEFAULT 'created',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=20 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_purchasable_modules`
--

CREATE TABLE IF NOT EXISTS `payment_purchasable_modules` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `permission_name` varchar(255) NOT NULL,
  `credit_amount` smallint(5) unsigned NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_selected_competitions`
--

CREATE TABLE IF NOT EXISTS `payment_selected_competitions` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `slot` tinyint(3) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=273 ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_shipping_prices`
--

CREATE TABLE IF NOT EXISTS `payment_shipping_prices` (
`id` bigint(20) unsigned NOT NULL,
  `country_id` bigint(20) unsigned NOT NULL,
  `country_code` varchar(255) NOT NULL,
  `currency` varchar(255) NOT NULL,
  `price` decimal(6,2) NOT NULL,
  `min_days` tinyint(3) unsigned NOT NULL,
  `max_days` tinyint(3) unsigned NOT NULL,
  `raw_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`raw_data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=172 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp`
--

CREATE TABLE IF NOT EXISTS `pbp` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `pbp_schedule_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `side` tinyint(4) DEFAULT NULL,
  `time` time DEFAULT NULL,
  `period` tinyint(4) DEFAULT NULL,
  `fc_code` smallint(6) DEFAULT NULL,
  `fc_subcode` tinyint(4) DEFAULT NULL,
  `pts_scored` enum('1','2','3','0') DEFAULT NULL,
  `play_type_player_id` bigint(20) unsigned DEFAULT NULL,
  `play_type_player_id2` bigint(20) unsigned DEFAULT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `play_type_drive` enum('Drive-Right','Drive-Left','Drive-Straight','Drive-Other') DEFAULT NULL,
  `is_play_type_active` tinyint(1) NOT NULL DEFAULT 1,
  `play_type_pbp_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Pbp id for to group same play events.',
  `x` smallint(6) DEFAULT NULL,
  `y` smallint(6) DEFAULT NULL,
  `x_normalized` smallint(5) unsigned DEFAULT NULL,
  `y_normalized` smallint(5) unsigned DEFAULT NULL,
  `distance` mediumint(8) unsigned DEFAULT NULL COMMENT 'distance from the rim in cm.',
  `zone` enum('3L','3C','RIM','PAINT','NON PAINT','','3H') DEFAULT NULL,
  `order` smallint(6) DEFAULT NULL,
  `possession` int(11) DEFAULT NULL COMMENT 'Possession counter in a game per team',
  `possession_side` tinyint(4) DEFAULT NULL,
  `defensive_team_id` int(11) DEFAULT NULL,
  `offensive_team_id` int(11) DEFAULT NULL,
  `home_score` tinyint(4) unsigned NOT NULL,
  `away_score` tinyint(4) unsigned NOT NULL,
  `diff_score` int(11) DEFAULT NULL,
  `source_event_id` varchar(50) DEFAULT NULL,
  `home_player1` bigint(20) unsigned DEFAULT NULL,
  `home_player2` bigint(20) unsigned DEFAULT NULL,
  `home_player3` bigint(20) unsigned DEFAULT NULL,
  `home_player4` bigint(20) unsigned DEFAULT NULL,
  `home_player5` bigint(20) unsigned DEFAULT NULL,
  `away_player1` bigint(20) unsigned DEFAULT NULL,
  `away_player2` bigint(20) unsigned DEFAULT NULL,
  `away_player3` bigint(20) unsigned DEFAULT NULL,
  `away_player4` bigint(20) unsigned DEFAULT NULL,
  `away_player5` bigint(20) unsigned DEFAULT NULL,
  `shot_clock` tinyint(3) unsigned DEFAULT NULL,
  `assist_player` bigint(20) unsigned DEFAULT NULL COMMENT 'player_id of the player who made the assist on a missed shot',
  `contested` tinyint(4) DEFAULT NULL,
  `dribble` enum('0','1','2+') DEFAULT NULL,
  `is_transition` tinyint(1) DEFAULT NULL,
  `two_for_one` tinyint(1) DEFAULT NULL,
  `start_type` enum('FG_deadball','FGM','FTM','TOV_Live','TOV_deadball','OREB','FG_DREB','TOV_Team','Missed_FT_Live','Missed_FT_Dead','Period_Start','TBD') DEFAULT NULL,
  `is_garbage_time` tinyint(1) DEFAULT NULL,
  `home_bonus` tinyint(1) DEFAULT NULL,
  `away_bonus` tinyint(1) DEFAULT NULL,
  `rebound_chasing_player_id` bigint(20) unsigned DEFAULT NULL,
  `rebound_chasing_outcome` enum('offensive_rebound','defensive_rebound') DEFAULT NULL,
  `rebound_chasing_points` smallint(6) DEFAULT NULL,
  `rebound_chasing_skipped` smallint(6) NOT NULL DEFAULT 0,
  `rebound_chasing_status1` smallint(6) DEFAULT NULL,
  `rebound_chasing_status2` smallint(6) DEFAULT NULL,
  `rebound_chasing_status3` smallint(6) DEFAULT NULL,
  `rebound_chasing_status4` smallint(6) DEFAULT NULL,
  `rebound_chasing_status5` smallint(6) DEFAULT NULL,
  `mplus` int(10) unsigned DEFAULT NULL,
  `moreypps` decimal(10,2) DEFAULT NULL,
  `source_text` varchar(200) DEFAULT NULL,
  `source_play_type_text` varchar(255) DEFAULT NULL,
  `time_actual` timestamp NULL DEFAULT NULL COMMENT 'Timestamp, when the event was created in the source',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=234526969 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_advanced_tags`
--

CREATE TABLE IF NOT EXISTS `pbp_advanced_tags` (
`id` bigint(20) unsigned NOT NULL,
  `pbp_id` bigint(20) unsigned NOT NULL,
  `tag_group_id` bigint(20) unsigned NOT NULL,
  `tag_button_id` bigint(20) unsigned DEFAULT NULL,
  `is_skipped` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_advanced_tag_buttons`
--

CREATE TABLE IF NOT EXISTS `pbp_advanced_tag_buttons` (
`id` bigint(20) unsigned NOT NULL,
  `tag_group_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `key` varchar(1) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_advanced_tag_groups`
--

CREATE TABLE IF NOT EXISTS `pbp_advanced_tag_groups` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_codes`
--

CREATE TABLE IF NOT EXISTS `pbp_codes` (
`id` int(11) NOT NULL,
  `pbp_code_id` int(11) NOT NULL,
  `event_type` enum('main','sub') NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=37 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_event_connections`
--

CREATE TABLE IF NOT EXISTS `pbp_event_connections` (
`id` bigint(20) NOT NULL,
  `schedule_id` bigint(20) NOT NULL,
  `source_id1` bigint(20) unsigned DEFAULT NULL,
  `source_id2` bigint(20) unsigned DEFAULT NULL,
  `pbp_id1` bigint(20) unsigned DEFAULT NULL,
  `pbp_id2` bigint(20) unsigned DEFAULT NULL,
  `tag_user_id` bigint(20) unsigned DEFAULT NULL,
  `tag_status` enum('incorrect_video','review','tagged','no_video','quarantine') DEFAULT NULL,
  `tagged_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=69803467 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_event_videos`
--

CREATE TABLE IF NOT EXISTS `pbp_event_videos` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `pbp_id` bigint(20) unsigned NOT NULL,
  `url` varchar(255) NOT NULL,
  `real_url` varchar(255) DEFAULT NULL,
  `duration` smallint(5) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=35758183 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_schedule`
--

CREATE TABLE IF NOT EXISTS `pbp_schedule` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `home_score` int(10) unsigned DEFAULT NULL,
  `away_score` int(10) unsigned DEFAULT NULL,
  `lineups_available` enum('0','1') DEFAULT NULL,
  `shot_location_available` enum('0','1') DEFAULT NULL,
  `gameclock_available` enum('full','minutes','none') DEFAULT NULL,
  `data_health` enum('complete','incomplete','quarantine') DEFAULT NULL,
  `event_num` smallint(6) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `score_updated_at` timestamp NULL DEFAULT NULL,
  `tagged_at` timestamp NULL DEFAULT NULL COMMENT 'tagged by video the tagging tool',
  `connected_at` timestamp NULL DEFAULT NULL COMMENT 'PBP events were connected manually in pbp_event_connections table',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `calculations_made_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=547715 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_sources`
--

CREATE TABLE IF NOT EXISTS `pbp_sources` (
`id` bigint(20) unsigned NOT NULL,
  `source_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `pbp_zone_review`
--

CREATE TABLE IF NOT EXISTS `pbp_zone_review` (
`id` int(11) NOT NULL,
  `pbp_id_src1` int(11) NOT NULL,
  `pbp_id_src2` int(11) NOT NULL,
  `pbp_id_src3` int(11) NOT NULL,
  `original_zone` varchar(50) DEFAULT NULL,
  `selected_zone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `dribble_range` varchar(3) DEFAULT NULL,
  `original_tag` varchar(3) DEFAULT NULL,
  `original_info` text DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=451 ;

-- --------------------------------------------------------

--
-- Table structure for table `phases`
--

CREATE TABLE IF NOT EXISTS `phases` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `name_short` varchar(255) DEFAULT NULL,
  `type` enum('reagular','qualification','second_phase','playoff','playin','playout','preseason','showcase','finals','cup','clock','scup','challenge') DEFAULT NULL,
  `ff_postfix` varchar(30) NOT NULL,
  `separator` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=35 ;

-- --------------------------------------------------------

--
-- Table structure for table `players`
--

CREATE TABLE IF NOT EXISTS `players` (
`id` bigint(20) unsigned NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `nick_name` varchar(255) DEFAULT NULL,
  `first_name_native` varchar(100) DEFAULT NULL,
  `last_name_native` varchar(100) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `birth_place` varchar(100) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `country_id` bigint(20) unsigned DEFAULT NULL,
  `highschool_almamater` varchar(255) DEFAULT NULL,
  `highschool_almamater_id` int(11) DEFAULT NULL,
  `almamater` varchar(255) DEFAULT 'NULL',
  `college` varchar(100) DEFAULT NULL,
  `college_id` int(11) DEFAULT NULL,
  `draft` varchar(100) DEFAULT NULL,
  `draft_year` int(11) DEFAULT NULL,
  `draft_pick` int(11) DEFAULT NULL,
  `highschool_id` bigint(20) unsigned DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `ff_code` varchar(10) DEFAULT 'NULL' COMMENT 'Fullfield ID',
  `source_id` int(11) DEFAULT NULL COMMENT 'Native Source ID',
  `synergy_id` int(11) DEFAULT NULL,
  `instat_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=265983 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_agents`
--

CREATE TABLE IF NOT EXISTS `player_agents` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `agent_id` bigint(20) unsigned NOT NULL,
  `terminated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=18293 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_ai_data`
--

CREATE TABLE IF NOT EXISTS `player_ai_data` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `data1` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data1`)),
  `data2` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data2`)),
  `new_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`new_info`)),
  `checked` tinyint(3) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2253 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_ai_source_ids`
--

CREATE TABLE IF NOT EXISTS `player_ai_source_ids` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `source` varchar(255) NOT NULL,
  `source_id` varchar(255) NOT NULL,
  `source_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=12108 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_bios`
--

CREATE TABLE IF NOT EXISTS `player_bios` (
  `player_id` int(11) NOT NULL,
  `height` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `ff_code` varchar(255) DEFAULT NULL,
`id` bigint(20) unsigned NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=329071 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_combine_measurements`
--

CREATE TABLE IF NOT EXISTS `player_combine_measurements` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `player_code` varchar(255) NOT NULL,
  `year` varchar(10) NOT NULL,
  `player_name` varchar(255) NOT NULL,
  `role` varchar(10) NOT NULL,
  `lane_agility_sec` double NOT NULL,
  `shuttle_run_sec` double NOT NULL,
  `three_quarter_sprint_sec` double NOT NULL,
  `standing_vertical_leap_inch` double NOT NULL,
  `max_vertical_leap_inch` double NOT NULL,
  `max_vertical_leap_cm` double NOT NULL,
  `max_bench_press_rep` int(11) NOT NULL,
  `body_fat_perc` double NOT NULL,
  `hand_length_inch` double NOT NULL,
  `hand_width_inch` double NOT NULL,
  `hand_length_cm` double NOT NULL,
  `hand_width_cm` double NOT NULL,
  `height_no_shoes_inch` varchar(20) NOT NULL,
  `height_with_shoes_inch` varchar(20) NOT NULL,
  `height_no_shoes_cm` double NOT NULL,
  `height_with_shoes_cm` double NOT NULL,
  `standing_reach_inch` varchar(20) NOT NULL,
  `standing_reach_cm` double NOT NULL,
  `weight_lbs` double NOT NULL,
  `weight_kg` double NOT NULL,
  `wingspan_inch` varchar(20) NOT NULL,
  `wingspan_cm` double NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci AUTO_INCREMENT=3107 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_merge_decisions`
--

CREATE TABLE IF NOT EXISTS `player_merge_decisions` (
`id` bigint(20) unsigned NOT NULL,
  `player_id_a` bigint(20) unsigned NOT NULL,
  `player_id_b` bigint(20) unsigned NOT NULL,
  `decision` enum('not_same','low_data','skip','merged') NOT NULL,
  `note` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_ip` varbinary(16) DEFAULT NULL,
  `updated_ip` varbinary(16) DEFAULT NULL,
  `skip_until` datetime DEFAULT NULL,
  `skip_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=81 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_merge_logs`
--

CREATE TABLE IF NOT EXISTS `player_merge_logs` (
`id` bigint(11) NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `good_player_id` bigint(20) unsigned NOT NULL,
  `bad_player_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('running','failed','done') NOT NULL DEFAULT 'running',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=325 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_salaries`
--

CREATE TABLE IF NOT EXISTS `player_salaries` (
`id` bigint(20) unsigned NOT NULL,
  `season_id` bigint(20) unsigned DEFAULT NULL,
  `owner_club_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `salary` bigint(20) unsigned DEFAULT NULL COMMENT 'USD',
  `contract_year_left` smallint(5) unsigned DEFAULT NULL,
  `buy_out_type` varchar(50) DEFAULT NULL,
  `buy_out` bigint(20) unsigned DEFAULT NULL,
  `trend` smallint(5) unsigned DEFAULT NULL,
  `ls_mj_tier` smallint(5) unsigned DEFAULT NULL,
  `zs_tier` smallint(5) unsigned DEFAULT NULL,
  `mh_tier` smallint(5) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=896 ;

-- --------------------------------------------------------

--
-- Table structure for table `player_salary_offers`
--

CREATE TABLE IF NOT EXISTS `player_salary_offers` (
`id` bigint(20) unsigned NOT NULL,
  `season_id` bigint(20) unsigned DEFAULT NULL,
  `owner_club_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `offer` bigint(20) unsigned DEFAULT NULL COMMENT 'USD',
  `offer_date` date DEFAULT NULL,
  `agent_id` bigint(20) unsigned DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=515 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_event_types`
--

CREATE TABLE IF NOT EXISTS `playtag_event_types` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `pbp_code_id` bigint(20) unsigned DEFAULT NULL,
  `pts` int(10) unsigned DEFAULT NULL,
  `is_hidden` tinyint(1) DEFAULT 0,
  `no_ppp` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=13 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_game_colors`
--

CREATE TABLE IF NOT EXISTS `playtag_game_colors` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `color` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=155 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_game_plays`
--

CREATE TABLE IF NOT EXISTS `playtag_game_plays` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `playtag_play_id` bigint(20) unsigned NOT NULL,
  `play_type` set('offensive','defensive','other') NOT NULL DEFAULT 'offensive',
  `play_order` smallint(5) unsigned NOT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4017 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_game_play_events`
--

CREATE TABLE IF NOT EXISTS `playtag_game_play_events` (
`id` bigint(20) unsigned NOT NULL,
  `playtag_game_play_id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `playtag_play_id` bigint(20) unsigned NOT NULL,
  `play_type` set('offensive','defensive','other') NOT NULL DEFAULT 'offensive',
  `players` varchar(255) DEFAULT NULL,
  `selected_player_id` bigint(20) unsigned DEFAULT NULL,
  `period` tinyint(3) unsigned DEFAULT NULL,
  `playtag_event_type_id` bigint(20) unsigned NOT NULL,
  `pbp_id` bigint(20) unsigned DEFAULT NULL,
  `playtag_pbp_id` bigint(20) unsigned DEFAULT NULL,
  `after_pbp_id` bigint(20) unsigned DEFAULT NULL,
  `after_playtag_pbp_id` bigint(20) unsigned DEFAULT NULL,
  `no_pbp` tinyint(1) NOT NULL DEFAULT 0,
  `is_made_by_ai` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=35225 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_pbp`
--

CREATE TABLE IF NOT EXISTS `playtag_pbp` (
`id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `pbp_schedule_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `orig_player_id` varchar(255) DEFAULT NULL,
  `orig_player_id2` varchar(255) DEFAULT NULL,
  `player_name` varchar(100) DEFAULT NULL,
  `player_name2` varchar(100) DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `side` tinyint(3) unsigned DEFAULT NULL,
  `time` time DEFAULT NULL,
  `period` tinyint(3) unsigned DEFAULT NULL,
  `fc_code` smallint(5) unsigned DEFAULT NULL,
  `fc_subcode` smallint(5) unsigned DEFAULT NULL,
  `pts_scored` enum('1','2','3','0') DEFAULT NULL,
  `order` smallint(5) unsigned DEFAULT NULL,
  `home_score` tinyint(3) unsigned DEFAULT NULL,
  `away_score` tinyint(3) unsigned DEFAULT NULL,
  `home_player1` bigint(20) unsigned DEFAULT NULL,
  `home_player2` bigint(20) unsigned DEFAULT NULL,
  `home_player3` bigint(20) unsigned DEFAULT NULL,
  `home_player4` bigint(20) unsigned DEFAULT NULL,
  `home_player5` bigint(20) unsigned DEFAULT NULL,
  `away_player1` bigint(20) unsigned DEFAULT NULL,
  `away_player2` bigint(20) unsigned DEFAULT NULL,
  `away_player3` bigint(20) unsigned DEFAULT NULL,
  `away_player4` bigint(20) unsigned DEFAULT NULL,
  `away_player5` bigint(20) unsigned DEFAULT NULL,
  `player_names` text DEFAULT NULL,
  `orig_home_player1` varchar(255) DEFAULT NULL,
  `orig_home_player2` varchar(255) DEFAULT NULL,
  `orig_home_player3` varchar(255) DEFAULT NULL,
  `orig_home_player4` varchar(255) DEFAULT NULL,
  `orig_home_player5` varchar(255) DEFAULT NULL,
  `orig_away_player1` varchar(255) DEFAULT NULL,
  `orig_away_player2` varchar(255) DEFAULT NULL,
  `orig_away_player3` varchar(255) DEFAULT NULL,
  `orig_away_player4` varchar(255) DEFAULT NULL,
  `orig_away_player5` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=40123 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_plays`
--

CREATE TABLE IF NOT EXISTS `playtag_plays` (
`id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `play_type` set('offensive','defensive','other') NOT NULL DEFAULT 'offensive',
  `color` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1401 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_playsets`
--

CREATE TABLE IF NOT EXISTS `playtag_playsets` (
`id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_playset_play`
--

CREATE TABLE IF NOT EXISTS `playtag_playset_play` (
`id` bigint(20) unsigned NOT NULL,
  `playtag_playset_id` bigint(20) unsigned NOT NULL,
  `playtag_play_id` bigint(20) unsigned NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=51 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_schedule_players`
--

CREATE TABLE IF NOT EXISTS `playtag_schedule_players` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `side` tinyint(1) NOT NULL DEFAULT 1,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(1) NOT NULL DEFAULT 0,
  `original_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `jersey` tinyint(3) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2983 ;

-- --------------------------------------------------------

--
-- Table structure for table `playtag_shares`
--

CREATE TABLE IF NOT EXISTS `playtag_shares` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=16 ;

-- --------------------------------------------------------

--
-- Table structure for table `polar_events`
--

CREATE TABLE IF NOT EXISTS `polar_events` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `polar_team_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `session_name` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `phase_name` varchar(255) NOT NULL,
  `duration` time NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `headers` text DEFAULT NULL,
  `file_content` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=79 ;

-- --------------------------------------------------------

--
-- Table structure for table `polar_event_data`
--

CREATE TABLE IF NOT EXISTS `polar_event_data` (
`id` bigint(20) unsigned NOT NULL,
  `polar_event_id` bigint(20) unsigned NOT NULL,
  `polar_player_id` bigint(20) unsigned NOT NULL,
  `hr_min` tinyint(3) unsigned NOT NULL,
  `hr_avg` tinyint(3) unsigned NOT NULL,
  `hr_max` tinyint(3) unsigned NOT NULL,
  `hr_min_percent` tinyint(3) unsigned NOT NULL,
  `hr_avg_percent` tinyint(3) unsigned NOT NULL,
  `hr_max_percent` tinyint(3) unsigned NOT NULL,
  `time_in_hr_zone_1` time NOT NULL,
  `time_in_hr_zone_2` time NOT NULL,
  `time_in_hr_zone_3` time NOT NULL,
  `time_in_hr_zone_4` time NOT NULL,
  `time_in_hr_zone_5` time NOT NULL,
  `total_distance` mediumint(8) unsigned NOT NULL,
  `distance_per_min` mediumint(8) unsigned NOT NULL,
  `maximum_speed` decimal(4,1) unsigned NOT NULL,
  `average_speed` decimal(4,1) unsigned NOT NULL,
  `sprints` mediumint(8) unsigned NOT NULL,
  `distance_in_speed_zone_1` mediumint(8) unsigned NOT NULL,
  `distance_in_speed_zone_2` mediumint(8) unsigned NOT NULL,
  `distance_in_speed_zone_3` mediumint(8) unsigned NOT NULL,
  `distance_in_speed_zone_4` mediumint(8) unsigned NOT NULL,
  `distance_in_speed_zone_5` mediumint(8) unsigned NOT NULL,
  `training_load_score` mediumint(8) unsigned NOT NULL,
  `cardio_load` mediumint(8) unsigned NOT NULL,
  `recovery_time` decimal(4,1) unsigned NOT NULL,
  `calories` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_1` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_2` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_3` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_4` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_5` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_6` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_7` mediumint(8) unsigned NOT NULL,
  `number_of_accelerations_8` mediumint(8) unsigned NOT NULL,
  `time_in_performance_zone_1` time NOT NULL,
  `time_in_performance_zone_2` time NOT NULL,
  `time_in_performance_zone_3` time NOT NULL,
  `time_in_performance_zone_4` time NOT NULL,
  `time_in_performance_zone_5` time NOT NULL,
  `muscle_load_in_performance_zone_1` mediumint(8) unsigned NOT NULL,
  `muscle_load_in_performance_zone_2` mediumint(8) unsigned NOT NULL,
  `muscle_load_in_performance_zone_3` mediumint(8) unsigned NOT NULL,
  `muscle_load_in_performance_zone_4` mediumint(8) unsigned NOT NULL,
  `muscle_load_in_performance_zone_5` mediumint(8) unsigned NOT NULL,
  `muscle_load` mediumint(8) unsigned NOT NULL,
  `minimum_rr_interval` mediumint(8) unsigned NOT NULL,
  `maximum_rr_interval` mediumint(8) unsigned NOT NULL,
  `average_rr_interval` mediumint(8) unsigned NOT NULL,
  `hrv` mediumint(8) unsigned NOT NULL,
  `intense_micro_movements` mediumint(8) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=867 ;

-- --------------------------------------------------------

--
-- Table structure for table `polar_players`
--

CREATE TABLE IF NOT EXISTS `polar_players` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `polar_team_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL COMMENT 'ffb player id',
  `jersey` mediumint(8) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=92 ;

-- --------------------------------------------------------

--
-- Table structure for table `polar_teams`
--

CREATE TABLE IF NOT EXISTS `polar_teams` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL COMMENT 'FFB Team ID',
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- Table structure for table `report_cache`
--

CREATE TABLE IF NOT EXISTS `report_cache` (
`id` bigint(20) unsigned NOT NULL,
  `report_name` varchar(255) NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `club_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `league_id` bigint(20) unsigned DEFAULT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `view_type` varchar(50) NOT NULL COMMENT 'e.g., totals, averages, per40',
  `grouping_key` varchar(255) DEFAULT NULL COMMENT 'e.g., age_group for this report',
  `event_date` datetime DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `listed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1036961 ;

-- --------------------------------------------------------

--
-- Table structure for table `report_player_roles`
--

CREATE TABLE IF NOT EXISTS `report_player_roles` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `position` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=673 ;

-- --------------------------------------------------------

--
-- Table structure for table `report_shot_distance`
--

CREATE TABLE IF NOT EXISTS `report_shot_distance` (
`id` int(11) NOT NULL,
  `competition_id` int(11) NOT NULL,
  `source_id1` int(11) NOT NULL,
  `source_id2` int(11) NOT NULL,
  `shots` int(11) NOT NULL,
  `distance` double NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1328 ;

-- --------------------------------------------------------

--
-- Table structure for table `roster`
--

CREATE TABLE IF NOT EXISTS `roster` (
`id` int(10) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `jersey` varchar(10) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `contract_to` timestamp NULL DEFAULT NULL,
  `contract_from` timestamp NULL DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=843429 ;

-- --------------------------------------------------------

--
-- Table structure for table `roster_deleted_players`
--

CREATE TABLE IF NOT EXISTS `roster_deleted_players` (
`id` int(10) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `jersey` varchar(10) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `contract_to` timestamp NULL DEFAULT NULL,
  `contract_from` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=454995 ;

-- --------------------------------------------------------

--
-- Table structure for table `roster_restored`
--

CREATE TABLE IF NOT EXISTS `roster_restored` (
`id` int(10) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `jersey` varchar(10) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `contract_to` timestamp NULL DEFAULT NULL,
  `contract_from` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=488994 ;

-- --------------------------------------------------------

--
-- Table structure for table `schedule`
--

CREATE TABLE IF NOT EXISTS `schedule` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_group_id` bigint(20) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `home_id` bigint(20) unsigned DEFAULT NULL,
  `away_id` bigint(20) unsigned DEFAULT NULL,
  `home_score` bigint(20) DEFAULT NULL,
  `away_score` bigint(20) DEFAULT NULL,
  `period_score` varchar(50) DEFAULT NULL,
  `score_target` int(11) DEFAULT NULL,
  `round_id` bigint(20) unsigned DEFAULT NULL,
  `arena_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('ready','live','finished','postponed','invisible','protested','not_played','manual','bye','abandoned','cancelled','forfeit','excluded') NOT NULL DEFAULT 'ready',
  `ff_code` varchar(50) NOT NULL,
  `home_coach_id` bigint(20) unsigned DEFAULT NULL,
  `away_coach_id` bigint(20) unsigned DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `native_code` varchar(100) DEFAULT NULL,
  `data_health` enum('complete','incomplete','quarantine') DEFAULT NULL,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=647407 ;

-- --------------------------------------------------------

--
-- Table structure for table `schedule_rounds`
--

CREATE TABLE IF NOT EXISTS `schedule_rounds` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=51 ;

-- --------------------------------------------------------

--
-- Table structure for table `schedule_tv_flags`
--

CREATE TABLE IF NOT EXISTS `schedule_tv_flags` (
  `schedule_id` bigint(20) unsigned NOT NULL,
  `is_tv` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tv_channel` varchar(64) NOT NULL DEFAULT '',
  `tv_time_offset` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `searches`
--

CREATE TABLE IF NOT EXISTS `searches` (
`id` bigint(20) unsigned NOT NULL,
  `hash` varchar(255) NOT NULL,
  `request_params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`request_params`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3295 ;

-- --------------------------------------------------------

--
-- Table structure for table `seasons`
--

CREATE TABLE IF NOT EXISTS `seasons` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('regular','summer') NOT NULL,
  `season_year` year(4) NOT NULL,
  `ff_code` varchar(100) NOT NULL,
  `active` tinyint(4) NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `uuid` char(36) DEFAULT uuid(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=401 ;

-- --------------------------------------------------------

--
-- Table structure for table `shared_playlists`
--

CREATE TABLE IF NOT EXISTS `shared_playlists` (
`id` int(11) NOT NULL,
  `share_uuid` varchar(36) NOT NULL,
  `pbp_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`pbp_ids`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci AUTO_INCREMENT=29 ;

-- --------------------------------------------------------

--
-- Table structure for table `shooting_chart_guest_histories`
--

CREATE TABLE IF NOT EXISTS `shooting_chart_guest_histories` (
`id` bigint(20) unsigned NOT NULL,
  `guest_id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `route` varchar(255) DEFAULT NULL,
  `search_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`search_data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=13 ;

-- --------------------------------------------------------

--
-- Table structure for table `shooting_chart_user_histories`
--

CREATE TABLE IF NOT EXISTS `shooting_chart_user_histories` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `route` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `search_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`search_data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=311 ;

-- --------------------------------------------------------

--
-- Table structure for table `shortlists`
--

CREATE TABLE IF NOT EXISTS `shortlists` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('normal','scouting','virtual_team') DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=93 ;

-- --------------------------------------------------------

--
-- Table structure for table `shortlist_players`
--

CREATE TABLE IF NOT EXISTS `shortlist_players` (
`id` bigint(20) unsigned NOT NULL,
  `shortlist_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `team_position` enum('playmaker','wing','big','shooting_guard','power_forward','center') DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1031 ;

-- --------------------------------------------------------

--
-- Table structure for table `skillcorner_json`
--

CREATE TABLE IF NOT EXISTS `skillcorner_json` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `mapping_game_id` bigint(20) unsigned NOT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'completed',
  `error` text DEFAULT NULL,
  `json` mediumtext NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=625 ;

-- --------------------------------------------------------

--
-- Table structure for table `social_connection`
--

CREATE TABLE IF NOT EXISTS `social_connection` (
`id` bigint(20) unsigned NOT NULL,
  `handler_id1` bigint(20) unsigned NOT NULL,
  `handler_id2` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=3637 ;

-- --------------------------------------------------------

--
-- Table structure for table `social_options`
--

CREATE TABLE IF NOT EXISTS `social_options` (
`id` bigint(20) unsigned NOT NULL,
  `option_group` varchar(255) NOT NULL,
  `option_subgroup` varchar(255) DEFAULT NULL,
  `option_name` varchar(255) NOT NULL,
  `option_operator` varchar(255) DEFAULT NULL,
  `option_value` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=45 ;

-- --------------------------------------------------------

--
-- Table structure for table `social_pages`
--

CREATE TABLE IF NOT EXISTS `social_pages` (
`id` bigint(20) unsigned NOT NULL,
  `handler` varchar(64) NOT NULL,
  `follower` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=3659 ;

-- --------------------------------------------------------

--
-- Table structure for table `social_types`
--

CREATE TABLE IF NOT EXISTS `social_types` (
`id` bigint(20) unsigned NOT NULL,
  `key` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `priority` int(10) unsigned NOT NULL DEFAULT 50,
  `multiplier` decimal(5,2) NOT NULL DEFAULT 1.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=159 ;

-- --------------------------------------------------------

--
-- Table structure for table `sports`
--

CREATE TABLE IF NOT EXISTS `sports` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=75 ;

-- --------------------------------------------------------

--
-- Table structure for table `standings`
--

CREATE TABLE IF NOT EXISTS `standings` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_phase_group_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `position` int(11) NOT NULL,
  `games` int(11) NOT NULL,
  `win` int(11) NOT NULL,
  `loss` int(11) NOT NULL,
  `scored` int(11) NOT NULL,
  `against` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `percentage` int(11) NOT NULL,
  `point_percent` int(11) NOT NULL,
  `throw_difference` int(11) NOT NULL,
  `penalty_win` int(11) NOT NULL,
  `streak` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=104605 ;

-- --------------------------------------------------------

--
-- Table structure for table `standings_penalties`
--

CREATE TABLE IF NOT EXISTS `standings_penalties` (
`id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_phase_group_id` bigint(20) unsigned DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=17 ;

-- --------------------------------------------------------

--
-- Table structure for table `statbuilt_led_live_page`
--

CREATE TABLE IF NOT EXISTS `statbuilt_led_live_page` (
  `id` int(11) NOT NULL,
  `current_url` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `statbuilt_referrer_visit`
--

CREATE TABLE IF NOT EXISTS `statbuilt_referrer_visit` (
`id` bigint(20) unsigned NOT NULL,
  `referrer_user_id` bigint(20) unsigned DEFAULT NULL,
  `vistor_ip` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=103 ;

-- --------------------------------------------------------

--
-- Table structure for table `statbuilt_saved_styles`
--

CREATE TABLE IF NOT EXISTS `statbuilt_saved_styles` (
`id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `template_code` varchar(50) NOT NULL,
  `style_name` varchar(255) NOT NULL,
  `canvas_data` longtext NOT NULL,
  `is_global` tinyint(1) NOT NULL DEFAULT 0,
  `style_name_global` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=47 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_career_lineups`
--

CREATE TABLE IF NOT EXISTS `stat_career_lineups` (
`id` bigint(20) unsigned NOT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` mediumint(8) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` mediumint(8) unsigned DEFAULT NULL,
  `fg_all` mediumint(8) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(8) unsigned DEFAULT NULL,
  `ft_3p` mediumint(8) unsigned DEFAULT NULL,
  `seconds` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` mediumint(8) unsigned DEFAULT NULL,
  `steal` mediumint(8) unsigned DEFAULT NULL,
  `block` mediumint(8) unsigned DEFAULT NULL,
  `personal_foul` mediumint(8) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(8) DEFAULT NULL,
  `poss_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(8) unsigned DEFAULT NULL,
  `kills` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_career_players`
--

CREATE TABLE IF NOT EXISTS `stat_career_players` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played` mediumint(6) DEFAULT NULL,
  `starter` mediumint(6) unsigned DEFAULT NULL,
  `minute` mediumint(6) unsigned DEFAULT NULL,
  `seconds` int(10) unsigned DEFAULT NULL,
  `minute_bs` mediumint(6) unsigned DEFAULT NULL,
  `poss` mediumint(6) unsigned DEFAULT NULL,
  `pace` decimal(20,6) unsigned DEFAULT NULL,
  `usg_per` decimal(20,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(20,6) unsigned DEFAULT NULL,
  `pts` mediumint(6) unsigned DEFAULT NULL,
  `pts_bs` mediumint(6) unsigned DEFAULT NULL,
  `exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `freq` decimal(20,6) unsigned DEFAULT NULL,
  `ppp` decimal(20,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(6) unsigned DEFAULT NULL,
  `pts2_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_per` decimal(20,6) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(20,6) DEFAULT NULL,
  `pts2_teammate_made` mediumint(6) unsigned DEFAULT NULL COMMENT '2 pointer made without the player while the player is on the court.',
  `pts3_made` mediumint(6) unsigned DEFAULT NULL,
  `pts3_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_per` decimal(20,6) unsigned DEFAULT NULL,
  `pts3_per_bs` decimal(20,6) DEFAULT NULL,
  `pts3_teammate_made` mediumint(6) unsigned DEFAULT NULL COMMENT '3 pointer made without the player while the player is on the court.',
  `ft_made` mediumint(6) unsigned DEFAULT NULL,
  `ft_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_all` mediumint(6) unsigned DEFAULT NULL,
  `ft_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_per` decimal(20,6) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(20,6) DEFAULT NULL,
  `ft_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(20,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(20,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(6) unsigned DEFAULT NULL,
  `ft_3p` mediumint(6) unsigned DEFAULT NULL,
  `fta_per_40` decimal(20,6) unsigned DEFAULT NULL,
  `fg_made` mediumint(6) unsigned DEFAULT NULL,
  `fg_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_all` mediumint(6) unsigned DEFAULT NULL,
  `fg_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_per` decimal(20,6) unsigned DEFAULT NULL,
  `fg_per_bs` decimal(20,6) DEFAULT NULL,
  `efg_per` decimal(20,6) unsigned DEFAULT NULL,
  `ts_per` decimal(20,6) unsigned DEFAULT NULL,
  `rim_made` mediumint(6) unsigned DEFAULT NULL,
  `rim_all` mediumint(6) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(6) unsigned DEFAULT NULL,
  `rim_freq` decimal(20,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(6) unsigned DEFAULT NULL,
  `paint_all` mediumint(6) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(6) unsigned DEFAULT NULL,
  `paint_freq` decimal(20,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(6) unsigned DEFAULT NULL,
  `np2_all` mediumint(6) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(6) unsigned DEFAULT NULL,
  `np2_freq` decimal(20,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(6) unsigned DEFAULT NULL,
  `c3_all` mediumint(6) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(6) unsigned DEFAULT NULL,
  `c3_freq` decimal(20,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(6) unsigned DEFAULT NULL,
  `l3_all` mediumint(6) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(6) unsigned DEFAULT NULL,
  `l3_freq` decimal(20,6) unsigned DEFAULT NULL,
  `poss_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(20,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(20,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `morey_freq` decimal(20,6) unsigned DEFAULT NULL,
  `morey_per` decimal(20,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(20,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(20,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(20,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_chance` mediumint(6) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court.',
  `offensive_rebound_teammate` mediumint(6) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court without the player''s rebounds.',
  `defensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(20,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_chance` mediumint(6) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court.',
  `defensive_rebound_teammate` mediumint(6) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court without the player''s rebounds.',
  `assist` mediumint(6) unsigned DEFAULT NULL,
  `assist_bs` mediumint(6) unsigned DEFAULT NULL,
  `assist_per` decimal(20,6) DEFAULT NULL,
  `turnover` mediumint(6) unsigned DEFAULT NULL,
  `turnover_bs` mediumint(6) unsigned DEFAULT NULL,
  `turnover_per` decimal(20,6) unsigned DEFAULT NULL,
  `steal` mediumint(6) unsigned DEFAULT NULL,
  `steal_bs` mediumint(6) unsigned DEFAULT NULL,
  `block` mediumint(6) unsigned DEFAULT NULL,
  `block_bs` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul_bs` mediumint(6) unsigned DEFAULT NULL,
  `plusminus_bs` mediumint(6) DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `game_played_bs` mediumint(8) unsigned DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=55504631 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_leagues`
--

CREATE TABLE IF NOT EXISTS `stat_competition_leagues` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played` mediumint(6) DEFAULT NULL,
  `starter` mediumint(6) unsigned DEFAULT NULL,
  `minute` mediumint(6) unsigned DEFAULT NULL,
  `seconds` int(10) unsigned DEFAULT NULL,
  `minute_bs` mediumint(6) unsigned DEFAULT NULL,
  `poss` mediumint(6) unsigned DEFAULT NULL,
  `pace` decimal(20,6) unsigned DEFAULT NULL,
  `usg_per` decimal(20,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(20,6) unsigned DEFAULT NULL,
  `pts` mediumint(6) unsigned DEFAULT NULL,
  `pts_bs` mediumint(6) unsigned DEFAULT NULL,
  `exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `freq` decimal(20,6) unsigned DEFAULT NULL,
  `ppp` decimal(20,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(6) unsigned DEFAULT NULL,
  `pts2_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_per` decimal(20,6) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(20,6) DEFAULT NULL,
  `pts2_teammate_made` mediumint(6) unsigned DEFAULT NULL COMMENT '2 pointer made without the player while the player is on the court.',
  `pts3_made` mediumint(6) unsigned DEFAULT NULL,
  `pts3_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_per` decimal(20,6) unsigned DEFAULT NULL,
  `pts3_per_bs` decimal(20,6) DEFAULT NULL,
  `pts3_teammate_made` mediumint(6) unsigned DEFAULT NULL COMMENT '3 pointer made without the player while the player is on the court.',
  `ft_made` mediumint(6) unsigned DEFAULT NULL,
  `ft_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_all` mediumint(6) unsigned DEFAULT NULL,
  `ft_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_per` decimal(20,6) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(20,6) DEFAULT NULL,
  `ft_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(20,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(20,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(6) unsigned DEFAULT NULL,
  `ft_3p` mediumint(6) unsigned DEFAULT NULL,
  `fta_per_40` decimal(20,6) unsigned DEFAULT NULL,
  `fg_made` mediumint(6) unsigned DEFAULT NULL,
  `fg_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_all` mediumint(6) unsigned DEFAULT NULL,
  `fg_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_per` decimal(20,6) unsigned DEFAULT NULL,
  `fg_per_bs` decimal(20,6) DEFAULT NULL,
  `efg_per` decimal(20,6) unsigned DEFAULT NULL,
  `ts_per` decimal(20,6) unsigned DEFAULT NULL,
  `rim_made` mediumint(6) unsigned DEFAULT NULL,
  `rim_all` mediumint(6) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(6) unsigned DEFAULT NULL,
  `rim_freq` decimal(20,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(6) unsigned DEFAULT NULL,
  `paint_all` mediumint(6) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(6) unsigned DEFAULT NULL,
  `paint_freq` decimal(20,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(6) unsigned DEFAULT NULL,
  `np2_all` mediumint(6) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(6) unsigned DEFAULT NULL,
  `np2_freq` decimal(20,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(6) unsigned DEFAULT NULL,
  `c3_all` mediumint(6) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(6) unsigned DEFAULT NULL,
  `c3_freq` decimal(20,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(6) unsigned DEFAULT NULL,
  `l3_all` mediumint(6) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(6) unsigned DEFAULT NULL,
  `l3_freq` decimal(20,6) unsigned DEFAULT NULL,
  `poss_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(20,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(20,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(20,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `morey_freq` decimal(20,6) unsigned DEFAULT NULL,
  `morey_per` decimal(20,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(20,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(20,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(20,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_chance` mediumint(6) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court.',
  `offensive_rebound_teammate` mediumint(6) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court without the player''s rebounds.',
  `defensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(20,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_chance` mediumint(6) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court.',
  `defensive_rebound_teammate` mediumint(6) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court without the player''s rebounds.',
  `assist` mediumint(6) unsigned DEFAULT NULL,
  `assist_bs` mediumint(6) unsigned DEFAULT NULL,
  `assist_per` decimal(20,6) DEFAULT NULL,
  `turnover` mediumint(6) unsigned DEFAULT NULL,
  `turnover_bs` mediumint(6) unsigned DEFAULT NULL,
  `turnover_per` decimal(20,6) unsigned DEFAULT NULL,
  `steal` mediumint(6) unsigned DEFAULT NULL,
  `steal_bs` mediumint(6) unsigned DEFAULT NULL,
  `block` mediumint(6) unsigned DEFAULT NULL,
  `block_bs` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul_bs` mediumint(6) unsigned DEFAULT NULL,
  `plusminus_bs` mediumint(6) DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `game_played_bs` mediumint(8) unsigned DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=213575 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_lineups`
--

CREATE TABLE IF NOT EXISTS `stat_competition_lineups` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` mediumint(8) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` mediumint(8) unsigned DEFAULT NULL,
  `fg_all` mediumint(8) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(8) unsigned DEFAULT NULL,
  `ft_3p` mediumint(8) unsigned DEFAULT NULL,
  `seconds` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` mediumint(8) unsigned DEFAULT NULL,
  `steal` mediumint(8) unsigned DEFAULT NULL,
  `block` mediumint(8) unsigned DEFAULT NULL,
  `personal_foul` mediumint(8) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `pts_opp` smallint(5) unsigned DEFAULT NULL COMMENT 'Opponent points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(8) DEFAULT NULL,
  `poss_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(8) unsigned DEFAULT NULL,
  `poss_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Opponent possession',
  `kills` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=67900073 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_lineup_opponents`
--

CREATE TABLE IF NOT EXISTS `stat_competition_lineup_opponents` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` mediumint(8) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` mediumint(8) unsigned DEFAULT NULL,
  `fg_all` mediumint(8) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(8) unsigned DEFAULT NULL,
  `ft_3p` mediumint(8) unsigned DEFAULT NULL,
  `seconds` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` mediumint(8) unsigned DEFAULT NULL,
  `steal` mediumint(8) unsigned DEFAULT NULL,
  `block` mediumint(8) unsigned DEFAULT NULL,
  `personal_foul` mediumint(8) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `pts_opp` smallint(5) unsigned DEFAULT NULL COMMENT 'Opponent points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(8) DEFAULT NULL,
  `poss_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(8) unsigned DEFAULT NULL,
  `poss_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Opponent possession',
  `kills` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=67672869 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_lineup_opponents_2`
--

CREATE TABLE IF NOT EXISTS `stat_competition_lineup_opponents_2` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` mediumint(8) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` mediumint(8) unsigned DEFAULT NULL,
  `fg_all` mediumint(8) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(8) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(8) unsigned DEFAULT NULL,
  `ft_3p` mediumint(8) unsigned DEFAULT NULL,
  `seconds` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` mediumint(8) unsigned DEFAULT NULL,
  `steal` mediumint(8) unsigned DEFAULT NULL,
  `block` mediumint(8) unsigned DEFAULT NULL,
  `personal_foul` mediumint(8) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `pts_opp` smallint(5) unsigned DEFAULT NULL COMMENT 'Opponent points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(8) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(8) DEFAULT NULL,
  `poss_fg_made` mediumint(8) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(8) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(8) unsigned DEFAULT NULL,
  `poss_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Opponent possession',
  `kills` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=87635708 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_opponents`
--

CREATE TABLE IF NOT EXISTS `stat_competition_opponents` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played` mediumint(6) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL,
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` mediumint(6) unsigned DEFAULT NULL,
  `fg_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_all` mediumint(6) unsigned DEFAULT NULL,
  `fg_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `fg_per_bs` decimal(10,6) DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(6) DEFAULT NULL,
  `defensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(6) DEFAULT NULL,
  `turnover` mediumint(6) unsigned DEFAULT NULL,
  `turnover_bs` mediumint(6) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` mediumint(6) unsigned DEFAULT NULL,
  `ft_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_all` mediumint(6) unsigned DEFAULT NULL,
  `ft_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(10,6) DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(6) DEFAULT NULL,
  `ft_3p` mediumint(6) DEFAULT NULL,
  `minute` mediumint(6) unsigned DEFAULT NULL,
  `seconds` int(10) unsigned DEFAULT NULL,
  `minute_bs` mediumint(6) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(6) unsigned DEFAULT NULL,
  `pts2_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(10,6) DEFAULT NULL,
  `pts3_made` mediumint(6) unsigned DEFAULT NULL,
  `pts3_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_per_bs` decimal(10,6) DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` mediumint(6) unsigned DEFAULT NULL,
  `assist_bs` mediumint(6) unsigned DEFAULT NULL,
  `assist_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` mediumint(6) unsigned DEFAULT NULL,
  `steal_bs` mediumint(6) unsigned DEFAULT NULL,
  `block` mediumint(6) unsigned DEFAULT NULL,
  `block_bs` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul_bs` mediumint(6) unsigned DEFAULT NULL,
  `plusminus` mediumint(6) DEFAULT NULL,
  `plusminus_bs` mediumint(6) DEFAULT NULL,
  `rim_made` mediumint(6) unsigned DEFAULT NULL,
  `rim_all` mediumint(6) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(6) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(6) unsigned DEFAULT NULL,
  `paint_all` mediumint(6) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(6) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(6) unsigned DEFAULT NULL,
  `np2_all` mediumint(6) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(6) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(6) unsigned DEFAULT NULL,
  `c3_all` mediumint(6) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(6) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(6) unsigned DEFAULT NULL,
  `l3_all` mediumint(6) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(6) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(6) unsigned DEFAULT NULL,
  `pts_bs` mediumint(6) unsigned DEFAULT NULL,
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(6) unsigned DEFAULT NULL,
  `kills` mediumint(6) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `game_played_bs` mediumint(8) unsigned DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=158859 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_players`
--

CREATE TABLE IF NOT EXISTS `stat_competition_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played` mediumint(6) DEFAULT NULL,
  `game_played_bs` mediumint(9) DEFAULT NULL,
  `starter` mediumint(6) unsigned DEFAULT NULL,
  `minute` mediumint(6) unsigned DEFAULT NULL,
  `seconds` int(10) unsigned DEFAULT NULL,
  `minute_bs` mediumint(6) unsigned DEFAULT NULL,
  `poss` mediumint(6) unsigned DEFAULT NULL,
  `poss_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Possessions Opponent',
  `poss_team` mediumint(6) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `usg_per` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL COMMENT 'defensive rating',
  `net_rtg` decimal(10,6) DEFAULT NULL COMMENT 'offensive rating',
  `pts` mediumint(6) unsigned DEFAULT NULL,
  `pts_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Team pts while the player is on the court',
  `pts_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Opponent team pts while player on court.',
  `pts_bs` mediumint(6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(6) unsigned DEFAULT NULL,
  `pts2_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(10,6) DEFAULT NULL,
  `pts2_teammate_made` mediumint(6) unsigned DEFAULT NULL COMMENT '2 pointer made without the player while the player is on the court.',
  `ast_received_p2_pts` mediumint(8) unsigned DEFAULT NULL COMMENT 'succesfull 2pts throws from assist',
  `p2_pts_ast_given` mediumint(8) unsigned DEFAULT NULL COMMENT 'assisted for successfull 2pts throws',
  `pts3_made` mediumint(6) unsigned DEFAULT NULL,
  `pts3_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_per_bs` decimal(10,6) DEFAULT NULL,
  `pts3_teammate_made` mediumint(6) unsigned DEFAULT NULL COMMENT '3 pointer made without the player while the player is on the court.',
  `ast_received_p3_pts` mediumint(8) unsigned DEFAULT NULL COMMENT 'succesfull 3pts throws from assist',
  `p3_pts_ast_given` mediumint(8) unsigned DEFAULT NULL COMMENT 'assisted for successfull 3pts throws',
  `ft_made` mediumint(6) unsigned DEFAULT NULL,
  `ft_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_all` mediumint(6) unsigned DEFAULT NULL,
  `ft_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(10,6) DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(6) unsigned DEFAULT NULL,
  `ft_2p_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'FT-2 Shots Opponent',
  `ft_2p_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'FT-2 Shots while the player is on the court',
  `ft_3p` mediumint(6) unsigned DEFAULT NULL,
  `ft_3p_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'FT-3 Shots Opponent',
  `ft_3p_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'FT-3 Shots while the player is on the court',
  `ft_2p_miss` mediumint(8) unsigned DEFAULT NULL COMMENT 'All free throw missed',
  `ft_2p_miss_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_2p_miss_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ft_3p_miss` mediumint(8) unsigned DEFAULT NULL COMMENT 'All free throw missed',
  `ft_3p_miss_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_3p_miss_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ast_received_ft_pts` mediumint(8) unsigned DEFAULT NULL COMMENT 'succesfull free throws from assist',
  `ft_pts_ast_given` mediumint(8) unsigned DEFAULT NULL COMMENT 'assisted for successfull free throws',
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `fg_made` mediumint(6) unsigned DEFAULT NULL,
  `fg_made_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Field Goals Made Opponent',
  `fg_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_all` mediumint(6) unsigned DEFAULT NULL,
  `fg_all_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Field Goals Attempted Opponent',
  `fg_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `fg_per_opp` decimal(10,6) unsigned DEFAULT NULL,
  `fg_per_bs` decimal(10,6) DEFAULT NULL,
  `fg_made_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Team FGM while the player is on the court',
  `fg_all_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Team FGA while the player is on the court',
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `rim_made` mediumint(6) unsigned DEFAULT NULL,
  `rim_all` mediumint(6) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(6) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(6) unsigned DEFAULT NULL,
  `paint_all` mediumint(6) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(6) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(6) unsigned DEFAULT NULL,
  `np2_all` mediumint(6) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(6) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(6) unsigned DEFAULT NULL,
  `c3_all` mediumint(6) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(6) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(6) unsigned DEFAULT NULL,
  `l3_all` mediumint(6) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(6) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `ows` decimal(10,6) DEFAULT NULL,
  `dws` decimal(10,6) DEFAULT NULL,
  `ws` decimal(10,6) DEFAULT NULL,
  `ws_40m` decimal(10,6) DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_per_chance` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_chance` mediumint(6) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court.',
  `offensive_rebound_teammate` mediumint(6) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court without the player''s rebounds.',
  `defensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_chance` mediumint(6) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court.',
  `defensive_rebound_teammate` mediumint(6) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court without the player''s rebounds.',
  `assist` mediumint(6) unsigned DEFAULT NULL,
  `assist_bs` mediumint(6) unsigned DEFAULT NULL,
  `assist_per` decimal(10,6) DEFAULT NULL,
  `turnover` mediumint(6) unsigned DEFAULT NULL,
  `turnover_opp` mediumint(8) unsigned DEFAULT NULL COMMENT 'Turnover Opponent',
  `turnover_bs` mediumint(6) unsigned DEFAULT NULL,
  `turnover_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Turnover while the player is on the court',
  `to_per` mediumint(6) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` mediumint(6) unsigned DEFAULT NULL,
  `steal_bs` mediumint(6) unsigned DEFAULT NULL,
  `steal_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Steal while the player is on the court',
  `block` mediumint(6) unsigned DEFAULT NULL,
  `block_bs` mediumint(6) unsigned DEFAULT NULL,
  `block_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Block while the player is on the court',
  `personal_foul` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul_bs` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul_chance` mediumint(8) unsigned DEFAULT NULL COMMENT 'Personal Foul while the player is on the court',
  `plusminus_bs` mediumint(6) DEFAULT NULL,
  `kills` mediumint(6) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=5101205 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_player_3x3`
--

CREATE TABLE IF NOT EXISTS `stat_competition_player_3x3` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played_bs` int(10) unsigned NOT NULL,
  `pts1_made_bs` int(10) unsigned DEFAULT NULL,
  `pts1_att_bs` int(10) unsigned DEFAULT NULL,
  `pts1_per_bs` decimal(6,3) unsigned DEFAULT NULL,
  `pts2_made_bs` int(10) unsigned DEFAULT NULL,
  `pts2_att_bs` int(10) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(6,3) unsigned DEFAULT NULL,
  `ft_made_bs` int(10) unsigned DEFAULT NULL,
  `ft_att_bs` int(10) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(6,3) unsigned DEFAULT NULL,
  `key_assist_bs` int(10) unsigned DEFAULT NULL,
  `drive_bs` int(10) unsigned DEFAULT NULL,
  `dunk_bs` int(10) unsigned DEFAULT NULL,
  `block_bs` int(10) unsigned DEFAULT NULL,
  `buzz_beater_bs` int(10) unsigned DEFAULT NULL,
  `orb_bs` int(10) unsigned DEFAULT NULL,
  `drb_bs` int(10) unsigned DEFAULT NULL,
  `trb_bs` int(10) unsigned DEFAULT NULL,
  `turnover_bs` int(10) unsigned DEFAULT NULL,
  `pts_bs` int(10) unsigned DEFAULT NULL,
  `highlight_bs` int(10) unsigned DEFAULT NULL,
  `value_bs` decimal(6,3) unsigned DEFAULT NULL,
  `shoot_efficiency_bs` decimal(6,3) unsigned DEFAULT NULL,
  `jersey` varchar(5) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1565 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_defensive_players`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_defensive_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` smallint(5) unsigned NOT NULL,
  `chance_per` decimal(5,2) DEFAULT NULL,
  `pts` smallint(5) unsigned NOT NULL,
  `pts2` smallint(5) unsigned NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2554921 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_detail_players`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_detail_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(8) unsigned NOT NULL,
  `pts` mediumint(8) unsigned NOT NULL,
  `ppp` decimal(8,2) NOT NULL,
  `freq` decimal(8,6) DEFAULT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `play_type_detail_id` enum('single_covered','defense_commit','including_passes','trap','hard_double') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=648273 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_leagues`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_leagues` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(9) NOT NULL,
  `pts` mediumint(9) NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=17721 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_opponents`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_opponents` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `poss` mediumint(8) NOT NULL,
  `pts` mediumint(8) NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=334283 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_players`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(8) unsigned DEFAULT NULL,
  `chance_per` decimal(5,2) DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL COMMENT 'Pts with free throws',
  `pts2` mediumint(8) unsigned DEFAULT NULL COMMENT 'Pts without free throws',
  `ppp` decimal(10,6) DEFAULT NULL COMMENT 'pts/poss',
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `assist` mediumint(8) unsigned DEFAULT NULL,
  `ast_per` decimal(10,6) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `tov_per_possession` decimal(10,6) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=4264089 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_players_horizontal`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_players_horizontal` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `transition_pts` mediumint(8) unsigned DEFAULT NULL,
  `transition_poss` mediumint(8) unsigned DEFAULT NULL,
  `transition_ppp` decimal(10,6) DEFAULT NULL,
  `transition_chance_per` decimal(5,2) DEFAULT NULL,
  `spot_pts` mediumint(8) unsigned DEFAULT NULL,
  `spot_poss` mediumint(8) unsigned DEFAULT NULL,
  `spot_ppp` decimal(10,6) DEFAULT NULL,
  `spot_chance_per` decimal(5,2) DEFAULT NULL,
  `cut_pts` mediumint(8) unsigned DEFAULT NULL,
  `cut_poss` mediumint(8) unsigned DEFAULT NULL,
  `cut_ppp` decimal(10,6) DEFAULT NULL,
  `cut_chance_per` decimal(5,2) DEFAULT NULL,
  `pnr_handler_pts` mediumint(8) unsigned DEFAULT NULL,
  `pnr_handler_poss` mediumint(8) unsigned DEFAULT NULL,
  `pnr_handler_ppp` decimal(10,6) DEFAULT NULL,
  `pnr_handler_chance_per` decimal(5,2) DEFAULT NULL,
  `misc_pts` mediumint(8) unsigned DEFAULT NULL,
  `misc_poss` mediumint(8) unsigned DEFAULT NULL,
  `misc_ppp` decimal(10,6) DEFAULT NULL,
  `misc_chance_per` decimal(5,2) DEFAULT NULL,
  `offscreen_pts` mediumint(8) unsigned DEFAULT NULL,
  `offscreen_poss` mediumint(8) unsigned DEFAULT NULL,
  `offscreen_ppp` decimal(10,6) DEFAULT NULL,
  `offscreen_chance_per` decimal(5,2) DEFAULT NULL,
  `iso_pts` mediumint(8) unsigned DEFAULT NULL,
  `iso_poss` mediumint(8) unsigned DEFAULT NULL,
  `iso_ppp` decimal(10,6) DEFAULT NULL,
  `iso_chance_per` decimal(5,2) DEFAULT NULL,
  `post_pts` mediumint(8) unsigned DEFAULT NULL,
  `post_poss` mediumint(8) unsigned DEFAULT NULL,
  `post_ppp` decimal(10,6) DEFAULT NULL,
  `post_chance_per` decimal(5,2) DEFAULT NULL,
  `putback_pts` mediumint(8) unsigned DEFAULT NULL,
  `putback_poss` mediumint(8) unsigned DEFAULT NULL,
  `putback_ppp` decimal(10,6) DEFAULT NULL,
  `putback_chance_per` decimal(5,2) DEFAULT NULL,
  `handoff_pts` mediumint(8) unsigned DEFAULT NULL,
  `handoff_poss` mediumint(8) unsigned DEFAULT NULL,
  `handoff_ppp` decimal(10,6) DEFAULT NULL,
  `handoff_chance_per` decimal(5,2) DEFAULT NULL,
  `pnr_roll_pts` mediumint(8) unsigned DEFAULT NULL,
  `pnr_roll_poss` mediumint(8) unsigned DEFAULT NULL,
  `pnr_roll_ppp` decimal(10,6) DEFAULT NULL,
  `pnr_roll_chance_per` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=535105 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_playtype_teams`
--

CREATE TABLE IF NOT EXISTS `stat_competition_playtype_teams` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(9) NOT NULL,
  `pts` mediumint(9) NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=336375 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_teams`
--

CREATE TABLE IF NOT EXISTS `stat_competition_teams` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played` mediumint(6) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL,
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` mediumint(6) unsigned DEFAULT NULL,
  `fg_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_all` mediumint(6) unsigned DEFAULT NULL,
  `fg_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `fg_per_bs` decimal(10,6) DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` mediumint(6) DEFAULT NULL,
  `defensive_rebound` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_bs` mediumint(6) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` mediumint(6) DEFAULT NULL,
  `turnover` mediumint(6) unsigned DEFAULT NULL,
  `turnover_bs` mediumint(6) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` mediumint(6) unsigned DEFAULT NULL,
  `ft_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_all` mediumint(6) unsigned DEFAULT NULL,
  `ft_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(10,6) DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` mediumint(6) DEFAULT NULL,
  `ft_3p` mediumint(6) DEFAULT NULL,
  `minute` mediumint(6) unsigned DEFAULT NULL,
  `seconds` int(10) unsigned DEFAULT NULL,
  `minute_bs` mediumint(6) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` mediumint(6) unsigned DEFAULT NULL,
  `pts2_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all` mediumint(6) unsigned DEFAULT NULL,
  `pts2_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(10,6) DEFAULT NULL,
  `pts3_made` mediumint(6) unsigned DEFAULT NULL,
  `pts3_made_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all` mediumint(6) unsigned DEFAULT NULL,
  `pts3_all_bs` mediumint(6) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_per_bs` decimal(10,6) DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` mediumint(6) unsigned DEFAULT NULL,
  `assist_bs` mediumint(6) unsigned DEFAULT NULL,
  `assist_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` mediumint(6) unsigned DEFAULT NULL,
  `steal_bs` mediumint(6) unsigned DEFAULT NULL,
  `block` mediumint(6) unsigned DEFAULT NULL,
  `block_bs` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul` mediumint(6) unsigned DEFAULT NULL,
  `personal_foul_bs` mediumint(6) unsigned DEFAULT NULL,
  `plusminus_bs` mediumint(6) DEFAULT NULL,
  `rim_made` mediumint(6) unsigned DEFAULT NULL,
  `rim_all` mediumint(6) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` mediumint(6) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` mediumint(6) unsigned DEFAULT NULL,
  `paint_all` mediumint(6) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` mediumint(6) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` mediumint(6) unsigned DEFAULT NULL,
  `np2_all` mediumint(6) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` mediumint(6) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` mediumint(6) unsigned DEFAULT NULL,
  `c3_all` mediumint(6) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` mediumint(6) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` mediumint(6) unsigned DEFAULT NULL,
  `l3_all` mediumint(6) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` mediumint(6) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(6) unsigned DEFAULT NULL,
  `pts_bs` mediumint(6) unsigned DEFAULT NULL,
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `morey_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` mediumint(6) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_made` mediumint(6) unsigned DEFAULT NULL,
  `poss_fg_all` mediumint(6) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` mediumint(6) unsigned DEFAULT NULL,
  `kills` mediumint(6) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `game_played_bs` mediumint(8) unsigned DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=207127 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_team_3x3`
--

CREATE TABLE IF NOT EXISTS `stat_competition_team_3x3` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `game_played_bs` int(10) unsigned NOT NULL,
  `pts1_made_bs` int(10) unsigned DEFAULT NULL,
  `pts1_att_bs` int(10) unsigned DEFAULT NULL,
  `pts1_per_bs` decimal(6,3) unsigned DEFAULT NULL,
  `pts2_made_bs` int(10) unsigned DEFAULT NULL,
  `pts2_att_bs` int(10) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(6,3) unsigned DEFAULT NULL,
  `ft_made_bs` int(10) unsigned DEFAULT NULL,
  `ft_att_bs` int(10) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(6,3) unsigned DEFAULT NULL,
  `key_assist_bs` int(10) unsigned DEFAULT NULL,
  `drive_bs` int(10) unsigned DEFAULT NULL,
  `dunk_bs` int(10) unsigned DEFAULT NULL,
  `block_bs` int(10) unsigned DEFAULT NULL,
  `buzz_beater_bs` int(10) unsigned DEFAULT NULL,
  `orb_bs` int(10) unsigned DEFAULT NULL,
  `drb_bs` int(10) unsigned DEFAULT NULL,
  `trb_bs` int(10) unsigned DEFAULT NULL,
  `turnover_bs` int(10) unsigned DEFAULT NULL,
  `pts_bs` int(10) unsigned DEFAULT NULL,
  `highlight_bs` int(10) unsigned DEFAULT NULL,
  `value_bs` decimal(6,3) unsigned DEFAULT NULL,
  `shoot_efficiency_bs` decimal(6,3) unsigned DEFAULT NULL,
  `jersey` varchar(5) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=353 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_team_hc_transition`
--

CREATE TABLE IF NOT EXISTS `stat_competition_team_hc_transition` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `halfcourt` mediumint(8) unsigned DEFAULT NULL,
  `halfcourt_ppp` decimal(10,6) unsigned DEFAULT NULL,
  `transition` mediumint(8) unsigned DEFAULT NULL,
  `transition_ppp` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(8) unsigned DEFAULT NULL,
  `poss_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `tov_per_possession` decimal(10,6) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_made` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_all` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_pts` mediumint(8) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competition_team_hc_transition_opponent`
--

CREATE TABLE IF NOT EXISTS `stat_competition_team_hc_transition_opponent` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `halfcourt` mediumint(8) unsigned DEFAULT NULL,
  `halfcourt_ppp` decimal(10,6) unsigned DEFAULT NULL,
  `transition` mediumint(8) unsigned DEFAULT NULL,
  `transition_ppp` decimal(10,6) unsigned DEFAULT NULL,
  `poss` mediumint(8) unsigned DEFAULT NULL,
  `poss_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `tov_per_possession` decimal(10,6) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_made` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_all` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_pts` mediumint(8) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_competititon_playtype_defense_players`
--

CREATE TABLE IF NOT EXISTS `stat_competititon_playtype_defense_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `defense_type` enum('Spot Up','P&R Ball Handler','Off Screen','Handoffs','Isolation','Post-Up','Transition','P&R Roll Man','Cut','Offensive Rebounds (Put Backs)','Miscellaneous Plays') DEFAULT NULL,
  `defense_subtype` enum('Including Passes','Defense Commits','Hard Double') NOT NULL,
  `defense` enum('both','man','zone') NOT NULL DEFAULT 'both',
  `shot_clock` enum('all','>4','<=4') NOT NULL DEFAULT 'all',
  `poss` int(11) DEFAULT NULL,
  `time_per` decimal(6,2) DEFAULT NULL,
  `time_per_rank` int(11) DEFAULT NULL,
  `pts` int(11) DEFAULT NULL,
  `ppp` decimal(6,3) DEFAULT NULL,
  `ppp_rank` int(11) DEFAULT NULL,
  `ppp_rating` decimal(6,2) DEFAULT NULL,
  `fg_all` int(11) DEFAULT NULL,
  `fg_made` int(11) DEFAULT NULL,
  `fg_per` decimal(6,2) DEFAULT NULL,
  `efg_per` decimal(6,2) DEFAULT NULL,
  `ssq` decimal(6,2) DEFAULT NULL,
  `pps` decimal(6,2) DEFAULT NULL,
  `ssm` decimal(6,2) DEFAULT NULL,
  `ts_per` decimal(6,2) DEFAULT NULL,
  `tsa` int(11) DEFAULT NULL,
  `to_per` decimal(6,2) DEFAULT NULL,
  `ft_per` decimal(6,2) DEFAULT NULL,
  `fta_per_fga` decimal(6,2) DEFAULT NULL,
  `sf_per` decimal(6,2) DEFAULT NULL,
  `score_per` decimal(6,2) DEFAULT NULL,
  `fg_2_all` int(11) DEFAULT NULL,
  `fg_2_made` int(11) DEFAULT NULL,
  `fg_2_per` decimal(6,2) DEFAULT NULL,
  `fg_3_all` int(11) DEFAULT NULL,
  `fg_3_made` int(11) DEFAULT NULL,
  `fg_3_per` decimal(6,2) DEFAULT NULL,
  `fg_3a_per_fga` decimal(6,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=128877 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_drive_competition_opponents`
--

CREATE TABLE IF NOT EXISTS `stat_drive_competition_opponents` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `direction` enum('left','right','straight') NOT NULL,
  `chances` int(10) unsigned NOT NULL,
  `pts` int(10) unsigned NOT NULL,
  `ppc` decimal(10,6) unsigned NOT NULL,
  `delivered_pts` int(10) unsigned NOT NULL,
  `delivered_chances` int(10) unsigned NOT NULL,
  `undelivered_pts` int(10) unsigned NOT NULL,
  `undelivered_chances` int(10) unsigned NOT NULL,
  `assists` int(10) unsigned NOT NULL,
  `deliveries` int(10) unsigned NOT NULL,
  `turnovers` int(10) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2275 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_drive_competition_players`
--

CREATE TABLE IF NOT EXISTS `stat_drive_competition_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `direction` enum('left','right','straight') NOT NULL,
  `chances` int(10) unsigned NOT NULL,
  `pts` int(10) unsigned NOT NULL,
  `ppc` decimal(10,6) unsigned NOT NULL,
  `delivered_pts` int(10) unsigned NOT NULL,
  `delivered_chances` int(10) unsigned NOT NULL,
  `undelivered_pts` int(10) unsigned NOT NULL,
  `undelivered_chances` int(10) unsigned NOT NULL,
  `assists` int(10) unsigned NOT NULL,
  `deliveries` int(10) unsigned NOT NULL,
  `turnovers` int(10) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=40329 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_drive_competition_teams`
--

CREATE TABLE IF NOT EXISTS `stat_drive_competition_teams` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `direction` enum('left','right','straight') NOT NULL,
  `chances` int(10) unsigned NOT NULL,
  `pts` int(10) unsigned NOT NULL,
  `ppc` decimal(10,6) unsigned NOT NULL,
  `delivered_pts` int(10) unsigned NOT NULL,
  `delivered_chances` int(10) unsigned NOT NULL,
  `undelivered_pts` int(10) unsigned NOT NULL,
  `undelivered_chances` int(10) unsigned NOT NULL,
  `assists` int(10) unsigned NOT NULL,
  `deliveries` int(10) unsigned NOT NULL,
  `turnovers` int(10) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2779 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_drive_game_players`
--

CREATE TABLE IF NOT EXISTS `stat_drive_game_players` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `direction` enum('left','right','straight') NOT NULL,
  `chances` smallint(5) unsigned NOT NULL,
  `pts` smallint(5) unsigned NOT NULL,
  `ppc` decimal(10,6) unsigned NOT NULL,
  `delivered_pts` smallint(5) unsigned NOT NULL,
  `delivered_chances` smallint(5) unsigned NOT NULL,
  `undelivered_pts` smallint(5) unsigned NOT NULL,
  `undelivered_chances` smallint(5) unsigned NOT NULL,
  `assists` smallint(5) unsigned NOT NULL,
  `deliveries` smallint(5) unsigned NOT NULL,
  `turnovers` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=90235 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_drive_game_teams`
--

CREATE TABLE IF NOT EXISTS `stat_drive_game_teams` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `direction` enum('left','right','straight') NOT NULL,
  `chances` smallint(5) unsigned NOT NULL,
  `pts` smallint(5) unsigned NOT NULL,
  `ppc` decimal(10,6) unsigned NOT NULL,
  `delivered_pts` smallint(5) unsigned NOT NULL,
  `delivered_chances` smallint(5) unsigned NOT NULL,
  `undelivered_pts` smallint(5) unsigned NOT NULL,
  `undelivered_chances` smallint(5) unsigned NOT NULL,
  `assists` smallint(5) unsigned NOT NULL,
  `deliveries` smallint(5) unsigned NOT NULL,
  `turnovers` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=35793 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_lineups`
--

CREATE TABLE IF NOT EXISTS `stat_game_lineups` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(3) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` smallint(5) unsigned DEFAULT NULL,
  `fg_all` smallint(5) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `turnover` smallint(5) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` smallint(5) unsigned DEFAULT NULL,
  `ft_all` smallint(5) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL,
  `ft_3p` tinyint(3) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` smallint(5) unsigned DEFAULT NULL,
  `pts2_all` smallint(5) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` smallint(5) unsigned DEFAULT NULL,
  `steal` smallint(5) unsigned DEFAULT NULL,
  `block` smallint(5) unsigned DEFAULT NULL,
  `personal_foul` smallint(5) unsigned DEFAULT NULL,
  `rim_made` smallint(5) unsigned DEFAULT NULL,
  `rim_all` smallint(5) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` smallint(5) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` smallint(5) unsigned DEFAULT NULL,
  `paint_all` smallint(5) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` smallint(5) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` smallint(5) unsigned DEFAULT NULL,
  `np2_all` smallint(5) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` smallint(5) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` smallint(5) unsigned DEFAULT NULL,
  `c3_all` smallint(5) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` smallint(5) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` smallint(5) unsigned DEFAULT NULL,
  `l3_all` smallint(5) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` smallint(5) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` smallint(5) unsigned DEFAULT NULL,
  `pts_opp` smallint(5) unsigned DEFAULT NULL COMMENT 'Opponent points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `non_morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` smallint(5) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` smallint(5) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` smallint(4) DEFAULT NULL,
  `poss_fg_made` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_all` smallint(5) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` smallint(5) unsigned DEFAULT NULL,
  `poss_opp` smallint(3) DEFAULT NULL COMMENT 'Opponent possession',
  `kills` tinyint(4) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=13098593 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_lineups_gt`
--

CREATE TABLE IF NOT EXISTS `stat_game_lineups_gt` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(3) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` smallint(5) unsigned DEFAULT NULL,
  `fg_all` smallint(5) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `turnover` smallint(5) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` smallint(5) unsigned DEFAULT NULL,
  `ft_all` smallint(5) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL,
  `ft_3p` tinyint(3) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` smallint(5) unsigned DEFAULT NULL,
  `pts2_all` smallint(5) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` smallint(5) unsigned DEFAULT NULL,
  `steal` smallint(5) unsigned DEFAULT NULL,
  `block` smallint(5) unsigned DEFAULT NULL,
  `personal_foul` smallint(5) unsigned DEFAULT NULL,
  `rim_made` smallint(5) unsigned DEFAULT NULL,
  `rim_all` smallint(5) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` smallint(5) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` smallint(5) unsigned DEFAULT NULL,
  `paint_all` smallint(5) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` smallint(5) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` smallint(5) unsigned DEFAULT NULL,
  `np2_all` smallint(5) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` smallint(5) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` smallint(5) unsigned DEFAULT NULL,
  `c3_all` smallint(5) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` smallint(5) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` smallint(5) unsigned DEFAULT NULL,
  `l3_all` smallint(5) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` smallint(5) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` smallint(5) unsigned DEFAULT NULL,
  `pts_opp` smallint(5) unsigned DEFAULT NULL COMMENT 'Opponent points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `non_morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` smallint(5) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` smallint(5) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` smallint(6) DEFAULT NULL,
  `poss_fg_made` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_all` smallint(5) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` smallint(5) unsigned DEFAULT NULL,
  `poss_opp` smallint(6) DEFAULT NULL COMMENT 'Opponent possession',
  `kills` tinyint(3) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3107795 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_lineup_opponents`
--

CREATE TABLE IF NOT EXISTS `stat_game_lineup_opponents` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `player_id1` bigint(20) unsigned DEFAULT NULL,
  `player_id2` bigint(20) unsigned DEFAULT NULL,
  `player_id3` bigint(20) unsigned DEFAULT NULL,
  `player_id4` bigint(20) unsigned DEFAULT NULL,
  `player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(3) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` smallint(5) unsigned DEFAULT NULL,
  `fg_all` smallint(5) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `turnover` smallint(5) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` smallint(5) unsigned DEFAULT NULL,
  `ft_all` smallint(5) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL,
  `ft_3p` tinyint(3) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` smallint(5) unsigned DEFAULT NULL,
  `pts2_all` smallint(5) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` smallint(5) unsigned DEFAULT NULL,
  `steal` smallint(5) unsigned DEFAULT NULL,
  `block` smallint(5) unsigned DEFAULT NULL,
  `personal_foul` smallint(5) unsigned DEFAULT NULL,
  `rim_made` smallint(5) unsigned DEFAULT NULL,
  `rim_all` smallint(5) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` smallint(5) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` smallint(5) unsigned DEFAULT NULL,
  `paint_all` smallint(5) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` smallint(5) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` smallint(5) unsigned DEFAULT NULL,
  `np2_all` smallint(5) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` smallint(5) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` smallint(5) unsigned DEFAULT NULL,
  `c3_all` smallint(5) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` smallint(5) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` smallint(5) unsigned DEFAULT NULL,
  `l3_all` smallint(5) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` smallint(5) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` smallint(5) unsigned DEFAULT NULL,
  `pts_opp` smallint(5) unsigned DEFAULT NULL COMMENT 'Opponent points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `non_morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` smallint(5) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` smallint(5) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` smallint(4) DEFAULT NULL,
  `poss_fg_made` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_all` smallint(5) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` smallint(5) unsigned DEFAULT NULL,
  `poss_opp` smallint(3) DEFAULT NULL COMMENT 'Opponent possession',
  `kills` tinyint(4) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=13095641 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_players`
--

CREATE TABLE IF NOT EXISTS `stat_game_players` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(4) unsigned DEFAULT NULL,
  `minute` tinyint(4) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `minute_bs` tinyint(3) unsigned DEFAULT NULL,
  `poss` tinyint(4) unsigned DEFAULT NULL,
  `poss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Possessions Opponent',
  `poss_team` tinyint(3) unsigned DEFAULT NULL COMMENT 'A team possessions while player is on the floor.',
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `usg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Usage Percentage',
  `off_rtg` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `pts` tinyint(3) unsigned NOT NULL DEFAULT 0 COMMENT 'Points',
  `pts_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team pts while the player is on the court',
  `pts_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Opponent team pts while player on court.',
  `pts_bs` tinyint(3) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Points per Possession',
  `pts2_made` tinyint(4) unsigned DEFAULT NULL COMMENT '2Pt FGM',
  `pts2_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts2_all` tinyint(4) unsigned DEFAULT NULL COMMENT '2Pt FGA',
  `pts2_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL COMMENT '2Pt FG%',
  `pts2_per_bs` decimal(10,6) DEFAULT NULL,
  `pts2_teammate_made` tinyint(3) unsigned DEFAULT NULL COMMENT '2pt FGM by teammates while the player is on the court.',
  `ast_received_p2_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull 2pts throws from assist',
  `p2_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull 2pts throws',
  `pts3_made` tinyint(4) unsigned DEFAULT NULL COMMENT '3Pt FGM',
  `pts3_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts3_all` tinyint(4) unsigned DEFAULT NULL COMMENT '3Pt FGA',
  `pts3_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL COMMENT '3Pt FG%',
  `pts3_per_bs` decimal(10,6) DEFAULT NULL,
  `pts3_teammate_made` tinyint(3) unsigned DEFAULT NULL COMMENT '3Pt FGM by teammates while the player is on the court.',
  `ast_received_p3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull 3pts throws from assist',
  `p3_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull 3pts throws',
  `ft_made` tinyint(4) unsigned DEFAULT NULL COMMENT 'FTM',
  `ft_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `ft_all` tinyint(4) unsigned DEFAULT NULL COMMENT 'FTA',
  `ft_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FT%',
  `ft_per_bs` decimal(10,6) DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected FT Points',
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots',
  `ft_2p_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots Opponent',
  `ft_2p_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots while the player is on the court',
  `ft_3p` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots',
  `ft_3p_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots Opponent',
  `ft_3p_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots while the player is on the court',
  `ft_2p_miss` tinyint(3) unsigned DEFAULT NULL COMMENT 'all free throw missed',
  `ft_2p_miss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_2p_miss_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ft_3p_miss` tinyint(3) unsigned DEFAULT NULL COMMENT 'all free throw missed',
  `ft_3p_miss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_3p_miss_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ast_received_ft_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull free throws from assist',
  `ft_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull free throws',
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FTA per 40 minutes',
  `fg_made` tinyint(4) unsigned DEFAULT NULL COMMENT 'FGM',
  `fg_made_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Field Goals Made Opponent',
  `fg_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `fg_all` tinyint(4) unsigned DEFAULT NULL COMMENT 'FGA',
  `fg_all_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Field Goals Attempted Opponent',
  `fg_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FG%',
  `fg_per_opp` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Field Goal Percentage Opponent',
  `fg_per_bs` decimal(10,6) DEFAULT NULL,
  `fg_made_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team FGM while the player is on the court',
  `fg_all_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team FGA while the player is on the court',
  `efg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Efficient FG%',
  `ts_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'True Shooting %',
  `rim_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - at the Rim',
  `rim_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - at the Rim',
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - at the Rim',
  `rim_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points at the Rim',
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - in the Paint',
  `paint_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - in the Paint',
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - in the Paint',
  `paint_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points in the Paint',
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Outside the Paint 2s',
  `np2_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Outside the Paint 2s',
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Outside the Paint 2s',
  `np2_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Outside the Paint 2s',
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Corner 3s',
  `c3_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Corner 3s',
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Corner 3s',
  `c3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Corner 3s',
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Non-Corner 3s',
  `l3_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Non-Corner 3s',
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Non-Corner 3s',
  `l3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Non-Corner 3s',
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `around_basket_made` smallint(5) unsigned DEFAULT NULL,
  `around_basket_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_made` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_all` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_made` int(10) unsigned DEFAULT NULL COMMENT 'FGM - when Player had Possession',
  `poss_fg_all` int(10) unsigned DEFAULT NULL COMMENT 'FGA - when Player had Possession',
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - when Player had Possession',
  `poss_pts` int(10) unsigned DEFAULT NULL COMMENT 'Points when Player had Possession',
  `non_morey_fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Non-Morey (2s not at the Rim)',
  `non_morey_fg_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Non-Morey (2s not at the Rim)',
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Non-Morey (2s not at the Rim)',
  `non_morey_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Non-Morey Shots (2s not at the Rim)',
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Morey (3s, Shots at the Rim)',
  `morey_fg_all` tinyint(3) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` tinyint(3) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` tinyint(4) unsigned DEFAULT NULL,
  `offensive_rebound_bs` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_per_chance` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Offensive Reb. Percentage while the player is on the court',
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court.',
  `offensive_rebound_teammate` tinyint(3) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court without the player''s rebounds.',
  `defensive_rebound` tinyint(4) unsigned DEFAULT NULL,
  `defensive_rebound_bs` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court.',
  `defensive_rebound_teammate` tinyint(3) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court without the player''s rebounds.',
  `assist` tinyint(4) unsigned DEFAULT NULL,
  `assist_bs` tinyint(3) unsigned DEFAULT NULL,
  `ast_per` decimal(10,6) DEFAULT NULL,
  `turnover` tinyint(4) unsigned DEFAULT NULL,
  `turnover_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Turnover Opponent',
  `turnover_bs` tinyint(3) unsigned DEFAULT NULL,
  `turnover_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Turnover while the player is on the court',
  `to_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` tinyint(4) unsigned DEFAULT NULL,
  `steal_bs` tinyint(3) unsigned DEFAULT NULL,
  `steal_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Steal while the player is on the court',
  `block` tinyint(4) unsigned DEFAULT NULL,
  `block_bs` tinyint(3) unsigned DEFAULT NULL,
  `block_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Block while the player is on the court',
  `personal_foul` tinyint(4) unsigned DEFAULT NULL,
  `personal_foul_bs` tinyint(3) unsigned DEFAULT NULL,
  `personal_foul_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Personal Foul while the player is on the court',
  `plusminus_bs` tinyint(3) DEFAULT NULL,
  `kills` tinyint(3) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `val` int(11) NOT NULL DEFAULT 0,
  `jersey` varchar(5) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=20307197 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_players_backup_20250925`
--

CREATE TABLE IF NOT EXISTS `stat_game_players_backup_20250925` (
  `id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(4) unsigned DEFAULT NULL,
  `minute` tinyint(4) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `minute_bs` tinyint(3) unsigned DEFAULT NULL,
  `poss` tinyint(4) unsigned DEFAULT NULL,
  `poss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Possessions Opponent',
  `poss_team` tinyint(3) unsigned DEFAULT NULL COMMENT 'A team possessions while player is on the floor.',
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `usg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Usage Percentage',
  `off_rtg` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `pts` tinyint(3) unsigned NOT NULL DEFAULT 0 COMMENT 'Points',
  `pts_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team pts while the player is on the court',
  `pts_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Opponent team pts while player on court.',
  `pts_bs` tinyint(3) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Points per Possession',
  `pts2_made` tinyint(4) unsigned DEFAULT NULL COMMENT '2Pt FGM',
  `pts2_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts2_all` tinyint(4) unsigned DEFAULT NULL COMMENT '2Pt FGA',
  `pts2_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL COMMENT '2Pt FG%',
  `pts2_per_bs` decimal(10,6) DEFAULT NULL,
  `pts2_teammate_made` tinyint(3) unsigned DEFAULT NULL COMMENT '2pt FGM by teammates while the player is on the court.',
  `ast_received_p2_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull 2pts throws from assist',
  `p2_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull 2pts throws',
  `pts3_made` tinyint(4) unsigned DEFAULT NULL COMMENT '3Pt FGM',
  `pts3_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts3_all` tinyint(4) unsigned DEFAULT NULL COMMENT '3Pt FGA',
  `pts3_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL COMMENT '3Pt FG%',
  `pts3_per_bs` decimal(10,6) DEFAULT NULL,
  `pts3_teammate_made` tinyint(3) unsigned DEFAULT NULL COMMENT '3Pt FGM by teammates while the player is on the court.',
  `ast_received_p3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull 3pts throws from assist',
  `p3_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull 3pts throws',
  `ft_made` tinyint(4) unsigned DEFAULT NULL COMMENT 'FTM',
  `ft_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `ft_all` tinyint(4) unsigned DEFAULT NULL COMMENT 'FTA',
  `ft_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FT%',
  `ft_per_bs` decimal(10,6) DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected FT Points',
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots',
  `ft_2p_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots Opponent',
  `ft_2p_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots while the player is on the court',
  `ft_3p` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots',
  `ft_3p_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots Opponent',
  `ft_3p_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots while the player is on the court',
  `ft_2p_miss` tinyint(3) unsigned DEFAULT NULL COMMENT 'all free throw missed',
  `ft_2p_miss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_2p_miss_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ft_3p_miss` tinyint(3) unsigned DEFAULT NULL COMMENT 'all free throw missed',
  `ft_3p_miss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_3p_miss_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ast_received_ft_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull free throws from assist',
  `ft_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull free throws',
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FTA per 40 minutes',
  `fg_made` tinyint(4) unsigned DEFAULT NULL COMMENT 'FGM',
  `fg_made_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Field Goals Made Opponent',
  `fg_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `fg_all` tinyint(4) unsigned DEFAULT NULL COMMENT 'FGA',
  `fg_all_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Field Goals Attempted Opponent',
  `fg_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FG%',
  `fg_per_opp` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Field Goal Percentage Opponent',
  `fg_per_bs` decimal(10,6) DEFAULT NULL,
  `fg_made_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team FGM while the player is on the court',
  `fg_all_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team FGA while the player is on the court',
  `efg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Efficient FG%',
  `ts_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'True Shooting %',
  `rim_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - at the Rim',
  `rim_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - at the Rim',
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - at the Rim',
  `rim_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points at the Rim',
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - in the Paint',
  `paint_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - in the Paint',
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - in the Paint',
  `paint_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points in the Paint',
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Outside the Paint 2s',
  `np2_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Outside the Paint 2s',
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Outside the Paint 2s',
  `np2_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Outside the Paint 2s',
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Corner 3s',
  `c3_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Corner 3s',
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Corner 3s',
  `c3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Corner 3s',
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Non-Corner 3s',
  `l3_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Non-Corner 3s',
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Non-Corner 3s',
  `l3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Non-Corner 3s',
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `around_basket_made` smallint(5) unsigned DEFAULT NULL,
  `around_basket_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_made` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_all` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_made` int(10) unsigned DEFAULT NULL COMMENT 'FGM - when Player had Possession',
  `poss_fg_all` int(10) unsigned DEFAULT NULL COMMENT 'FGA - when Player had Possession',
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - when Player had Possession',
  `poss_pts` int(10) unsigned DEFAULT NULL COMMENT 'Points when Player had Possession',
  `non_morey_fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Non-Morey (2s not at the Rim)',
  `non_morey_fg_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Non-Morey (2s not at the Rim)',
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Non-Morey (2s not at the Rim)',
  `non_morey_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Non-Morey Shots (2s not at the Rim)',
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Morey (3s, Shots at the Rim)',
  `morey_fg_all` tinyint(3) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` tinyint(3) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` tinyint(4) unsigned DEFAULT NULL,
  `offensive_rebound_bs` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_per_chance` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Offensive Reb. Percentage while the player is on the court',
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court.',
  `offensive_rebound_teammate` tinyint(3) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court without the player''s rebounds.',
  `defensive_rebound` tinyint(4) unsigned DEFAULT NULL,
  `defensive_rebound_bs` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court.',
  `defensive_rebound_teammate` tinyint(3) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court without the player''s rebounds.',
  `assist` tinyint(4) unsigned DEFAULT NULL,
  `assist_bs` tinyint(3) unsigned DEFAULT NULL,
  `ast_per` decimal(10,6) DEFAULT NULL,
  `turnover` tinyint(4) unsigned DEFAULT NULL,
  `turnover_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Turnover Opponent',
  `turnover_bs` tinyint(3) unsigned DEFAULT NULL,
  `turnover_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Turnover while the player is on the court',
  `to_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` tinyint(4) unsigned DEFAULT NULL,
  `steal_bs` tinyint(3) unsigned DEFAULT NULL,
  `steal_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Steal while the player is on the court',
  `block` tinyint(4) unsigned DEFAULT NULL,
  `block_bs` tinyint(3) unsigned DEFAULT NULL,
  `block_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Block while the player is on the court',
  `personal_foul` tinyint(4) unsigned DEFAULT NULL,
  `personal_foul_bs` tinyint(3) unsigned DEFAULT NULL,
  `personal_foul_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Personal Foul while the player is on the court',
  `plusminus_bs` tinyint(3) DEFAULT NULL,
  `kills` tinyint(3) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `val` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_players_gt`
--

CREATE TABLE IF NOT EXISTS `stat_game_players_gt` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `starter` tinyint(3) unsigned DEFAULT NULL,
  `minute` tinyint(3) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `poss` tinyint(3) unsigned DEFAULT NULL,
  `poss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Possessions Opponent',
  `poss_team` tinyint(3) unsigned DEFAULT NULL COMMENT 'A team possessions while player is on the floor.',
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `usg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Usage Percentage',
  `off_rtg` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `pts` tinyint(3) unsigned NOT NULL DEFAULT 0 COMMENT 'Points',
  `pts_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team pts while the player is on the court',
  `pts_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Opponent team pts while player on court.',
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points',
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Points per Possession',
  `pts2_made` tinyint(3) unsigned DEFAULT NULL COMMENT '2Pt FGM',
  `pts2_all` tinyint(3) unsigned DEFAULT NULL COMMENT '2Pt FGA',
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL COMMENT '2Pt FG%',
  `pts2_teammate_made` tinyint(3) unsigned DEFAULT NULL COMMENT '2pt FGM by teammates while the player is on the court.',
  `ast_received_p2_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull 2pts throws from assist',
  `p2_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull 2pts throws',
  `pts3_made` tinyint(3) unsigned DEFAULT NULL COMMENT '3Pt FGM',
  `pts3_all` tinyint(3) unsigned DEFAULT NULL COMMENT '3Pt FGA',
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL COMMENT '3Pt FG%',
  `pts3_teammate_made` tinyint(3) unsigned DEFAULT NULL COMMENT '3Pt FGM by teammates while the player is on the court.',
  `ast_received_p3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull 3pts throws from assist',
  `p3_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull 3pts throws',
  `ft_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FTM',
  `ft_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FTA',
  `ft_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FT%',
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected FT Points',
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots',
  `ft_2p_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots Opponent',
  `ft_2p_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-2 Shots while the player is on the court',
  `ft_3p` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots',
  `ft_3p_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots Opponent',
  `ft_3p_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'FT-3 Shots while the player is on the court',
  `ft_2p_miss` tinyint(3) unsigned DEFAULT NULL COMMENT 'all free throw missed',
  `ft_2p_miss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_2p_miss_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ft_3p_miss` tinyint(3) unsigned DEFAULT NULL COMMENT 'all free throw missed',
  `ft_3p_miss_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed Opponent',
  `ft_3p_miss_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'All Free Throw Missed while the player is on the court',
  `ast_received_ft_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'succesfull free throws from assist',
  `ft_pts_ast_given` tinyint(3) unsigned DEFAULT NULL COMMENT 'assisted for successfull free throws',
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FTA per 40 minutes',
  `fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM',
  `fg_made_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Field Goals Made Opponent',
  `fg_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA',
  `fg_all_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Field Goals Attempted Opponent',
  `fg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'FG%',
  `fg_per_opp` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Field Goal Percentage Opponent',
  `fg_made_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team FGM while the player is on the court',
  `fg_all_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Team FGA while the player is on the court',
  `efg_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Efficient FG%',
  `ts_per` decimal(10,6) unsigned DEFAULT NULL COMMENT 'True Shooting %',
  `rim_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - at the Rim',
  `rim_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - at the Rim',
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - at the Rim',
  `rim_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points at the Rim',
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - in the Paint',
  `paint_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - in the Paint',
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - in the Paint',
  `paint_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points in the Paint',
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Outside the Paint 2s',
  `np2_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Outside the Paint 2s',
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Outside the Paint 2s',
  `np2_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Outside the Paint 2s',
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Corner 3s',
  `c3_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Corner 3s',
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Corner 3s',
  `c3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Corner 3s',
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Non-Corner 3s',
  `l3_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Non-Corner 3s',
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Non-Corner 3s',
  `l3_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Non-Corner 3s',
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `around_basket_made` smallint(5) unsigned DEFAULT NULL,
  `around_basket_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_made` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_all` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_made` int(10) unsigned DEFAULT NULL COMMENT 'FGM - when Player had Possession',
  `poss_fg_all` int(10) unsigned DEFAULT NULL COMMENT 'FGA - when Player had Possession',
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - when Player had Possession',
  `poss_pts` int(10) unsigned DEFAULT NULL COMMENT 'Points when Player had Possession',
  `non_morey_fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Non-Morey (2s not at the Rim)',
  `non_morey_fg_all` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGA - Non-Morey (2s not at the Rim)',
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Expected Points - Non-Morey (2s not at the Rim)',
  `non_morey_pts` tinyint(3) unsigned DEFAULT NULL COMMENT 'Points on Non-Morey Shots (2s not at the Rim)',
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` tinyint(3) unsigned DEFAULT NULL COMMENT 'FGM - Morey (3s, Shots at the Rim)',
  `morey_fg_all` tinyint(3) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` tinyint(3) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_per_chance` decimal(10,6) unsigned DEFAULT NULL COMMENT 'Offensive Reb. Percentage while the player is on the court',
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court.',
  `offensive_rebound_teammate` tinyint(3) unsigned DEFAULT NULL COMMENT 'Offensive team rebounds while the player in on the court without the player''s rebounds.',
  `defensive_rebound` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court.',
  `defensive_rebound_teammate` tinyint(3) unsigned DEFAULT NULL COMMENT 'Defensive team rebounds while the player in on the court without the player''s rebounds.',
  `assist` tinyint(3) unsigned DEFAULT NULL,
  `ast_per` decimal(10,6) DEFAULT NULL,
  `turnover` tinyint(3) unsigned DEFAULT NULL,
  `turnover_opp` tinyint(3) unsigned DEFAULT NULL COMMENT 'Turnover Opponent',
  `turnover_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Turnover while the player is on the court',
  `to_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` tinyint(3) unsigned DEFAULT NULL,
  `steal_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Steal while the player is on the court',
  `block` tinyint(3) unsigned DEFAULT NULL,
  `block_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Block while the player is on the court',
  `personal_foul` tinyint(3) unsigned DEFAULT NULL,
  `personal_foul_chance` tinyint(3) unsigned DEFAULT NULL COMMENT 'Personal Foul while the player is on the court',
  `kills` tinyint(3) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `val` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=28699 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_player_3x3`
--

CREATE TABLE IF NOT EXISTS `stat_game_player_3x3` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `pts1_made_bs` int(10) unsigned DEFAULT NULL,
  `pts1_att_bs` int(10) unsigned DEFAULT NULL,
  `pts1_per_bs` decimal(5,3) unsigned DEFAULT NULL,
  `pts2_made_bs` int(10) unsigned DEFAULT NULL,
  `pts2_att_bs` int(10) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(5,3) unsigned DEFAULT NULL,
  `ft_made_bs` int(10) unsigned DEFAULT NULL,
  `ft_att_bs` int(10) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(5,3) unsigned DEFAULT NULL,
  `key_assist_bs` int(10) unsigned DEFAULT NULL,
  `drive_bs` int(10) unsigned DEFAULT NULL,
  `dunk_bs` int(10) unsigned DEFAULT NULL,
  `block_bs` int(10) unsigned DEFAULT NULL,
  `buzz_beater_bs` int(10) unsigned DEFAULT NULL,
  `orb_bs` int(10) unsigned DEFAULT NULL,
  `drb_bs` int(10) unsigned DEFAULT NULL,
  `trb_bs` int(10) unsigned DEFAULT NULL,
  `turnover_bs` int(10) unsigned DEFAULT NULL,
  `pts_bs` int(10) unsigned DEFAULT NULL,
  `highlight_bs` int(10) unsigned DEFAULT NULL,
  `value_bs` decimal(5,3) unsigned DEFAULT NULL,
  `shoot_efficiency_bs` decimal(5,3) unsigned DEFAULT NULL,
  `jersey` varchar(5) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=7179 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_playtype_defensive_players`
--

CREATE TABLE IF NOT EXISTS `stat_game_playtype_defensive_players` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` smallint(5) NOT NULL,
  `pts` smallint(5) unsigned NOT NULL,
  `pts2` smallint(5) unsigned NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=15630329 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_playtype_players`
--

CREATE TABLE IF NOT EXISTS `stat_game_playtype_players` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` smallint(5) unsigned NOT NULL,
  `pts` smallint(5) unsigned NOT NULL,
  `pts2` smallint(5) unsigned NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `assist` tinyint(3) unsigned DEFAULT NULL,
  `ast_per` decimal(10,6) unsigned DEFAULT NULL,
  `turnover` tinyint(3) unsigned DEFAULT NULL,
  `tov_per_possession` decimal(10,6) unsigned DEFAULT NULL,
  `ft_all` tinyint(3) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=21796047 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_playtype_teams`
--

CREATE TABLE IF NOT EXISTS `stat_game_playtype_teams` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(9) NOT NULL,
  `pts` mediumint(9) NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5893005 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_teams`
--

CREATE TABLE IF NOT EXISTS `stat_game_teams` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `pace` decimal(10,6) unsigned DEFAULT NULL,
  `off_rtg` decimal(10,6) DEFAULT NULL COMMENT 'Offensive Rating',
  `def_rtg` decimal(10,6) unsigned DEFAULT NULL,
  `net_rtg` decimal(10,6) DEFAULT NULL,
  `fg_made` smallint(5) unsigned DEFAULT NULL,
  `fg_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `fg_all` smallint(5) unsigned DEFAULT NULL,
  `fg_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `fg_per` decimal(10,6) unsigned DEFAULT NULL,
  `fg_per_bs` decimal(10,6) DEFAULT NULL,
  `efg_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `offensive_rebound_bs` tinyint(3) unsigned DEFAULT NULL,
  `offensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `offensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound` smallint(5) unsigned DEFAULT NULL,
  `defensive_rebound_bs` tinyint(3) unsigned DEFAULT NULL,
  `defensive_rebound_per` decimal(10,6) unsigned DEFAULT NULL,
  `defensive_rebound_opp` tinyint(3) unsigned DEFAULT NULL,
  `turnover` smallint(5) unsigned DEFAULT NULL,
  `turnover_bs` tinyint(3) unsigned DEFAULT NULL,
  `turnover_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_made` smallint(5) unsigned DEFAULT NULL,
  `ft_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `ft_all` smallint(5) unsigned DEFAULT NULL,
  `ft_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(10,6) DEFAULT NULL,
  `ft_ratio` decimal(10,6) unsigned DEFAULT NULL,
  `ft_2p` tinyint(3) unsigned DEFAULT NULL,
  `ft_3p` tinyint(3) unsigned DEFAULT NULL,
  `minute` smallint(5) unsigned DEFAULT NULL,
  `seconds` smallint(5) unsigned DEFAULT NULL,
  `minute_bs` smallint(5) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_made` smallint(5) unsigned DEFAULT NULL,
  `pts2_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts2_all` smallint(5) unsigned DEFAULT NULL,
  `pts2_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(10,6) DEFAULT NULL,
  `pts3_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_made_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts3_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_all_bs` tinyint(3) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) unsigned DEFAULT NULL,
  `pts3_per_bs` decimal(10,6) DEFAULT NULL,
  `ts_per` decimal(10,6) unsigned DEFAULT NULL,
  `assist` smallint(5) unsigned DEFAULT NULL,
  `assist_bs` tinyint(3) unsigned DEFAULT NULL,
  `assist_per` decimal(10,6) unsigned DEFAULT NULL,
  `steal` smallint(5) unsigned DEFAULT NULL,
  `steal_bs` tinyint(3) unsigned DEFAULT NULL,
  `block` smallint(5) unsigned DEFAULT NULL,
  `block_bs` tinyint(3) unsigned DEFAULT NULL,
  `personal_foul` smallint(5) unsigned DEFAULT NULL,
  `personal_foul_bs` tinyint(3) unsigned DEFAULT NULL,
  `plusminus_bs` smallint(3) DEFAULT NULL,
  `rim_made` smallint(5) unsigned DEFAULT NULL,
  `rim_all` smallint(5) unsigned DEFAULT NULL,
  `rim_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `rim_pts` smallint(5) unsigned DEFAULT NULL,
  `rim_freq` decimal(10,6) unsigned DEFAULT NULL,
  `paint_made` smallint(5) unsigned DEFAULT NULL,
  `paint_all` smallint(5) unsigned DEFAULT NULL,
  `paint_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `paint_pts` smallint(5) unsigned DEFAULT NULL,
  `paint_freq` decimal(10,6) unsigned DEFAULT NULL,
  `np2_made` smallint(5) unsigned DEFAULT NULL,
  `np2_all` smallint(5) unsigned DEFAULT NULL,
  `np2_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `np2_pts` smallint(5) unsigned DEFAULT NULL,
  `np2_freq` decimal(10,6) unsigned DEFAULT NULL,
  `c3_made` smallint(5) unsigned DEFAULT NULL,
  `c3_all` smallint(5) unsigned DEFAULT NULL,
  `c3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `c3_pts` smallint(5) unsigned DEFAULT NULL,
  `c3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `l3_made` smallint(5) unsigned DEFAULT NULL,
  `l3_all` smallint(5) unsigned DEFAULT NULL,
  `l3_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `l3_pts` smallint(5) unsigned DEFAULT NULL,
  `l3_freq` decimal(10,6) unsigned DEFAULT NULL,
  `around_basket_made` smallint(5) unsigned DEFAULT NULL,
  `around_basket_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `mid_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_left_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_center_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_all` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `long_pts2_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_corner_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_left_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_center_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_long_all` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_made` smallint(5) unsigned DEFAULT NULL,
  `pts3_right_corner_all` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_made` smallint(5) unsigned DEFAULT NULL,
  `fullcourt_all` smallint(5) unsigned DEFAULT NULL,
  `exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `pts` smallint(5) unsigned DEFAULT NULL,
  `pts_bs` tinyint(3) unsigned DEFAULT NULL,
  `freq` decimal(10,6) unsigned DEFAULT NULL,
  `ft_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `ft_freq` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `non_morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `non_morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_pts` smallint(5) unsigned DEFAULT NULL,
  `non_morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `morey_fg_made` smallint(5) unsigned DEFAULT NULL,
  `morey_fg_all` smallint(5) unsigned DEFAULT NULL,
  `morey_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `morey_pts` smallint(5) unsigned DEFAULT NULL,
  `morey_freq` decimal(10,6) unsigned DEFAULT NULL,
  `poss` tinyint(4) unsigned DEFAULT NULL,
  `poss_fg_made` smallint(5) unsigned DEFAULT NULL,
  `poss_fg_all` smallint(5) unsigned DEFAULT NULL,
  `poss_exp_pts` decimal(10,6) unsigned DEFAULT NULL,
  `poss_pts` smallint(5) unsigned DEFAULT NULL,
  `kills` tinyint(4) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `morey_per` decimal(10,6) unsigned DEFAULT NULL,
  `morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `exp_pps` decimal(10,6) unsigned DEFAULT NULL,
  `non_morey_attempt_per` decimal(10,6) unsigned DEFAULT NULL,
  `win_lose` enum('win','lose','draw') DEFAULT NULL,
  `side` enum('home','away','neutral') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1519605 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_game_team_3x3`
--

CREATE TABLE IF NOT EXISTS `stat_game_team_3x3` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `competition_opponent_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `pts1_made_bs` int(10) unsigned DEFAULT NULL,
  `pts1_att_bs` int(10) unsigned DEFAULT NULL,
  `pts1_per_bs` decimal(5,3) unsigned DEFAULT NULL,
  `pts2_made_bs` int(10) unsigned DEFAULT NULL,
  `pts2_att_bs` int(10) unsigned DEFAULT NULL,
  `pts2_per_bs` decimal(5,3) unsigned DEFAULT NULL,
  `ft_made_bs` int(10) unsigned DEFAULT NULL,
  `ft_att_bs` int(10) unsigned DEFAULT NULL,
  `ft_per_bs` decimal(5,3) unsigned DEFAULT NULL,
  `key_assist_bs` int(10) unsigned DEFAULT NULL,
  `drive_bs` int(10) unsigned DEFAULT NULL,
  `dunk_bs` int(10) unsigned DEFAULT NULL,
  `block_bs` int(10) unsigned DEFAULT NULL,
  `buzz_beater_bs` int(10) unsigned DEFAULT NULL,
  `orb_bs` int(10) unsigned DEFAULT NULL,
  `drb_bs` int(10) unsigned DEFAULT NULL,
  `trb_bs` int(10) unsigned DEFAULT NULL,
  `turnover_bs` int(10) unsigned DEFAULT NULL,
  `pts_bs` int(10) unsigned DEFAULT NULL,
  `highlight_bs` int(10) unsigned DEFAULT NULL,
  `value_bs` decimal(5,3) unsigned DEFAULT NULL,
  `shoot_efficiency_bs` decimal(5,3) unsigned DEFAULT NULL,
  `jersey` varchar(5) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1805 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_player_vs`
--

CREATE TABLE IF NOT EXISTS `stat_player_vs` (
`id` int(11) NOT NULL,
  `competition_phase_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `opponent_player_id` int(11) NOT NULL,
  `shot_zone` enum('rim','paint','np2','3c','3l','3h','turnover') NOT NULL,
  `made` int(11) NOT NULL,
  `missed` int(11) NOT NULL,
  `turnover` int(11) NOT NULL,
  `source_id` tinyint(4) NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=128971985 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_possession_summary`
--

CREATE TABLE IF NOT EXISTS `stat_possession_summary` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `competition_id` bigint(20) unsigned DEFAULT NULL,
  `competition_phase_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned DEFAULT NULL,
  `home_player_id1` bigint(20) unsigned DEFAULT NULL,
  `home_player_id2` bigint(20) unsigned DEFAULT NULL,
  `home_player_id3` bigint(20) unsigned DEFAULT NULL,
  `home_player_id4` bigint(20) unsigned DEFAULT NULL,
  `home_player_id5` bigint(20) unsigned DEFAULT NULL,
  `away_player_id1` bigint(20) unsigned DEFAULT NULL,
  `away_player_id2` bigint(20) unsigned DEFAULT NULL,
  `away_player_id3` bigint(20) unsigned DEFAULT NULL,
  `away_player_id4` bigint(20) unsigned DEFAULT NULL,
  `away_player_id5` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `possession_id` int(11) NOT NULL,
  `offensive_rebound` mediumint(8) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `steal` mediumint(8) unsigned DEFAULT NULL,
  `fg_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_made` mediumint(8) unsigned DEFAULT NULL,
  `rim_all` mediumint(8) unsigned DEFAULT NULL,
  `rim_pts` mediumint(8) unsigned DEFAULT NULL,
  `paint_made` mediumint(8) unsigned DEFAULT NULL,
  `paint_all` mediumint(8) unsigned DEFAULT NULL,
  `paint_pts` mediumint(8) unsigned DEFAULT NULL,
  `np2_made` mediumint(8) unsigned DEFAULT NULL,
  `np2_all` mediumint(8) unsigned DEFAULT NULL,
  `np2_pts` mediumint(8) unsigned DEFAULT NULL,
  `c3_made` mediumint(8) unsigned DEFAULT NULL,
  `c3_all` mediumint(8) unsigned DEFAULT NULL,
  `c3_pts` mediumint(8) unsigned DEFAULT NULL,
  `l3_made` mediumint(8) unsigned DEFAULT NULL,
  `l3_all` mediumint(8) unsigned DEFAULT NULL,
  `l3_pts` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_made` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_all` mediumint(8) unsigned DEFAULT NULL,
  `fullcourt_pts` mediumint(8) unsigned DEFAULT NULL,
  `start_type` enum('FG_deadball','FGM','FTM','TOV_Live','TOV_deadball','OREB','FG_DREB','TOV_Team','Missed_FT_Live','Missed_FT_Dead','Period_Start','TBD') DEFAULT NULL,
  `end_type` enum('FG_deadball','FGM','FTM','TOV_Live','TOV_deadball','OREB','FG_DREB','TOV_Team','Missed_FT_Live','Missed_FT_Dead','Period_Start','TBD') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_reports`
--

CREATE TABLE IF NOT EXISTS `stat_reports` (
`id` bigint(20) unsigned NOT NULL,
  `type` enum('player','team','competition','game','global','inactive') NOT NULL DEFAULT 'player',
  `name` varchar(255) DEFAULT NULL,
  `from_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=49 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_report_parameters`
--

CREATE TABLE IF NOT EXISTS `stat_report_parameters` (
`id` bigint(20) unsigned NOT NULL,
  `type` enum('static','dynamic') NOT NULL DEFAULT 'static',
  `param_name` varchar(255) NOT NULL,
  `column_name` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=11 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_report_parameter_connections`
--

CREATE TABLE IF NOT EXISTS `stat_report_parameter_connections` (
`id` bigint(20) unsigned NOT NULL,
  `stat_report_id` bigint(20) unsigned NOT NULL,
  `stat_report_parameter_id` bigint(20) unsigned NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=12 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_season_playtype_players`
--

CREATE TABLE IF NOT EXISTS `stat_season_playtype_players` (
`id` bigint(20) unsigned NOT NULL,
  `season_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(9) NOT NULL,
  `pts` mediumint(9) NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `assist` mediumint(8) unsigned DEFAULT NULL,
  `ast_per` decimal(10,6) unsigned DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `tov_per_possession` decimal(10,6) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `fta_per_40` decimal(10,6) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2891059 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_season_playtype_teams`
--

CREATE TABLE IF NOT EXISTS `stat_season_playtype_teams` (
`id` bigint(20) unsigned NOT NULL,
  `season_id` bigint(20) unsigned NOT NULL,
  `club_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `poss` mediumint(9) NOT NULL,
  `pts` mediumint(9) NOT NULL,
  `ppp` decimal(8,2) unsigned NOT NULL,
  `play_type_id` enum('onball','offball','transition','skip','other') DEFAULT NULL,
  `play_type_sub_id` enum('Transition','Spot','Cut','PnR Handler','Misc','Off-screen','Iso','Post','Putback','Handoff','PnR Roll') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=281071 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_starttype_competition_opponents`
--

CREATE TABLE IF NOT EXISTS `stat_starttype_competition_opponents` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `type` enum('FGM','TOV_Live','FG_DREB','FTM','FG_deadball','TOV_deadball','OREB','Missed_FT_Dead','Missed_FT_Live','TOV_Team','Period_Start') NOT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `poss` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=236919 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_starttype_competition_teams`
--

CREATE TABLE IF NOT EXISTS `stat_starttype_competition_teams` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `type` enum('FGM','TOV_Live','FG_DREB','FTM','FG_deadball','TOV_deadball','OREB','Missed_FT_Dead','Missed_FT_Live','TOV_Team','Period_Start') NOT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `poss` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=239991 ;

-- --------------------------------------------------------

--
-- Table structure for table `stat_starttype_game_teams`
--

CREATE TABLE IF NOT EXISTS `stat_starttype_game_teams` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `competition_phase_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `type` enum('FGM','TOV_Live','FG_DREB','FTM','FG_deadball','TOV_deadball','OREB','Missed_FT_Dead','Missed_FT_Live','TOV_Team','Period_Start') NOT NULL,
  `pts2_made` mediumint(8) unsigned DEFAULT NULL,
  `pts2_all` mediumint(8) unsigned DEFAULT NULL,
  `pts2_per` decimal(10,6) DEFAULT NULL,
  `pts3_made` mediumint(8) unsigned DEFAULT NULL,
  `pts3_all` mediumint(8) unsigned DEFAULT NULL,
  `pts3_per` decimal(10,6) DEFAULT NULL,
  `ft_made` mediumint(8) unsigned DEFAULT NULL,
  `ft_all` mediumint(8) unsigned DEFAULT NULL,
  `ft_per` decimal(10,6) DEFAULT NULL,
  `turnover` mediumint(8) unsigned DEFAULT NULL,
  `pts` mediumint(8) unsigned DEFAULT NULL,
  `poss` mediumint(8) unsigned DEFAULT NULL,
  `ppp` decimal(10,6) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1905575 ;

-- --------------------------------------------------------

--
-- Table structure for table `streak_career_players`
--

CREATE TABLE IF NOT EXISTS `streak_career_players` (
`id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `last_game_id` bigint(20) unsigned DEFAULT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `last_ft` smallint(5) unsigned DEFAULT NULL,
  `last_2pt` smallint(5) unsigned DEFAULT NULL,
  `last_3pt` smallint(5) unsigned DEFAULT NULL,
  `last_fg` smallint(5) unsigned DEFAULT NULL,
  `last_rim` smallint(5) unsigned DEFAULT NULL,
  `last_paint` smallint(5) unsigned DEFAULT NULL,
  `last_non_paint` smallint(5) unsigned DEFAULT NULL,
  `last_3l` smallint(5) unsigned DEFAULT NULL,
  `last_3c` smallint(5) unsigned DEFAULT NULL,
  `best_ft` smallint(5) unsigned DEFAULT NULL,
  `best_ft_1st` bigint(20) unsigned DEFAULT NULL,
  `best_ft_last` bigint(20) unsigned DEFAULT NULL,
  `best_2pt` smallint(5) unsigned DEFAULT NULL,
  `best_2pt_1st` bigint(20) unsigned DEFAULT NULL,
  `best_2pt_last` bigint(20) unsigned DEFAULT NULL,
  `best_3pt` smallint(5) unsigned DEFAULT NULL,
  `best_3pt_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3pt_last` bigint(20) unsigned DEFAULT NULL,
  `best_fg` smallint(5) unsigned DEFAULT NULL,
  `best_fg_1st` bigint(20) unsigned DEFAULT NULL,
  `best_fg_last` bigint(20) unsigned DEFAULT NULL,
  `best_rim` smallint(5) unsigned DEFAULT NULL,
  `best_rim_1st` bigint(20) unsigned DEFAULT NULL,
  `best_rim_last` bigint(20) unsigned DEFAULT NULL,
  `best_paint` smallint(5) unsigned DEFAULT NULL,
  `best_paint_1st` bigint(20) unsigned DEFAULT NULL,
  `best_paint_last` bigint(20) unsigned DEFAULT NULL,
  `best_non_paint` smallint(5) unsigned DEFAULT NULL,
  `best_non_paint_1st` bigint(20) unsigned DEFAULT NULL,
  `best_non_paint_last` bigint(20) unsigned DEFAULT NULL,
  `best_3l` smallint(5) unsigned DEFAULT NULL,
  `best_3l_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3l_last` bigint(20) unsigned DEFAULT NULL,
  `best_3c` smallint(5) unsigned DEFAULT NULL,
  `best_3c_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3c_last` bigint(20) unsigned DEFAULT NULL,
  `avg_ft` decimal(5,2) DEFAULT NULL,
  `avg_2pt` decimal(5,2) DEFAULT NULL,
  `avg_3pt` decimal(5,2) DEFAULT NULL,
  `avg_fg` decimal(5,2) DEFAULT NULL,
  `avg_rim` decimal(5,2) DEFAULT NULL,
  `avg_paint` decimal(5,2) DEFAULT NULL,
  `avg_non_paint` decimal(5,2) DEFAULT NULL,
  `avg_3l` decimal(5,2) DEFAULT NULL,
  `avg_3c` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=100597 ;

-- --------------------------------------------------------

--
-- Table structure for table `streak_competition_players`
--

CREATE TABLE IF NOT EXISTS `streak_competition_players` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `last_game_id` bigint(20) unsigned DEFAULT NULL,
  `player_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `last_ft` smallint(5) unsigned DEFAULT NULL,
  `last_2pt` smallint(5) unsigned DEFAULT NULL,
  `last_3pt` smallint(5) unsigned DEFAULT NULL,
  `last_fg` smallint(5) unsigned DEFAULT NULL,
  `last_rim` smallint(5) unsigned DEFAULT NULL,
  `last_paint` smallint(5) unsigned DEFAULT NULL,
  `last_non_paint` smallint(5) unsigned DEFAULT NULL,
  `last_3l` smallint(5) unsigned DEFAULT NULL,
  `last_3c` smallint(5) unsigned DEFAULT NULL,
  `best_ft` smallint(5) unsigned DEFAULT NULL,
  `best_ft_1st` bigint(20) unsigned DEFAULT NULL,
  `best_ft_last` bigint(20) unsigned DEFAULT NULL,
  `best_2pt` smallint(5) unsigned DEFAULT NULL,
  `best_2pt_1st` bigint(20) unsigned DEFAULT NULL,
  `best_2pt_last` bigint(20) unsigned DEFAULT NULL,
  `best_3pt` smallint(5) unsigned DEFAULT NULL,
  `best_3pt_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3pt_last` bigint(20) unsigned DEFAULT NULL,
  `best_fg` smallint(5) unsigned DEFAULT NULL,
  `best_fg_1st` bigint(20) unsigned DEFAULT NULL,
  `best_fg_last` bigint(20) unsigned DEFAULT NULL,
  `best_rim` smallint(5) unsigned DEFAULT NULL,
  `best_rim_1st` bigint(20) unsigned DEFAULT NULL,
  `best_rim_last` bigint(20) unsigned DEFAULT NULL,
  `best_paint` smallint(5) unsigned DEFAULT NULL,
  `best_paint_1st` bigint(20) unsigned DEFAULT NULL,
  `best_paint_last` bigint(20) unsigned DEFAULT NULL,
  `best_non_paint` smallint(5) unsigned DEFAULT NULL,
  `best_non_paint_1st` bigint(20) unsigned DEFAULT NULL,
  `best_non_paint_last` bigint(20) unsigned DEFAULT NULL,
  `best_3l` smallint(5) unsigned DEFAULT NULL,
  `best_3l_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3l_last` bigint(20) unsigned DEFAULT NULL,
  `best_3c` smallint(5) unsigned DEFAULT NULL,
  `best_3c_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3c_last` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4638885 ;

-- --------------------------------------------------------

--
-- Table structure for table `streak_competition_teams`
--

CREATE TABLE IF NOT EXISTS `streak_competition_teams` (
`id` bigint(20) unsigned NOT NULL,
  `competition_id` bigint(20) unsigned NOT NULL,
  `last_game_id` bigint(20) unsigned DEFAULT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `source_id` bigint(20) unsigned NOT NULL,
  `last_ft` smallint(5) unsigned DEFAULT NULL,
  `last_2pt` smallint(5) unsigned DEFAULT NULL,
  `last_3pt` smallint(5) unsigned DEFAULT NULL,
  `last_fg` smallint(5) unsigned DEFAULT NULL,
  `last_rim` smallint(5) unsigned DEFAULT NULL,
  `last_paint` smallint(5) unsigned DEFAULT NULL,
  `last_non_paint` smallint(5) unsigned DEFAULT NULL,
  `last_3l` smallint(5) unsigned DEFAULT NULL,
  `last_3c` smallint(5) unsigned DEFAULT NULL,
  `best_ft` smallint(5) unsigned DEFAULT NULL,
  `best_ft_1st` bigint(20) unsigned DEFAULT NULL,
  `best_ft_last` bigint(20) unsigned DEFAULT NULL,
  `best_2pt` smallint(5) unsigned DEFAULT NULL,
  `best_2pt_1st` bigint(20) unsigned DEFAULT NULL,
  `best_2pt_last` bigint(20) unsigned DEFAULT NULL,
  `best_3pt` smallint(5) unsigned DEFAULT NULL,
  `best_3pt_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3pt_last` bigint(20) unsigned DEFAULT NULL,
  `best_fg` smallint(5) unsigned DEFAULT NULL,
  `best_fg_1st` bigint(20) unsigned DEFAULT NULL,
  `best_fg_last` bigint(20) unsigned DEFAULT NULL,
  `best_rim` smallint(5) unsigned DEFAULT NULL,
  `best_rim_1st` bigint(20) unsigned DEFAULT NULL,
  `best_rim_last` bigint(20) unsigned DEFAULT NULL,
  `best_paint` smallint(5) unsigned DEFAULT NULL,
  `best_paint_1st` bigint(20) unsigned DEFAULT NULL,
  `best_paint_last` bigint(20) unsigned DEFAULT NULL,
  `best_non_paint` smallint(5) unsigned DEFAULT NULL,
  `best_non_paint_1st` bigint(20) unsigned DEFAULT NULL,
  `best_non_paint_last` bigint(20) unsigned DEFAULT NULL,
  `best_3l` smallint(5) unsigned DEFAULT NULL,
  `best_3l_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3l_last` bigint(20) unsigned DEFAULT NULL,
  `best_3c` smallint(5) unsigned DEFAULT NULL,
  `best_3c_1st` bigint(20) unsigned DEFAULT NULL,
  `best_3c_last` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=342041 ;

-- --------------------------------------------------------

--
-- Table structure for table `true_highlight_favorites`
--

CREATE TABLE IF NOT EXISTS `true_highlight_favorites` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `true_highlight_group_id` bigint(20) unsigned NOT NULL,
  `pbp_event_video_id` bigint(20) unsigned NOT NULL,
  `video_order` smallint(5) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=245 ;

-- --------------------------------------------------------

--
-- Table structure for table `true_highlight_groups`
--

CREATE TABLE IF NOT EXISTS `true_highlight_groups` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=19 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_formulas`
--

CREATE TABLE IF NOT EXISTS `user_formulas` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `table_name` varchar(255) NOT NULL,
  `column_name` varchar(255) NOT NULL,
  `short_name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `formula` varchar(255) NOT NULL,
  `decimals` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=13 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_interest`
--

CREATE TABLE IF NOT EXISTS `user_interest` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `interest_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=22 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_searches`
--

CREATE TABLE IF NOT EXISTS `user_searches` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `search_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Filters',
  `is_favorite` tinyint(1) NOT NULL DEFAULT 0,
  `is_shared` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `results` int(11) NOT NULL DEFAULT 0,
  `searched_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `search_type` varchar(255) NOT NULL DEFAULT 'player'
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=4255 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_search_histories`
--

CREATE TABLE IF NOT EXISTS `user_search_histories` (
`id` bigint(20) unsigned NOT NULL,
  `user_search_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=15127 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_sport`
--

CREATE TABLE IF NOT EXISTS `user_sport` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `sport_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=14 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_video_tag_event_tree`
--

CREATE TABLE IF NOT EXISTS `user_video_tag_event_tree` (
`id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `video_tag_event_tree_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1029 ;

-- --------------------------------------------------------

--
-- Table structure for table `varese_rapm`
--

CREATE TABLE IF NOT EXISTS `varese_rapm` (
  `id` int(3) NOT NULL,
  `tm_names` varchar(100) DEFAULT NULL,
  `player_id` int(6) DEFAULT NULL,
  `competition_id` int(10) unsigned DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `age` varchar(16) DEFAULT NULL,
  `ht` varchar(3) DEFAULT NULL,
  `wt` varchar(3) DEFAULT NULL,
  `GP` int(2) DEFAULT NULL,
  `MP` int(3) DEFAULT NULL,
  `ORPM` varchar(20) DEFAULT NULL,
  `DRPM` varchar(20) DEFAULT NULL,
  `RAPM` varchar(20) DEFAULT NULL,
  `intercept` varchar(16) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `videoplayer_playtype_settings`
--

CREATE TABLE IF NOT EXISTS `videoplayer_playtype_settings` (
`id` bigint(20) unsigned NOT NULL,
  `playtype` varchar(255) DEFAULT NULL,
  `fc_code` smallint(5) unsigned DEFAULT NULL,
  `pre_cut_pc` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `post_cut_pc` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=40 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_clips`
--

CREATE TABLE IF NOT EXISTS `video_tag_clips` (
`id` bigint(20) unsigned NOT NULL,
  `club_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `storage_path` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=148 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_clip_tagging_event`
--

CREATE TABLE IF NOT EXISTS `video_tag_clip_tagging_event` (
`id` bigint(20) unsigned NOT NULL,
  `video_tag_clip_id` bigint(20) unsigned NOT NULL,
  `video_tag_tagging_event_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=554 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_events`
--

CREATE TABLE IF NOT EXISTS `video_tag_events` (
`id` bigint(20) unsigned NOT NULL,
  `video_tag_event_tree_id` bigint(20) unsigned NOT NULL,
  `parent_video_tag_event_id` bigint(20) unsigned DEFAULT NULL,
  `pbp_code_id` bigint(20) unsigned DEFAULT NULL,
  `pbp_sub_code_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(255) NOT NULL,
  `abbreviation` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_sub_event_selection_required` tinyint(1) NOT NULL DEFAULT 0,
  `order` int(11) DEFAULT NULL,
  `value` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=495 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_event_trees`
--

CREATE TABLE IF NOT EXISTS `video_tag_event_trees` (
`id` bigint(20) unsigned NOT NULL,
  `club_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=11 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_taggings`
--

CREATE TABLE IF NOT EXISTS `video_tag_taggings` (
`id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `video_tag_video_id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `club_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=219 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_tagging_events`
--

CREATE TABLE IF NOT EXISTS `video_tag_tagging_events` (
`id` bigint(20) unsigned NOT NULL,
  `video_tag_tagging_id` bigint(20) unsigned NOT NULL,
  `video_tag_event_id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned NOT NULL,
  `competition_team_id` bigint(20) unsigned NOT NULL,
  `player_id` bigint(20) unsigned DEFAULT NULL,
  `pbp_id` bigint(20) unsigned DEFAULT NULL,
  `period` tinyint(3) unsigned DEFAULT NULL,
  `game_time_seconds` int(10) unsigned DEFAULT NULL,
  `home_score` tinyint(4) DEFAULT NULL,
  `away_score` tinyint(4) DEFAULT NULL,
  `is_team_event` tinyint(1) NOT NULL DEFAULT 0,
  `is_player_event` tinyint(1) NOT NULL DEFAULT 1,
  `is_successful_event` tinyint(1) NOT NULL,
  `event_at_milliseconds` bigint(20) NOT NULL,
  `event_at_frame` bigint(20) NOT NULL,
  `event_clicked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=102593 ;

-- --------------------------------------------------------

--
-- Table structure for table `video_tag_videos`
--

CREATE TABLE IF NOT EXISTS `video_tag_videos` (
`id` bigint(20) unsigned NOT NULL,
  `schedule_id` bigint(20) unsigned DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `source_type` varchar(255) NOT NULL DEFAULT 'mkosz',
  `local_storage_disk` varchar(255) DEFAULT NULL,
  `local_storage_path` varchar(255) DEFAULT NULL,
  `download_status` varchar(255) DEFAULT 'not_downloaded',
  `ftp_path` varchar(255) DEFAULT NULL,
  `file_size_byte` bigint(20) unsigned NOT NULL DEFAULT 0,
  `duration_ms` bigint(20) unsigned NOT NULL DEFAULT 0,
  `fps` double(8,2) unsigned NOT NULL DEFAULT 0.00,
  `is_main_video` tinyint(1) NOT NULL DEFAULT 0,
  `frame_delay_from_main_video` bigint(20) NOT NULL DEFAULT 0,
  `milliseconds_delay_from_main_video` bigint(20) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=5067 ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `affiliates`
--
ALTER TABLE `affiliates`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `affiliates_email_unique` (`email`);

--
-- Indexes for table `affiliate_sources`
--
ALTER TABLE `affiliate_sources`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `agents`
--
ALTER TABLE `agents`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `arenas`
--
ALTER TABLE `arenas`
 ADD PRIMARY KEY (`id`), ADD KEY `city_id` (`city_id`);

--
-- Indexes for table `check_duplicities`
--
ALTER TABLE `check_duplicities`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `check_duplicities_results`
--
ALTER TABLE `check_duplicities_results`
 ADD PRIMARY KEY (`id`), ADD KEY `check_value_id` (`check_value_id`), ADD KEY `level` (`level`), ADD KEY `check_value_id_2` (`check_value_id`,`level`);

--
-- Indexes for table `check_results`
--
ALTER TABLE `check_results`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `check_value_id_3` (`check_value_id`,`table_id`), ADD KEY `check_value_id` (`check_value_id`), ADD KEY `level` (`level`), ADD KEY `check_value_id_2` (`check_value_id`,`level`);

--
-- Indexes for table `check_stat_table_contents`
--
ALTER TABLE `check_stat_table_contents`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `check_stat_table_content_results`
--
ALTER TABLE `check_stat_table_content_results`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `id` (`id`,`check_stat_table_content_id`), ADD KEY `check_stat_table_content_id` (`check_stat_table_content_id`), ADD FULLTEXT KEY `list_data` (`list_data`);

--
-- Indexes for table `check_values`
--
ALTER TABLE `check_values`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `clubs`
--
ALTER TABLE `clubs`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `ff_code` (`ff_code`), ADD UNIQUE KEY `clubs_uuid_unique` (`uuid`);

--
-- Indexes for table `club_management_columns`
--
ALTER TABLE `club_management_columns`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `club_management_column_values`
--
ALTER TABLE `club_management_column_values`
 ADD PRIMARY KEY (`id`), ADD KEY `club_management_column_values_user_id_player_id_column_id_index` (`user_id`,`player_id`,`column_id`);

--
-- Indexes for table `coaches`
--
ALTER TABLE `coaches`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `competitions`
--
ALTER TABLE `competitions`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competitions_uuid_unique` (`uuid`), ADD UNIQUE KEY `season_id` (`season_id`,`league_id`), ADD KEY `ff_code` (`ff_code`), ADD KEY `league_id` (`league_id`);

--
-- Indexes for table `competition_phases`
--
ALTER TABLE `competition_phases`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_phase_unique` (`competition_id`,`phase_id`), ADD UNIQUE KEY `competition_phases_uuid_unique` (`uuid`), ADD KEY `competition_id` (`competition_id`), ADD KEY `phase_id` (`phase_id`);

--
-- Indexes for table `competition_phase_groups`
--
ALTER TABLE `competition_phase_groups`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_phase_group_unique` (`competition_id`,`competition_phase_id`,`group_id`);

--
-- Indexes for table `competition_teams`
--
ALTER TABLE `competition_teams`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_team` (`competition_id`,`club_id`) COMMENT 'One team can particiapte in one competition only once', ADD UNIQUE KEY `competition_teams_slug_unique` (`slug`), ADD UNIQUE KEY `competition_teams_uuid_unique` (`uuid`), ADD KEY `coach_id` (`coach_id`), ADD KEY `team_id` (`club_id`);

--
-- Indexes for table `continents`
--
ALTER TABLE `continents`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `garbage_time_yes`
--
ALTER TABLE `garbage_time_yes`
 ADD PRIMARY KEY (`lead`,`time_left_sec`,`possession`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `highschools`
--
ALTER TABLE `highschools`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `interests`
--
ALTER TABLE `interests`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leagues`
--
ALTER TABLE `leagues`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `leagues_uuid_unique` (`uuid`), ADD KEY `country_id` (`country_id`), ADD KEY `continent_id` (`continent_id`);

--
-- Indexes for table `log_skipped_synergy_players`
--
ALTER TABLE `log_skipped_synergy_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `idx_synergy_id_hash` (`synergy_id_hash`);

--
-- Indexes for table `mapping_agents`
--
ALTER TABLE `mapping_agents`
 ADD PRIMARY KEY (`id`), ADD KEY `mapping_agents_mapping_source_id_foreign` (`mapping_source_id`), ADD KEY `mapping_agents_agent_id_foreign` (`agent_id`);

--
-- Indexes for table `mapping_competitions`
--
ALTER TABLE `mapping_competitions`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mapping_players`
--
ALTER TABLE `mapping_players`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mapping_sources`
--
ALTER TABLE `mapping_sources`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mapping_teams`
--
ALTER TABLE `mapping_teams`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `media`
--
ALTER TABLE `media`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `media_uuid_unique` (`uuid`), ADD KEY `media_model_type_model_id_index` (`model_type`,`model_id`), ADD KEY `media_order_column_index` (`order_column`), ADD KEY `media_created_by_index` (`created_by`);

--
-- Indexes for table `media_categories`
--
ALTER TABLE `media_categories`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oauth_access_tokens`
--
ALTER TABLE `oauth_access_tokens`
 ADD PRIMARY KEY (`id`), ADD KEY `oauth_access_tokens_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_auth_codes`
--
ALTER TABLE `oauth_auth_codes`
 ADD PRIMARY KEY (`id`), ADD KEY `oauth_auth_codes_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_clients`
--
ALTER TABLE `oauth_clients`
 ADD PRIMARY KEY (`id`), ADD KEY `oauth_clients_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oauth_refresh_tokens`
--
ALTER TABLE `oauth_refresh_tokens`
 ADD PRIMARY KEY (`id`), ADD KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`);

--
-- Indexes for table `payment_coupons`
--
ALTER TABLE `payment_coupons`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_credit_purchases`
--
ALTER TABLE `payment_credit_purchases`
 ADD PRIMARY KEY (`id`), ADD KEY `payment_credit_purchases_user_id_index` (`user_id`), ADD KEY `payment_credit_purchases_stripe_session_id_index` (`stripe_session_id`), ADD KEY `payment_credit_purchases_coupon_id_index` (`coupon_id`);

--
-- Indexes for table `payment_credit_tiers`
--
ALTER TABLE `payment_credit_tiers`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_credit_uses`
--
ALTER TABLE `payment_credit_uses`
 ADD PRIMARY KEY (`id`), ADD KEY `payment_credit_uses_user_id_index` (`user_id`), ADD KEY `payment_credit_uses_coupon_id_index` (`coupon_id`);

--
-- Indexes for table `payment_extensions`
--
ALTER TABLE `payment_extensions`
 ADD PRIMARY KEY (`id`), ADD KEY `payment_extensions_payment_package_id_foreign` (`payment_package_id`);

--
-- Indexes for table `payment_packages`
--
ALTER TABLE `payment_packages`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_public_items`
--
ALTER TABLE `payment_public_items`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `payment_public_items_player_id_competition_team_id_type_unique` (`player_id`,`competition_team_id`,`type`), ADD KEY `payment_public_items_competition_team_id_foreign` (`competition_team_id`);

--
-- Indexes for table `payment_public_purchases`
--
ALTER TABLE `payment_public_purchases`
 ADD PRIMARY KEY (`id`), ADD KEY `payment_public_purchases_user_id_index` (`user_id`), ADD KEY `payment_public_purchases_payment_public_item_id_foreign` (`payment_public_item_id`);

--
-- Indexes for table `payment_purchasable_modules`
--
ALTER TABLE `payment_purchasable_modules`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_selected_competitions`
--
ALTER TABLE `payment_selected_competitions`
 ADD PRIMARY KEY (`id`), ADD KEY `payment_selected_competitions_user_id_index` (`user_id`);

--
-- Indexes for table `payment_shipping_prices`
--
ALTER TABLE `payment_shipping_prices`
 ADD PRIMARY KEY (`id`), ADD KEY `payment_shipping_prices_country_id_index` (`country_id`);

--
-- Indexes for table `pbp`
--
ALTER TABLE `pbp`
 ADD PRIMARY KEY (`id`), ADD KEY `schedule_id` (`schedule_id`) COMMENT 'queries are mainly sorted on schedule_id', ADD KEY `pbp_schedule_id` (`pbp_schedule_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `player_id` (`player_id`), ADD KEY `player_id2` (`player_id2`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `home_player1` (`home_player1`), ADD KEY `home_player2` (`home_player2`), ADD KEY `home_player3` (`home_player3`), ADD KEY `home_player4` (`home_player4`), ADD KEY `home_player5` (`home_player5`), ADD KEY `away_player1` (`away_player1`), ADD KEY `away_player2` (`away_player2`), ADD KEY `away_player3` (`away_player3`), ADD KEY `away_player4` (`away_player4`), ADD KEY `away_player5` (`away_player5`), ADD KEY `fc_code` (`fc_code`,`fc_subcode`), ADD KEY `pbp_source_id_foreign` (`source_id`), ADD KEY `updated_at` (`updated_at`), ADD KEY `created_at` (`created_at`), ADD KEY `pbp_competition_phase_id_foreign` (`competition_phase_id`);

--
-- Indexes for table `pbp_advanced_tags`
--
ALTER TABLE `pbp_advanced_tags`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `pbp_advanced_tags_pbp_id_tag_group_id_unique` (`pbp_id`,`tag_group_id`);

--
-- Indexes for table `pbp_advanced_tag_buttons`
--
ALTER TABLE `pbp_advanced_tag_buttons`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pbp_advanced_tag_groups`
--
ALTER TABLE `pbp_advanced_tag_groups`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pbp_codes`
--
ALTER TABLE `pbp_codes`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `pbp_code_id` (`pbp_code_id`);

--
-- Indexes for table `pbp_event_connections`
--
ALTER TABLE `pbp_event_connections`
 ADD PRIMARY KEY (`id`), ADD KEY `schedule_id` (`schedule_id`), ADD KEY `source_id1` (`source_id1`), ADD KEY `source_id2` (`source_id2`), ADD KEY `pbp_id1` (`pbp_id1`), ADD KEY `pbp_id2` (`pbp_id2`), ADD KEY `pec_schedule_pbp_source_index` (`schedule_id`,`source_id1`,`pbp_id1`,`source_id2`,`pbp_id2`), ADD KEY `pec_source_index` (`source_id1`,`source_id2`);

--
-- Indexes for table `pbp_event_videos`
--
ALTER TABLE `pbp_event_videos`
 ADD PRIMARY KEY (`id`), ADD KEY `source_id` (`source_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `pbp_id` (`pbp_id`), ADD KEY `schedule_id` (`schedule_id`);

--
-- Indexes for table `pbp_schedule`
--
ALTER TABLE `pbp_schedule`
 ADD PRIMARY KEY (`id`), ADD KEY `schedule_id` (`schedule_id`), ADD KEY `source_id` (`source_id`);

--
-- Indexes for table `pbp_sources`
--
ALTER TABLE `pbp_sources`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pbp_zone_review`
--
ALTER TABLE `pbp_zone_review`
 ADD PRIMARY KEY (`id`), ADD KEY `idx_src2` (`pbp_id_src2`);

--
-- Indexes for table `phases`
--
ALTER TABLE `phases`
 ADD PRIMARY KEY (`id`), ADD KEY `ff_postfix` (`ff_postfix`);

--
-- Indexes for table `players`
--
ALTER TABLE `players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `Player_code` (`ff_code`) COMMENT 'FF unique code is a must', ADD UNIQUE KEY `players_slug_unique` (`slug`), ADD UNIQUE KEY `players_uuid_unique` (`uuid`), ADD KEY `source_id` (`source_id`);

--
-- Indexes for table `player_agents`
--
ALTER TABLE `player_agents`
 ADD PRIMARY KEY (`id`), ADD KEY `player_agents_player_id_foreign` (`player_id`), ADD KEY `player_agents_agent_id_foreign` (`agent_id`);

--
-- Indexes for table `player_ai_data`
--
ALTER TABLE `player_ai_data`
 ADD PRIMARY KEY (`id`), ADD KEY `player_ai_data_player_id_foreign` (`player_id`);

--
-- Indexes for table `player_ai_source_ids`
--
ALTER TABLE `player_ai_source_ids`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `player_ai_source_ids_player_id_source_unique` (`player_id`,`source`);

--
-- Indexes for table `player_bios`
--
ALTER TABLE `player_bios`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `code` (`ff_code`), ADD KEY `player_id` (`player_id`);

--
-- Indexes for table `player_combine_measurements`
--
ALTER TABLE `player_combine_measurements`
 ADD PRIMARY KEY (`id`), ADD KEY `player_id` (`player_id`);

--
-- Indexes for table `player_merge_decisions`
--
ALTER TABLE `player_merge_decisions`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `uq_pair` (`player_id_a`,`player_id_b`), ADD KEY `idx_decision` (`decision`), ADD KEY `idx_skip_until` (`skip_until`), ADD KEY `idx_decision_skip` (`decision`,`skip_until`), ADD KEY `idx_a` (`player_id_a`), ADD KEY `idx_b` (`player_id_b`);

--
-- Indexes for table `player_merge_logs`
--
ALTER TABLE `player_merge_logs`
 ADD PRIMARY KEY (`id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `good_player_id` (`good_player_id`), ADD KEY `bad_player_id` (`bad_player_id`), ADD KEY `competition_team_id` (`competition_team_id`);

--
-- Indexes for table `player_salaries`
--
ALTER TABLE `player_salaries`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `player_salaries_unique` (`owner_club_id`,`season_id`,`player_id`,`competition_team_id`), ADD KEY `salary_index` (`salary`), ADD KEY `player_salaries_season_id_foreign` (`season_id`), ADD KEY `player_salaries_player_id_foreign` (`player_id`), ADD KEY `player_salaries_competition_team_id_foreign` (`competition_team_id`);

--
-- Indexes for table `player_salary_offers`
--
ALTER TABLE `player_salary_offers`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `player_salary_offers_unique` (`owner_club_id`,`season_id`,`player_id`,`competition_team_id`), ADD KEY `offer_min_index` (`offer`), ADD KEY `player_salary_offers_season_id_foreign` (`season_id`), ADD KEY `player_salary_offers_player_id_foreign` (`player_id`), ADD KEY `player_salary_offers_competition_team_id_foreign` (`competition_team_id`), ADD KEY `player_salary_offers_agent_id_foreign` (`agent_id`);

--
-- Indexes for table `playtag_event_types`
--
ALTER TABLE `playtag_event_types`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_event_types_user_id_index` (`user_id`);

--
-- Indexes for table `playtag_game_colors`
--
ALTER TABLE `playtag_game_colors`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_game_colors_schedule_id_index` (`schedule_id`), ADD KEY `playtag_game_colors_user_id_index` (`user_id`);

--
-- Indexes for table `playtag_game_plays`
--
ALTER TABLE `playtag_game_plays`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_game_playbooks_schedule_id_competition_team_id_index` (`schedule_id`,`competition_team_id`), ADD KEY `playtag_game_playbooks_playtag_playbook_id_index` (`playtag_play_id`);

--
-- Indexes for table `playtag_game_play_events`
--
ALTER TABLE `playtag_game_play_events`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_game_playbook_events_playtag_game_playbook_id_index` (`playtag_game_play_id`), ADD KEY `playtag_game_playbook_events_schedule_id_index` (`schedule_id`), ADD KEY `playtag_game_playbook_events_competition_team_id_index` (`competition_team_id`), ADD KEY `playtag_game_playbook_events_playtag_playbook_id_index` (`playtag_play_id`), ADD KEY `playtag_game_playbook_events_playtag_event_type_id_index` (`playtag_event_type_id`), ADD KEY `playtag_game_playbook_events_playtag_pbp_id_index` (`playtag_pbp_id`);

--
-- Indexes for table `playtag_pbp`
--
ALTER TABLE `playtag_pbp`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_pbp_schedule_id_index` (`schedule_id`);

--
-- Indexes for table `playtag_plays`
--
ALTER TABLE `playtag_plays`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_playbooks_competition_team_id_index` (`competition_team_id`);

--
-- Indexes for table `playtag_playsets`
--
ALTER TABLE `playtag_playsets`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_playsets_competition_team_id_index` (`competition_team_id`);

--
-- Indexes for table `playtag_playset_play`
--
ALTER TABLE `playtag_playset_play`
 ADD PRIMARY KEY (`id`), ADD KEY `ppp_playset_playbook_index` (`playtag_playset_id`,`playtag_play_id`);

--
-- Indexes for table `playtag_schedule_players`
--
ALTER TABLE `playtag_schedule_players`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_schedule_players_schedule_id_foreign` (`schedule_id`), ADD KEY `playtag_schedule_players_player_id_foreign` (`player_id`);

--
-- Indexes for table `playtag_shares`
--
ALTER TABLE `playtag_shares`
 ADD PRIMARY KEY (`id`), ADD KEY `playtag_shares_user_id_index` (`user_id`), ADD KEY `playtag_shares_created_by_index` (`created_by`);

--
-- Indexes for table `polar_events`
--
ALTER TABLE `polar_events`
 ADD PRIMARY KEY (`id`), ADD KEY `polar_events_user_id_index` (`user_id`), ADD KEY `polar_events_polar_team_id_foreign` (`polar_team_id`);

--
-- Indexes for table `polar_event_data`
--
ALTER TABLE `polar_event_data`
 ADD PRIMARY KEY (`id`), ADD KEY `polar_event_data_polar_event_id_foreign` (`polar_event_id`), ADD KEY `polar_event_data_polar_player_id_foreign` (`polar_player_id`);

--
-- Indexes for table `polar_players`
--
ALTER TABLE `polar_players`
 ADD PRIMARY KEY (`id`), ADD KEY `polar_players_user_id_index` (`user_id`), ADD KEY `polar_players_polar_team_id_foreign` (`polar_team_id`);

--
-- Indexes for table `polar_teams`
--
ALTER TABLE `polar_teams`
 ADD PRIMARY KEY (`id`), ADD KEY `polar_teams_user_id_index` (`user_id`);

--
-- Indexes for table `report_cache`
--
ALTER TABLE `report_cache`
 ADD PRIMARY KEY (`id`), ADD KEY `report_cache_player_id_foreign` (`player_id`), ADD KEY `report_cache_club_id_foreign` (`club_id`), ADD KEY `report_cache_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `report_cache_league_id_foreign` (`league_id`), ADD KEY `idx_report_lookup` (`report_name`,`competition_id`,`competition_phase_id`,`view_type`), ADD KEY `idx_grouping_key` (`grouping_key`), ADD KEY `fk_report_cache_schedule` (`schedule_id`), ADD KEY `idx_created_at` (`created_at`), ADD KEY `idx_filters_and_date` (`competition_id`,`report_name`,`created_at` DESC), ADD KEY `idx_event_date` (`event_date`);

--
-- Indexes for table `report_player_roles`
--
ALTER TABLE `report_player_roles`
 ADD PRIMARY KEY (`id`), ADD KEY `report_player_roles_player_id_foreign` (`player_id`);

--
-- Indexes for table `report_shot_distance`
--
ALTER TABLE `report_shot_distance`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roster`
--
ALTER TABLE `roster`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competiton_id` (`competition_id`,`player_id`,`competition_team_id`) USING BTREE, ADD UNIQUE KEY `competition_id` (`competition_id`,`player_id`,`competition_team_id`), ADD KEY `player_id` (`player_id`), ADD KEY `competition_team_id` (`competition_team_id`);

--
-- Indexes for table `roster_deleted_players`
--
ALTER TABLE `roster_deleted_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competiton_id` (`competition_id`,`player_id`,`competition_team_id`) USING BTREE, ADD UNIQUE KEY `competition_id` (`competition_id`,`player_id`,`competition_team_id`), ADD KEY `player_id` (`player_id`), ADD KEY `competition_team_id` (`competition_team_id`);

--
-- Indexes for table `roster_restored`
--
ALTER TABLE `roster_restored`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competiton_id` (`competition_id`,`player_id`,`competition_team_id`) USING BTREE, ADD UNIQUE KEY `competition_id` (`competition_id`,`player_id`,`competition_team_id`), ADD KEY `player_id` (`player_id`), ADD KEY `competition_team_id` (`competition_team_id`);

--
-- Indexes for table `schedule`
--
ALTER TABLE `schedule`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `home_away_date` (`home_id`,`away_id`,`ff_code`,`competition_phase_id`) USING BTREE COMMENT 'Two teams can play only once according to the FF code', ADD UNIQUE KEY `schedule_uuid_unique` (`uuid`), ADD KEY `competition` (`competition_id`,`competition_phase_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `away_id` (`away_id`), ADD KEY `schedule_start_time_deleted_at_index` (`start_time`,`deleted_at`), ADD KEY `schedule_home_coach_id_foreign` (`home_coach_id`), ADD KEY `schedule_away_coach_id_foreign` (`away_coach_id`);

--
-- Indexes for table `schedule_rounds`
--
ALTER TABLE `schedule_rounds`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `schedule_tv_flags`
--
ALTER TABLE `schedule_tv_flags`
 ADD PRIMARY KEY (`schedule_id`);

--
-- Indexes for table `searches`
--
ALTER TABLE `searches`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `user_searches_hash_unique` (`hash`);

--
-- Indexes for table `seasons`
--
ALTER TABLE `seasons`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `seasons_uuid_unique` (`uuid`);

--
-- Indexes for table `shared_playlists`
--
ALTER TABLE `shared_playlists`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `share_uuid` (`share_uuid`);

--
-- Indexes for table `shooting_chart_guest_histories`
--
ALTER TABLE `shooting_chart_guest_histories`
 ADD PRIMARY KEY (`id`), ADD KEY `shooting_chart_guest_histories_guest_id_index` (`guest_id`), ADD KEY `shooting_chart_guest_histories_user_id_index` (`user_id`);

--
-- Indexes for table `shooting_chart_user_histories`
--
ALTER TABLE `shooting_chart_user_histories`
 ADD PRIMARY KEY (`id`), ADD KEY `shooting_chart_user_histories_user_id_index` (`user_id`);

--
-- Indexes for table `shortlists`
--
ALTER TABLE `shortlists`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shortlist_players`
--
ALTER TABLE `shortlist_players`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `skillcorner_json`
--
ALTER TABLE `skillcorner_json`
 ADD PRIMARY KEY (`id`), ADD KEY `skillcorner_json_schedule_id_index` (`schedule_id`), ADD KEY `skillcorner_json_mapping_game_id_index` (`mapping_game_id`), ADD KEY `skillcorner_json_status_index` (`status`);

--
-- Indexes for table `social_connection`
--
ALTER TABLE `social_connection`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `social_connection_handler_pair_unique` (`handler_id1`,`handler_id2`), ADD KEY `social_connection_handler1_index` (`handler_id1`), ADD KEY `social_connection_handler2_index` (`handler_id2`);

--
-- Indexes for table `social_options`
--
ALTER TABLE `social_options`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `social_pages`
--
ALTER TABLE `social_pages`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `social_pages_handler_unique` (`handler`);

--
-- Indexes for table `social_types`
--
ALTER TABLE `social_types`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `social_types_key_unique` (`key`);

--
-- Indexes for table `sports`
--
ALTER TABLE `sports`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `standings`
--
ALTER TABLE `standings`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `standings_unique` (`competition_phase_id`,`competition_team_id`,`source_id`), ADD KEY `standings_competition_id_foreign` (`competition_id`), ADD KEY `standings_competition_team_id_foreign` (`competition_team_id`), ADD KEY `standings_source_id_foreign` (`source_id`);

--
-- Indexes for table `standings_penalties`
--
ALTER TABLE `standings_penalties`
 ADD PRIMARY KEY (`id`), ADD KEY `standings_penalties_competition_team_id_foreign` (`competition_team_id`), ADD KEY `standings_penalties_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `standings_penalties_competition_phase_group_id_foreign` (`competition_phase_group_id`);

--
-- Indexes for table `statbuilt_led_live_page`
--
ALTER TABLE `statbuilt_led_live_page`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `statbuilt_referrer_visit`
--
ALTER TABLE `statbuilt_referrer_visit`
 ADD PRIMARY KEY (`id`), ADD KEY `statbuilt_referrer_visit_referrer_user_id_index` (`referrer_user_id`), ADD KEY `statbuilt_referrer_visit_vistor_ip_index` (`vistor_ip`);

--
-- Indexes for table `statbuilt_saved_styles`
--
ALTER TABLE `statbuilt_saved_styles`
 ADD PRIMARY KEY (`id`), ADD KEY `idx_user_template` (`user_id`,`template_code`);

--
-- Indexes for table `stat_career_lineups`
--
ALTER TABLE `stat_career_lineups`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `player_id1` (`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD KEY `source_id` (`source_id`), ADD KEY `player_id2` (`player_id2`), ADD KEY `player_id3` (`player_id3`), ADD KEY `player_id4` (`player_id4`), ADD KEY `player_id5` (`player_id5`);

--
-- Indexes for table `stat_career_players`
--
ALTER TABLE `stat_career_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `player_id_source_id_unique` (`player_id`,`source_id`), ADD KEY `player_id` (`player_id`), ADD KEY `source_id` (`source_id`);

--
-- Indexes for table `stat_competition_leagues`
--
ALTER TABLE `stat_competition_leagues`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_phase_id_source_id_unique` (`competition_phase_id`,`source_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `source_id` (`source_id`);

--
-- Indexes for table `stat_competition_lineups`
--
ALTER TABLE `stat_competition_lineups`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_id_2` (`competition_id`,`competition_phase_id`,`competition_team_id`,`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `player_id1` (`player_id1`), ADD KEY `player_id2` (`player_id2`), ADD KEY `player_id3` (`player_id3`), ADD KEY `player_id4` (`player_id4`), ADD KEY `player_id5` (`player_id5`);

--
-- Indexes for table `stat_competition_lineup_opponents`
--
ALTER TABLE `stat_competition_lineup_opponents`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_id_2` (`competition_id`,`competition_phase_id`,`competition_team_id`,`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `player_id1` (`player_id1`), ADD KEY `player_id2` (`player_id2`), ADD KEY `player_id3` (`player_id3`), ADD KEY `player_id4` (`player_id4`), ADD KEY `player_id5` (`player_id5`);

--
-- Indexes for table `stat_competition_lineup_opponents_2`
--
ALTER TABLE `stat_competition_lineup_opponents_2`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `competition_id_2` (`competition_id`,`competition_phase_id`,`competition_team_id`,`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `player_id1` (`player_id1`), ADD KEY `player_id2` (`player_id2`), ADD KEY `player_id3` (`player_id3`), ADD KEY `player_id4` (`player_id4`), ADD KEY `player_id5` (`player_id5`);

--
-- Indexes for table `stat_competition_opponents`
--
ALTER TABLE `stat_competition_opponents`
 ADD UNIQUE KEY `id` (`id`), ADD UNIQUE KEY `stat_competition_opponents_unique` (`competition_phase_id`,`competition_team_id`,`source_id`) USING BTREE, ADD KEY `competition_id` (`competition_id`), ADD KEY `stat_competition_opponents_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_opponents_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_players`
--
ALTER TABLE `stat_competition_players`
 ADD UNIQUE KEY `id` (`id`), ADD UNIQUE KEY `stat_competition_players_unique_index` (`competition_id`,`competition_phase_id`,`player_id`,`competition_team_id`,`source_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `stat_competition_players_player_id_index` (`player_id`), ADD KEY `stat_competition_players_player_id_competition_team_id_index` (`player_id`,`competition_team_id`);

--
-- Indexes for table `stat_competition_player_3x3`
--
ALTER TABLE `stat_competition_player_3x3`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_competition_player_3x3_competition_id_foreign` (`competition_id`), ADD KEY `stat_competition_player_3x3_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_player_3x3_player_id_foreign` (`player_id`), ADD KEY `stat_competition_player_3x3_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_player_3x3_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_playtype_defensive_players`
--
ALTER TABLE `stat_competition_playtype_defensive_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_competition_playtype_defensive_players_unique` (`competition_phase_id`,`player_id`,`competition_team_id`,`source_id`,`play_type_id`,`play_type_sub_id`), ADD KEY `scpdp_competition_id_foreign` (`competition_id`), ADD KEY `scpdp_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `scpdp_player_id_foreign` (`player_id`), ADD KEY `scpdp_competition_team_id_foreign` (`competition_team_id`), ADD KEY `scpdp_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_playtype_detail_players`
--
ALTER TABLE `stat_competition_playtype_detail_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `unique_competition_playtype_details_players` (`competition_id`,`competition_phase_id`,`player_id`,`source_id`,`play_type_id`,`play_type_sub_id`,`play_type_detail_id`), ADD KEY `stat_comp_playtype_detail_player_comp_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_playtype_detail_players_player_id_foreign` (`player_id`), ADD KEY `stat_competition_playtype_detail_players_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_playtype_leagues`
--
ALTER TABLE `stat_competition_playtype_leagues`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_competition_playtype_leagues_unique` (`competition_phase_id`,`source_id`,`play_type_sub_id`,`play_type_id`), ADD KEY `stat_competition_playtype_leagues_competition_id_foreign` (`competition_id`), ADD KEY `stat_competition_playtype_leagues_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_playtype_leagues_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_playtype_opponents`
--
ALTER TABLE `stat_competition_playtype_opponents`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_competition_playtype_opponents_unique` (`competition_phase_id`,`competition_team_id`,`play_type_id`,`play_type_sub_id`,`source_id`), ADD KEY `stat_competition_playtype_opponents_competition_id_foreign` (`competition_id`), ADD KEY `stat_competition_playtype_opponents_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_playtype_opponents_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_playtype_opponents_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_playtype_players`
--
ALTER TABLE `stat_competition_playtype_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_competition_playtype_players_unique` (`competition_phase_id`,`player_id`,`competition_team_id`,`source_id`,`play_type_id`,`play_type_sub_id`), ADD KEY `competition_id` (`competition_id`,`source_id`), ADD KEY `source_id` (`source_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `player_id` (`player_id`);

--
-- Indexes for table `stat_competition_playtype_players_horizontal`
--
ALTER TABLE `stat_competition_playtype_players_horizontal`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `scpph_unique` (`competition_phase_id`,`player_id`,`competition_team_id`,`source_id`);

--
-- Indexes for table `stat_competition_playtype_teams`
--
ALTER TABLE `stat_competition_playtype_teams`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_competition_playtype_teams_unique` (`competition_phase_id`,`competition_team_id`,`source_id`,`play_type_id`,`play_type_sub_id`), ADD KEY `stat_competition_playtype_teams_competition_id_foreign` (`competition_id`), ADD KEY `stat_competition_playtype_teams_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_playtype_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_playtype_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_teams`
--
ALTER TABLE `stat_competition_teams`
 ADD UNIQUE KEY `id` (`id`), ADD UNIQUE KEY `stat_competition_teams_unique` (`competition_phase_id`,`competition_team_id`,`source_id`) USING BTREE, ADD KEY `competition_id` (`competition_id`), ADD KEY `stat_competition_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_team_3x3`
--
ALTER TABLE `stat_competition_team_3x3`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_competition_team_3x3_competition_id_foreign` (`competition_id`), ADD KEY `stat_competition_team_3x3_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_team_3x3_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_team_3x3_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_team_hc_transition`
--
ALTER TABLE `stat_competition_team_hc_transition`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_competition_team_hc_transition_unique` (`competition_id`,`competition_phase_id`,`competition_team_id`,`source_id`), ADD KEY `stat_competition_team_hc_transition_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_competition_team_hc_transition_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_competition_team_hc_transition_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_competition_team_hc_transition_opponent`
--
ALTER TABLE `stat_competition_team_hc_transition_opponent`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `unique_hc_trans_opp` (`competition_id`,`competition_phase_id`,`competition_team_id`,`source_id`);

--
-- Indexes for table `stat_competititon_playtype_defense_players`
--
ALTER TABLE `stat_competititon_playtype_defense_players`
 ADD PRIMARY KEY (`id`), ADD KEY `fk_competition_playtype_defense_players_competition` (`competition_id`), ADD KEY `stat_competititon_playtype_defense_players_player_id_foreign` (`player_id`), ADD KEY `fk_competition_playtype_def_players_competition_team` (`competition_team_id`), ADD KEY `stat_competititon_playtype_defense_players_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_drive_competition_opponents`
--
ALTER TABLE `stat_drive_competition_opponents`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_drive_competition_opponents_competition_id_foreign` (`competition_id`), ADD KEY `stat_drive_competition_opponents_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_drive_competition_opponents_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_drive_competition_opponents_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_drive_competition_players`
--
ALTER TABLE `stat_drive_competition_players`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_drive_competition_players_competition_id_foreign` (`competition_id`), ADD KEY `stat_drive_competition_players_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_drive_competition_players_player_id_foreign` (`player_id`), ADD KEY `stat_drive_competition_players_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_drive_competition_players_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_drive_competition_teams`
--
ALTER TABLE `stat_drive_competition_teams`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_drive_competition_teams_competition_id_foreign` (`competition_id`), ADD KEY `stat_drive_competition_teams_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_drive_competition_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_drive_competition_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_drive_game_players`
--
ALTER TABLE `stat_drive_game_players`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_drive_game_players_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_drive_game_players_competition_id_foreign` (`competition_id`), ADD KEY `stat_drive_game_players_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_drive_game_players_player_id_foreign` (`player_id`), ADD KEY `stat_drive_game_players_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_drive_game_players_competition_opponent_id_foreign` (`competition_opponent_id`), ADD KEY `stat_drive_game_players_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_drive_game_teams`
--
ALTER TABLE `stat_drive_game_teams`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_drive_game_teams_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_drive_game_teams_competition_id_foreign` (`competition_id`), ADD KEY `stat_drive_game_teams_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_drive_game_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_drive_game_teams_competition_opponent_id_foreign` (`competition_opponent_id`), ADD KEY `stat_drive_game_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_game_lineups`
--
ALTER TABLE `stat_game_lineups`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `schedule_id_2` (`schedule_id`,`competition_id`,`competition_phase_id`,`competition_team_id`,`competition_opponent_id`,`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD KEY `schedule_id` (`schedule_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `stat_game_lineups_competition_opponent_id_index` (`competition_opponent_id`), ADD KEY `player_id1` (`player_id1`), ADD KEY `player_id2` (`player_id2`), ADD KEY `player_id3` (`player_id3`), ADD KEY `player_id4` (`player_id4`), ADD KEY `player_id5` (`player_id5`);

--
-- Indexes for table `stat_game_lineups_gt`
--
ALTER TABLE `stat_game_lineups_gt`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_game_lineups_gt_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_game_lineups_gt_competition_id_foreign` (`competition_id`), ADD KEY `stat_game_lineups_gt_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_game_lineups_gt_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_game_lineups_gt_competition_opponent_id_foreign` (`competition_opponent_id`), ADD KEY `stat_game_lineups_gt_player_id1_foreign` (`player_id1`), ADD KEY `stat_game_lineups_gt_player_id2_foreign` (`player_id2`), ADD KEY `stat_game_lineups_gt_player_id3_foreign` (`player_id3`), ADD KEY `stat_game_lineups_gt_player_id4_foreign` (`player_id4`), ADD KEY `stat_game_lineups_gt_player_id5_foreign` (`player_id5`), ADD KEY `stat_game_lineups_gt_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_game_lineup_opponents`
--
ALTER TABLE `stat_game_lineup_opponents`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `schedule_id_2` (`schedule_id`,`competition_id`,`competition_phase_id`,`competition_team_id`,`competition_opponent_id`,`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD UNIQUE KEY `schedule_id_3` (`schedule_id`,`competition_id`,`competition_phase_id`,`competition_team_id`,`player_id1`,`player_id2`,`player_id3`,`player_id4`,`player_id5`,`source_id`), ADD KEY `schedule_id` (`schedule_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `stat_game_lineups_competition_opponent_id_index` (`competition_opponent_id`), ADD KEY `player_id1` (`player_id1`), ADD KEY `player_id2` (`player_id2`), ADD KEY `player_id3` (`player_id3`), ADD KEY `player_id4` (`player_id4`), ADD KEY `player_id5` (`player_id5`);

--
-- Indexes for table `stat_game_players`
--
ALTER TABLE `stat_game_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_game_players_unique` (`schedule_id`,`player_id`,`source_id`), ADD KEY `schedule_id` (`schedule_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `player_id` (`player_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `source_id` (`source_id`), ADD KEY `stat_game_players_competition_opponent_id_index` (`competition_opponent_id`), ADD KEY `schedule_id_2` (`schedule_id`,`source_id`,`side`), ADD KEY `competition_phase_source` (`competition_id`,`competition_phase_id`,`source_id`), ADD KEY `phase_source` (`competition_phase_id`,`source_id`);

--
-- Indexes for table `stat_game_players_gt`
--
ALTER TABLE `stat_game_players_gt`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_game_players_gt_unique` (`schedule_id`,`competition_team_id`,`player_id`), ADD KEY `stat_game_players_gt_competition_id_foreign` (`competition_id`), ADD KEY `stat_game_players_gt_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_game_players_gt_player_id_foreign` (`player_id`), ADD KEY `stat_game_players_gt_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_game_players_gt_competition_opponent_id_foreign` (`competition_opponent_id`), ADD KEY `stat_game_players_gt_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_game_player_3x3`
--
ALTER TABLE `stat_game_player_3x3`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_game_player_3x3_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_game_player_3x3_competition_id_foreign` (`competition_id`), ADD KEY `stat_game_player_3x3_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_game_player_3x3_player_id_foreign` (`player_id`), ADD KEY `stat_game_player_3x3_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_game_player_3x3_competition_opponent_id_foreign` (`competition_opponent_id`), ADD KEY `stat_game_player_3x3_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_game_playtype_defensive_players`
--
ALTER TABLE `stat_game_playtype_defensive_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_game_playtype_defensive_players_unique` (`schedule_id`,`player_id`,`play_type_id`,`play_type_sub_id`,`source_id`), ADD KEY `sgpdp_schedule_id_foreign` (`schedule_id`), ADD KEY `sgpdp_competition_id_foreign` (`competition_id`), ADD KEY `sgpdp_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `sgpdp_player_id_foreign` (`player_id`), ADD KEY `sgpdp_competition_team_id_foreign` (`competition_team_id`), ADD KEY `sgpdp_source_id_foreign` (`source_id`), ADD KEY `sgpdp_competition_opponent_id_foreign` (`competition_opponent_id`);

--
-- Indexes for table `stat_game_playtype_players`
--
ALTER TABLE `stat_game_playtype_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_game_playtype_players_unique` (`schedule_id`,`player_id`,`play_type_id`,`play_type_sub_id`,`source_id`), ADD KEY `stat_game_playtype_players_competition_id_foreign` (`competition_id`), ADD KEY `stat_game_playtype_players_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_game_playtype_players_player_id_foreign` (`player_id`), ADD KEY `stat_game_playtype_players_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_game_playtype_players_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_game_playtype_players_source_id_foreign` (`source_id`), ADD KEY `stat_game_playtype_players_competition_opponent_id_index` (`competition_opponent_id`);

--
-- Indexes for table `stat_game_playtype_teams`
--
ALTER TABLE `stat_game_playtype_teams`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_game_playtype_teams_unique` (`schedule_id`,`competition_team_id`,`play_type_id`,`play_type_sub_id`,`source_id`), ADD KEY `stat_game_playtype_teams_competition_id_foreign` (`competition_id`), ADD KEY `stat_game_playtype_teams_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_game_playtype_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_game_playtype_teams_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_game_playtype_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_game_teams`
--
ALTER TABLE `stat_game_teams`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `schedule_id_2` (`schedule_id`,`competition_team_id`,`source_id`), ADD KEY `schedule_id` (`schedule_id`), ADD KEY `competition_id` (`competition_id`), ADD KEY `competition_phase_id` (`competition_phase_id`), ADD KEY `competition_team_id` (`competition_team_id`), ADD KEY `minute` (`minute`), ADD KEY `source_id` (`source_id`), ADD KEY `stat_game_teams_competition_opponent_id_index` (`competition_opponent_id`);

--
-- Indexes for table `stat_game_team_3x3`
--
ALTER TABLE `stat_game_team_3x3`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_game_team_3x3_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_game_team_3x3_competition_id_foreign` (`competition_id`), ADD KEY `stat_game_team_3x3_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_game_team_3x3_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_game_team_3x3_competition_opponent_id_foreign` (`competition_opponent_id`), ADD KEY `stat_game_team_3x3_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_player_vs`
--
ALTER TABLE `stat_player_vs`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `shot` (`competition_phase_id`,`player_id`,`opponent_player_id`,`shot_zone`,`source_id`) COMMENT 'shot', ADD KEY `player_id` (`player_id`) COMMENT 'player_id';

--
-- Indexes for table `stat_possession_summary`
--
ALTER TABLE `stat_possession_summary`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `unique_possession_summary` (`schedule_id`,`competition_id`,`competition_phase_id`,`competition_team_id`,`home_player_id1`,`home_player_id2`,`home_player_id3`,`home_player_id4`,`home_player_id5`,`away_player_id1`,`away_player_id2`,`away_player_id3`,`away_player_id4`,`away_player_id5`,`source_id`), ADD KEY `stat_possession_summary_competition_id_foreign` (`competition_id`), ADD KEY `stat_possession_summary_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_possession_summary_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_possession_summary_home_player_id1_foreign` (`home_player_id1`), ADD KEY `stat_possession_summary_home_player_id2_foreign` (`home_player_id2`), ADD KEY `stat_possession_summary_home_player_id3_foreign` (`home_player_id3`), ADD KEY `stat_possession_summary_home_player_id4_foreign` (`home_player_id4`), ADD KEY `stat_possession_summary_home_player_id5_foreign` (`home_player_id5`), ADD KEY `stat_possession_summary_away_player_id1_foreign` (`away_player_id1`), ADD KEY `stat_possession_summary_away_player_id2_foreign` (`away_player_id2`), ADD KEY `stat_possession_summary_away_player_id3_foreign` (`away_player_id3`), ADD KEY `stat_possession_summary_away_player_id4_foreign` (`away_player_id4`), ADD KEY `stat_possession_summary_away_player_id5_foreign` (`away_player_id5`), ADD KEY `stat_possession_summary_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_reports`
--
ALTER TABLE `stat_reports`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stat_report_parameters`
--
ALTER TABLE `stat_report_parameters`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stat_report_parameter_connections`
--
ALTER TABLE `stat_report_parameter_connections`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_report_id_fk` (`stat_report_id`), ADD KEY `stat_report_parameter_id_fk` (`stat_report_parameter_id`);

--
-- Indexes for table `stat_season_playtype_players`
--
ALTER TABLE `stat_season_playtype_players`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_season_playtype_players_unique` (`season_id`,`source_id`,`player_id`,`play_type_sub_id`,`play_type_id`), ADD KEY `stat_season_playtype_players_season_id_foreign` (`season_id`), ADD KEY `stat_season_playtype_players_player_id_foreign` (`player_id`), ADD KEY `stat_season_playtype_players_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_season_playtype_teams`
--
ALTER TABLE `stat_season_playtype_teams`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `stat_season_playtype_teams_unique` (`season_id`,`club_id`,`source_id`,`play_type_sub_id`,`play_type_id`), ADD KEY `stat_season_playtype_teams_season_id_foreign` (`season_id`), ADD KEY `stat_season_playtype_teams_club_id_foreign` (`club_id`), ADD KEY `stat_season_playtype_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_starttype_competition_opponents`
--
ALTER TABLE `stat_starttype_competition_opponents`
 ADD PRIMARY KEY (`id`), ADD KEY `ssc_opponents_competition_id_fk` (`competition_id`), ADD KEY `ssc_opponents_phase_id_fk` (`competition_phase_id`), ADD KEY `ssc_opponents_team_id_fk` (`competition_team_id`), ADD KEY `stat_starttype_competition_opponents_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_starttype_competition_teams`
--
ALTER TABLE `stat_starttype_competition_teams`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_starttype_competition_teams_competition_id_foreign` (`competition_id`), ADD KEY `stat_starttype_competition_teams_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_starttype_competition_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_starttype_competition_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `stat_starttype_game_teams`
--
ALTER TABLE `stat_starttype_game_teams`
 ADD PRIMARY KEY (`id`), ADD KEY `stat_starttype_game_teams_schedule_id_foreign` (`schedule_id`), ADD KEY `stat_starttype_game_teams_competition_id_foreign` (`competition_id`), ADD KEY `stat_starttype_game_teams_competition_phase_id_foreign` (`competition_phase_id`), ADD KEY `stat_starttype_game_teams_competition_team_id_foreign` (`competition_team_id`), ADD KEY `stat_starttype_game_teams_source_id_foreign` (`source_id`);

--
-- Indexes for table `streak_career_players`
--
ALTER TABLE `streak_career_players`
 ADD PRIMARY KEY (`id`), ADD KEY `streak_career_players_index` (`player_id`,`source_id`);

--
-- Indexes for table `streak_competition_players`
--
ALTER TABLE `streak_competition_players`
 ADD PRIMARY KEY (`id`), ADD KEY `streak_competition_players_index` (`competition_id`,`player_id`,`source_id`);

--
-- Indexes for table `streak_competition_teams`
--
ALTER TABLE `streak_competition_teams`
 ADD PRIMARY KEY (`id`), ADD KEY `streak_competition_teams_index` (`competition_id`,`competition_team_id`,`source_id`);

--
-- Indexes for table `true_highlight_favorites`
--
ALTER TABLE `true_highlight_favorites`
 ADD PRIMARY KEY (`id`), ADD KEY `true_highlight_favorites_user_id_index` (`user_id`), ADD KEY `true_highlight_favorites_true_highlight_group_id_index` (`true_highlight_group_id`);

--
-- Indexes for table `true_highlight_groups`
--
ALTER TABLE `true_highlight_groups`
 ADD PRIMARY KEY (`id`), ADD KEY `true_highlight_groups_user_id_index` (`user_id`);

--
-- Indexes for table `user_formulas`
--
ALTER TABLE `user_formulas`
 ADD PRIMARY KEY (`id`), ADD KEY `user_formulas_user_id_index` (`user_id`);

--
-- Indexes for table `user_interest`
--
ALTER TABLE `user_interest`
 ADD PRIMARY KEY (`id`), ADD KEY `user_interest_interest_id_foreign` (`interest_id`);

--
-- Indexes for table `user_searches`
--
ALTER TABLE `user_searches`
 ADD PRIMARY KEY (`id`), ADD KEY `user_searches_is_favorite_index` (`is_favorite`);

--
-- Indexes for table `user_search_histories`
--
ALTER TABLE `user_search_histories`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_sport`
--
ALTER TABLE `user_sport`
 ADD PRIMARY KEY (`id`), ADD KEY `user_sport_sport_id_foreign` (`sport_id`);

--
-- Indexes for table `user_video_tag_event_tree`
--
ALTER TABLE `user_video_tag_event_tree`
 ADD PRIMARY KEY (`id`), ADD KEY `user_video_tag_event_tree_video_tag_event_tree_id_foreign` (`video_tag_event_tree_id`);

--
-- Indexes for table `varese_rapm`
--
ALTER TABLE `varese_rapm`
 ADD PRIMARY KEY (`id`), ADD KEY `player_id` (`player_id`,`competition_id`);

--
-- Indexes for table `videoplayer_playtype_settings`
--
ALTER TABLE `videoplayer_playtype_settings`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `video_tag_clips`
--
ALTER TABLE `video_tag_clips`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_montages_club_id_foreign` (`club_id`);

--
-- Indexes for table `video_tag_clip_tagging_event`
--
ALTER TABLE `video_tag_clip_tagging_event`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_montage_tagging_event_video_tag_montage_id_foreign` (`video_tag_clip_id`), ADD KEY `video_tag_clip_tagging_event_video_tag_tagging_event_id_foreign` (`video_tag_tagging_event_id`);

--
-- Indexes for table `video_tag_events`
--
ALTER TABLE `video_tag_events`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_events_video_tag_event_tree_id_foreign` (`video_tag_event_tree_id`), ADD KEY `video_tag_events_parent_video_tag_event_id_foreign` (`parent_video_tag_event_id`);

--
-- Indexes for table `video_tag_event_trees`
--
ALTER TABLE `video_tag_event_trees`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_event_trees_club_id_foreign` (`club_id`);

--
-- Indexes for table `video_tag_taggings`
--
ALTER TABLE `video_tag_taggings`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_taggings_video_tag_video_id_foreign` (`video_tag_video_id`), ADD KEY `video_tag_taggings_schedule_id_foreign` (`schedule_id`), ADD KEY `video_tag_taggings_club_id_foreign` (`club_id`);

--
-- Indexes for table `video_tag_tagging_events`
--
ALTER TABLE `video_tag_tagging_events`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_tagging_events_video_tag_tagging_id_foreign` (`video_tag_tagging_id`), ADD KEY `video_tag_tagging_events_video_tag_event_id_foreign` (`video_tag_event_id`), ADD KEY `video_tag_tagging_events_schedule_id_foreign` (`schedule_id`), ADD KEY `video_tag_tagging_events_competition_team_id_foreign` (`competition_team_id`), ADD KEY `video_tag_tagging_events_player_id_foreign` (`player_id`), ADD KEY `video_tag_tagging_events_pbp_id_foreign` (`pbp_id`);

--
-- Indexes for table `video_tag_videos`
--
ALTER TABLE `video_tag_videos`
 ADD PRIMARY KEY (`id`), ADD KEY `video_tag_videos_schedule_id_foreign` (`schedule_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `affiliates`
--
ALTER TABLE `affiliates`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=21;
--
-- AUTO_INCREMENT for table `affiliate_sources`
--
ALTER TABLE `affiliate_sources`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `agents`
--
ALTER TABLE `agents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1190;
--
-- AUTO_INCREMENT for table `arenas`
--
ALTER TABLE `arenas`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `check_duplicities`
--
ALTER TABLE `check_duplicities`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `check_duplicities_results`
--
ALTER TABLE `check_duplicities_results`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `check_results`
--
ALTER TABLE `check_results`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1613585245;
--
-- AUTO_INCREMENT for table `check_stat_table_contents`
--
ALTER TABLE `check_stat_table_contents`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `check_stat_table_content_results`
--
ALTER TABLE `check_stat_table_content_results`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2432;
--
-- AUTO_INCREMENT for table `check_values`
--
ALTER TABLE `check_values`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=128;
--
-- AUTO_INCREMENT for table `cities`
--
ALTER TABLE `cities`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=44711;
--
-- AUTO_INCREMENT for table `clubs`
--
ALTER TABLE `clubs`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=11713;
--
-- AUTO_INCREMENT for table `club_management_columns`
--
ALTER TABLE `club_management_columns`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `club_management_column_values`
--
ALTER TABLE `club_management_column_values`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=18;
--
-- AUTO_INCREMENT for table `coaches`
--
ALTER TABLE `coaches`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `competitions`
--
ALTER TABLE `competitions`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2727;
--
-- AUTO_INCREMENT for table `competition_phases`
--
ALTER TABLE `competition_phases`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4369;
--
-- AUTO_INCREMENT for table `competition_phase_groups`
--
ALTER TABLE `competition_phase_groups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=119;
--
-- AUTO_INCREMENT for table `competition_teams`
--
ALTER TABLE `competition_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=56151;
--
-- AUTO_INCREMENT for table `continents`
--
ALTER TABLE `continents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=209;
--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=23;
--
-- AUTO_INCREMENT for table `highschools`
--
ALTER TABLE `highschools`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `interests`
--
ALTER TABLE `interests`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `leagues`
--
ALTER TABLE `leagues`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=253;
--
-- AUTO_INCREMENT for table `log_skipped_synergy_players`
--
ALTER TABLE `log_skipped_synergy_players`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=15;
--
-- AUTO_INCREMENT for table `mapping_agents`
--
ALTER TABLE `mapping_agents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4689;
--
-- AUTO_INCREMENT for table `mapping_competitions`
--
ALTER TABLE `mapping_competitions`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=25;
--
-- AUTO_INCREMENT for table `mapping_players`
--
ALTER TABLE `mapping_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=10345;
--
-- AUTO_INCREMENT for table `mapping_sources`
--
ALTER TABLE `mapping_sources`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `mapping_teams`
--
ALTER TABLE `mapping_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1297;
--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=200151;
--
-- AUTO_INCREMENT for table `media_categories`
--
ALTER TABLE `media_categories`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=31;
--
-- AUTO_INCREMENT for table `oauth_clients`
--
ALTER TABLE `oauth_clients`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `payment_coupons`
--
ALTER TABLE `payment_coupons`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=21;
--
-- AUTO_INCREMENT for table `payment_credit_purchases`
--
ALTER TABLE `payment_credit_purchases`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=573;
--
-- AUTO_INCREMENT for table `payment_credit_tiers`
--
ALTER TABLE `payment_credit_tiers`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `payment_credit_uses`
--
ALTER TABLE `payment_credit_uses`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=687;
--
-- AUTO_INCREMENT for table `payment_extensions`
--
ALTER TABLE `payment_extensions`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `payment_packages`
--
ALTER TABLE `payment_packages`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `payment_public_items`
--
ALTER TABLE `payment_public_items`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `payment_public_purchases`
--
ALTER TABLE `payment_public_purchases`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=20;
--
-- AUTO_INCREMENT for table `payment_purchasable_modules`
--
ALTER TABLE `payment_purchasable_modules`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `payment_selected_competitions`
--
ALTER TABLE `payment_selected_competitions`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=273;
--
-- AUTO_INCREMENT for table `payment_shipping_prices`
--
ALTER TABLE `payment_shipping_prices`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=172;
--
-- AUTO_INCREMENT for table `pbp`
--
ALTER TABLE `pbp`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=234526969;
--
-- AUTO_INCREMENT for table `pbp_advanced_tags`
--
ALTER TABLE `pbp_advanced_tags`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `pbp_advanced_tag_buttons`
--
ALTER TABLE `pbp_advanced_tag_buttons`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `pbp_advanced_tag_groups`
--
ALTER TABLE `pbp_advanced_tag_groups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `pbp_codes`
--
ALTER TABLE `pbp_codes`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=37;
--
-- AUTO_INCREMENT for table `pbp_event_connections`
--
ALTER TABLE `pbp_event_connections`
MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=69803467;
--
-- AUTO_INCREMENT for table `pbp_event_videos`
--
ALTER TABLE `pbp_event_videos`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35758183;
--
-- AUTO_INCREMENT for table `pbp_schedule`
--
ALTER TABLE `pbp_schedule`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=547715;
--
-- AUTO_INCREMENT for table `pbp_sources`
--
ALTER TABLE `pbp_sources`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `pbp_zone_review`
--
ALTER TABLE `pbp_zone_review`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=451;
--
-- AUTO_INCREMENT for table `phases`
--
ALTER TABLE `phases`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35;
--
-- AUTO_INCREMENT for table `players`
--
ALTER TABLE `players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=265983;
--
-- AUTO_INCREMENT for table `player_agents`
--
ALTER TABLE `player_agents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=18293;
--
-- AUTO_INCREMENT for table `player_ai_data`
--
ALTER TABLE `player_ai_data`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2253;
--
-- AUTO_INCREMENT for table `player_ai_source_ids`
--
ALTER TABLE `player_ai_source_ids`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=12108;
--
-- AUTO_INCREMENT for table `player_bios`
--
ALTER TABLE `player_bios`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=329071;
--
-- AUTO_INCREMENT for table `player_combine_measurements`
--
ALTER TABLE `player_combine_measurements`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3107;
--
-- AUTO_INCREMENT for table `player_merge_decisions`
--
ALTER TABLE `player_merge_decisions`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=81;
--
-- AUTO_INCREMENT for table `player_merge_logs`
--
ALTER TABLE `player_merge_logs`
MODIFY `id` bigint(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=325;
--
-- AUTO_INCREMENT for table `player_salaries`
--
ALTER TABLE `player_salaries`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=896;
--
-- AUTO_INCREMENT for table `player_salary_offers`
--
ALTER TABLE `player_salary_offers`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=515;
--
-- AUTO_INCREMENT for table `playtag_event_types`
--
ALTER TABLE `playtag_event_types`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13;
--
-- AUTO_INCREMENT for table `playtag_game_colors`
--
ALTER TABLE `playtag_game_colors`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=155;
--
-- AUTO_INCREMENT for table `playtag_game_plays`
--
ALTER TABLE `playtag_game_plays`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4017;
--
-- AUTO_INCREMENT for table `playtag_game_play_events`
--
ALTER TABLE `playtag_game_play_events`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35225;
--
-- AUTO_INCREMENT for table `playtag_pbp`
--
ALTER TABLE `playtag_pbp`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=40123;
--
-- AUTO_INCREMENT for table `playtag_plays`
--
ALTER TABLE `playtag_plays`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1401;
--
-- AUTO_INCREMENT for table `playtag_playsets`
--
ALTER TABLE `playtag_playsets`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `playtag_playset_play`
--
ALTER TABLE `playtag_playset_play`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=51;
--
-- AUTO_INCREMENT for table `playtag_schedule_players`
--
ALTER TABLE `playtag_schedule_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2983;
--
-- AUTO_INCREMENT for table `playtag_shares`
--
ALTER TABLE `playtag_shares`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=16;
--
-- AUTO_INCREMENT for table `polar_events`
--
ALTER TABLE `polar_events`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=79;
--
-- AUTO_INCREMENT for table `polar_event_data`
--
ALTER TABLE `polar_event_data`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=867;
--
-- AUTO_INCREMENT for table `polar_players`
--
ALTER TABLE `polar_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=92;
--
-- AUTO_INCREMENT for table `polar_teams`
--
ALTER TABLE `polar_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `report_cache`
--
ALTER TABLE `report_cache`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1036961;
--
-- AUTO_INCREMENT for table `report_player_roles`
--
ALTER TABLE `report_player_roles`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=673;
--
-- AUTO_INCREMENT for table `report_shot_distance`
--
ALTER TABLE `report_shot_distance`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1328;
--
-- AUTO_INCREMENT for table `roster`
--
ALTER TABLE `roster`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=843429;
--
-- AUTO_INCREMENT for table `roster_deleted_players`
--
ALTER TABLE `roster_deleted_players`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=454995;
--
-- AUTO_INCREMENT for table `roster_restored`
--
ALTER TABLE `roster_restored`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=488994;
--
-- AUTO_INCREMENT for table `schedule`
--
ALTER TABLE `schedule`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=647407;
--
-- AUTO_INCREMENT for table `schedule_rounds`
--
ALTER TABLE `schedule_rounds`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=51;
--
-- AUTO_INCREMENT for table `searches`
--
ALTER TABLE `searches`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3295;
--
-- AUTO_INCREMENT for table `seasons`
--
ALTER TABLE `seasons`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=401;
--
-- AUTO_INCREMENT for table `shared_playlists`
--
ALTER TABLE `shared_playlists`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=29;
--
-- AUTO_INCREMENT for table `shooting_chart_guest_histories`
--
ALTER TABLE `shooting_chart_guest_histories`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13;
--
-- AUTO_INCREMENT for table `shooting_chart_user_histories`
--
ALTER TABLE `shooting_chart_user_histories`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=311;
--
-- AUTO_INCREMENT for table `shortlists`
--
ALTER TABLE `shortlists`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=93;
--
-- AUTO_INCREMENT for table `shortlist_players`
--
ALTER TABLE `shortlist_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1031;
--
-- AUTO_INCREMENT for table `skillcorner_json`
--
ALTER TABLE `skillcorner_json`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=625;
--
-- AUTO_INCREMENT for table `social_connection`
--
ALTER TABLE `social_connection`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3637;
--
-- AUTO_INCREMENT for table `social_options`
--
ALTER TABLE `social_options`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=45;
--
-- AUTO_INCREMENT for table `social_pages`
--
ALTER TABLE `social_pages`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3659;
--
-- AUTO_INCREMENT for table `social_types`
--
ALTER TABLE `social_types`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=159;
--
-- AUTO_INCREMENT for table `sports`
--
ALTER TABLE `sports`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=75;
--
-- AUTO_INCREMENT for table `standings`
--
ALTER TABLE `standings`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=104605;
--
-- AUTO_INCREMENT for table `standings_penalties`
--
ALTER TABLE `standings_penalties`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `statbuilt_referrer_visit`
--
ALTER TABLE `statbuilt_referrer_visit`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=103;
--
-- AUTO_INCREMENT for table `statbuilt_saved_styles`
--
ALTER TABLE `statbuilt_saved_styles`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=47;
--
-- AUTO_INCREMENT for table `stat_career_lineups`
--
ALTER TABLE `stat_career_lineups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stat_career_players`
--
ALTER TABLE `stat_career_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=55504631;
--
-- AUTO_INCREMENT for table `stat_competition_leagues`
--
ALTER TABLE `stat_competition_leagues`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=213575;
--
-- AUTO_INCREMENT for table `stat_competition_lineups`
--
ALTER TABLE `stat_competition_lineups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=67900073;
--
-- AUTO_INCREMENT for table `stat_competition_lineup_opponents`
--
ALTER TABLE `stat_competition_lineup_opponents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=67672869;
--
-- AUTO_INCREMENT for table `stat_competition_lineup_opponents_2`
--
ALTER TABLE `stat_competition_lineup_opponents_2`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=87635708;
--
-- AUTO_INCREMENT for table `stat_competition_opponents`
--
ALTER TABLE `stat_competition_opponents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=158859;
--
-- AUTO_INCREMENT for table `stat_competition_players`
--
ALTER TABLE `stat_competition_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5101205;
--
-- AUTO_INCREMENT for table `stat_competition_player_3x3`
--
ALTER TABLE `stat_competition_player_3x3`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1565;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_defensive_players`
--
ALTER TABLE `stat_competition_playtype_defensive_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2554921;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_detail_players`
--
ALTER TABLE `stat_competition_playtype_detail_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=648273;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_leagues`
--
ALTER TABLE `stat_competition_playtype_leagues`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=17721;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_opponents`
--
ALTER TABLE `stat_competition_playtype_opponents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=334283;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_players`
--
ALTER TABLE `stat_competition_playtype_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4264089;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_players_horizontal`
--
ALTER TABLE `stat_competition_playtype_players_horizontal`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=535105;
--
-- AUTO_INCREMENT for table `stat_competition_playtype_teams`
--
ALTER TABLE `stat_competition_playtype_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=336375;
--
-- AUTO_INCREMENT for table `stat_competition_teams`
--
ALTER TABLE `stat_competition_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=207127;
--
-- AUTO_INCREMENT for table `stat_competition_team_3x3`
--
ALTER TABLE `stat_competition_team_3x3`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=353;
--
-- AUTO_INCREMENT for table `stat_competition_team_hc_transition`
--
ALTER TABLE `stat_competition_team_hc_transition`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stat_competition_team_hc_transition_opponent`
--
ALTER TABLE `stat_competition_team_hc_transition_opponent`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stat_competititon_playtype_defense_players`
--
ALTER TABLE `stat_competititon_playtype_defense_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=128877;
--
-- AUTO_INCREMENT for table `stat_drive_competition_opponents`
--
ALTER TABLE `stat_drive_competition_opponents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2275;
--
-- AUTO_INCREMENT for table `stat_drive_competition_players`
--
ALTER TABLE `stat_drive_competition_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=40329;
--
-- AUTO_INCREMENT for table `stat_drive_competition_teams`
--
ALTER TABLE `stat_drive_competition_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2779;
--
-- AUTO_INCREMENT for table `stat_drive_game_players`
--
ALTER TABLE `stat_drive_game_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=90235;
--
-- AUTO_INCREMENT for table `stat_drive_game_teams`
--
ALTER TABLE `stat_drive_game_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35793;
--
-- AUTO_INCREMENT for table `stat_game_lineups`
--
ALTER TABLE `stat_game_lineups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13098593;
--
-- AUTO_INCREMENT for table `stat_game_lineups_gt`
--
ALTER TABLE `stat_game_lineups_gt`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3107795;
--
-- AUTO_INCREMENT for table `stat_game_lineup_opponents`
--
ALTER TABLE `stat_game_lineup_opponents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13095641;
--
-- AUTO_INCREMENT for table `stat_game_players`
--
ALTER TABLE `stat_game_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=20307197;
--
-- AUTO_INCREMENT for table `stat_game_players_gt`
--
ALTER TABLE `stat_game_players_gt`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=28699;
--
-- AUTO_INCREMENT for table `stat_game_player_3x3`
--
ALTER TABLE `stat_game_player_3x3`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7179;
--
-- AUTO_INCREMENT for table `stat_game_playtype_defensive_players`
--
ALTER TABLE `stat_game_playtype_defensive_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=15630329;
--
-- AUTO_INCREMENT for table `stat_game_playtype_players`
--
ALTER TABLE `stat_game_playtype_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=21796047;
--
-- AUTO_INCREMENT for table `stat_game_playtype_teams`
--
ALTER TABLE `stat_game_playtype_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5893005;
--
-- AUTO_INCREMENT for table `stat_game_teams`
--
ALTER TABLE `stat_game_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1519605;
--
-- AUTO_INCREMENT for table `stat_game_team_3x3`
--
ALTER TABLE `stat_game_team_3x3`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1805;
--
-- AUTO_INCREMENT for table `stat_player_vs`
--
ALTER TABLE `stat_player_vs`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=128971985;
--
-- AUTO_INCREMENT for table `stat_possession_summary`
--
ALTER TABLE `stat_possession_summary`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `stat_reports`
--
ALTER TABLE `stat_reports`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=49;
--
-- AUTO_INCREMENT for table `stat_report_parameters`
--
ALTER TABLE `stat_report_parameters`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT for table `stat_report_parameter_connections`
--
ALTER TABLE `stat_report_parameter_connections`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=12;
--
-- AUTO_INCREMENT for table `stat_season_playtype_players`
--
ALTER TABLE `stat_season_playtype_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2891059;
--
-- AUTO_INCREMENT for table `stat_season_playtype_teams`
--
ALTER TABLE `stat_season_playtype_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=281071;
--
-- AUTO_INCREMENT for table `stat_starttype_competition_opponents`
--
ALTER TABLE `stat_starttype_competition_opponents`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=236919;
--
-- AUTO_INCREMENT for table `stat_starttype_competition_teams`
--
ALTER TABLE `stat_starttype_competition_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=239991;
--
-- AUTO_INCREMENT for table `stat_starttype_game_teams`
--
ALTER TABLE `stat_starttype_game_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1905575;
--
-- AUTO_INCREMENT for table `streak_career_players`
--
ALTER TABLE `streak_career_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=100597;
--
-- AUTO_INCREMENT for table `streak_competition_players`
--
ALTER TABLE `streak_competition_players`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4638885;
--
-- AUTO_INCREMENT for table `streak_competition_teams`
--
ALTER TABLE `streak_competition_teams`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=342041;
--
-- AUTO_INCREMENT for table `true_highlight_favorites`
--
ALTER TABLE `true_highlight_favorites`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=245;
--
-- AUTO_INCREMENT for table `true_highlight_groups`
--
ALTER TABLE `true_highlight_groups`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=19;
--
-- AUTO_INCREMENT for table `user_formulas`
--
ALTER TABLE `user_formulas`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13;
--
-- AUTO_INCREMENT for table `user_interest`
--
ALTER TABLE `user_interest`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=22;
--
-- AUTO_INCREMENT for table `user_searches`
--
ALTER TABLE `user_searches`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4255;
--
-- AUTO_INCREMENT for table `user_search_histories`
--
ALTER TABLE `user_search_histories`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=15127;
--
-- AUTO_INCREMENT for table `user_sport`
--
ALTER TABLE `user_sport`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=14;
--
-- AUTO_INCREMENT for table `user_video_tag_event_tree`
--
ALTER TABLE `user_video_tag_event_tree`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1029;
--
-- AUTO_INCREMENT for table `videoplayer_playtype_settings`
--
ALTER TABLE `videoplayer_playtype_settings`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=40;
--
-- AUTO_INCREMENT for table `video_tag_clips`
--
ALTER TABLE `video_tag_clips`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=148;
--
-- AUTO_INCREMENT for table `video_tag_clip_tagging_event`
--
ALTER TABLE `video_tag_clip_tagging_event`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=554;
--
-- AUTO_INCREMENT for table `video_tag_events`
--
ALTER TABLE `video_tag_events`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=495;
--
-- AUTO_INCREMENT for table `video_tag_event_trees`
--
ALTER TABLE `video_tag_event_trees`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT for table `video_tag_taggings`
--
ALTER TABLE `video_tag_taggings`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=219;
--
-- AUTO_INCREMENT for table `video_tag_tagging_events`
--
ALTER TABLE `video_tag_tagging_events`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=102593;
--
-- AUTO_INCREMENT for table `video_tag_videos`
--
ALTER TABLE `video_tag_videos`
MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5067;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `arenas`
--
ALTER TABLE `arenas`
ADD CONSTRAINT `arenas_ibfk_1` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `check_results`
--
ALTER TABLE `check_results`
ADD CONSTRAINT `check_results_ibfk_1` FOREIGN KEY (`check_value_id`) REFERENCES `check_values` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `check_stat_table_content_results`
--
ALTER TABLE `check_stat_table_content_results`
ADD CONSTRAINT `check_stat_table_content_results_ibfk_1` FOREIGN KEY (`check_stat_table_content_id`) REFERENCES `check_stat_table_contents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `competitions`
--
ALTER TABLE `competitions`
ADD CONSTRAINT `competitions_ibfk_1` FOREIGN KEY (`league_id`) REFERENCES `leagues` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `competitions_ibfk_2` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `competition_phases`
--
ALTER TABLE `competition_phases`
ADD CONSTRAINT `competition_phases_ibfk_1` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `competition_phases_ibfk_2` FOREIGN KEY (`phase_id`) REFERENCES `phases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `competition_phase_groups`
--
ALTER TABLE `competition_phase_groups`
ADD CONSTRAINT `competition_phase_groups_ibfk_1` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `competition_teams`
--
ALTER TABLE `competition_teams`
ADD CONSTRAINT `competition_teams_ibfk_1` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `competition_teams_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `competition_teams_ibfk_3` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leagues`
--
ALTER TABLE `leagues`
ADD CONSTRAINT `leagues_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `leagues_ibfk_2` FOREIGN KEY (`continent_id`) REFERENCES `continents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mapping_agents`
--
ALTER TABLE `mapping_agents`
ADD CONSTRAINT `mapping_agents_agent_id_foreign` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`),
ADD CONSTRAINT `mapping_agents_mapping_source_id_foreign` FOREIGN KEY (`mapping_source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `payment_extensions`
--
ALTER TABLE `payment_extensions`
ADD CONSTRAINT `payment_extensions_payment_package_id_foreign` FOREIGN KEY (`payment_package_id`) REFERENCES `payment_packages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_public_items`
--
ALTER TABLE `payment_public_items`
ADD CONSTRAINT `payment_public_items_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `payment_public_items_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payment_public_purchases`
--
ALTER TABLE `payment_public_purchases`
ADD CONSTRAINT `payment_public_purchases_payment_public_item_id_foreign` FOREIGN KEY (`payment_public_item_id`) REFERENCES `payment_public_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pbp`
--
ALTER TABLE `pbp`
ADD CONSTRAINT `pbp_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_1` FOREIGN KEY (`pbp_schedule_id`) REFERENCES `pbp_schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_10` FOREIGN KEY (`home_player4`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_11` FOREIGN KEY (`home_player5`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_12` FOREIGN KEY (`away_player1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_13` FOREIGN KEY (`away_player2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_14` FOREIGN KEY (`away_player3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_15` FOREIGN KEY (`away_player4`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_16` FOREIGN KEY (`away_player5`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_3` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_4` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_5` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_6` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_7` FOREIGN KEY (`home_player1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_8` FOREIGN KEY (`home_player2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_ibfk_9` FOREIGN KEY (`home_player3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `pbp_event_videos`
--
ALTER TABLE `pbp_event_videos`
ADD CONSTRAINT `pbp_event_videos_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_event_videos_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_event_videos_ibfk_3` FOREIGN KEY (`pbp_id`) REFERENCES `pbp` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_event_videos_ibfk_4` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pbp_schedule`
--
ALTER TABLE `pbp_schedule`
ADD CONSTRAINT `pbp_schedule_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `pbp_schedule_ibfk_2` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_agents`
--
ALTER TABLE `player_agents`
ADD CONSTRAINT `player_agents_agent_id_foreign` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`),
ADD CONSTRAINT `player_agents_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`);

--
-- Constraints for table `player_ai_data`
--
ALTER TABLE `player_ai_data`
ADD CONSTRAINT `player_ai_data_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_ai_source_ids`
--
ALTER TABLE `player_ai_source_ids`
ADD CONSTRAINT `player_ai_source_ids_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_combine_measurements`
--
ALTER TABLE `player_combine_measurements`
ADD CONSTRAINT `player_combine_measurements_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`);

--
-- Constraints for table `player_merge_logs`
--
ALTER TABLE `player_merge_logs`
ADD CONSTRAINT `player_merge_logs_ibfk_1` FOREIGN KEY (`bad_player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `player_merge_logs_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `player_merge_logs_ibfk_3` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `player_merge_logs_ibfk_4` FOREIGN KEY (`good_player_id`) REFERENCES `players` (`id`);

--
-- Constraints for table `player_salaries`
--
ALTER TABLE `player_salaries`
ADD CONSTRAINT `player_salaries_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `player_salaries_owner_club_id_foreign` FOREIGN KEY (`owner_club_id`) REFERENCES `clubs` (`id`),
ADD CONSTRAINT `player_salaries_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `player_salaries_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`);

--
-- Constraints for table `player_salary_offers`
--
ALTER TABLE `player_salary_offers`
ADD CONSTRAINT `player_salary_offers_agent_id_foreign` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`),
ADD CONSTRAINT `player_salary_offers_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `player_salary_offers_owner_club_id_foreign` FOREIGN KEY (`owner_club_id`) REFERENCES `clubs` (`id`),
ADD CONSTRAINT `player_salary_offers_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `player_salary_offers_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`);

--
-- Constraints for table `playtag_schedule_players`
--
ALTER TABLE `playtag_schedule_players`
ADD CONSTRAINT `playtag_schedule_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `playtag_schedule_players_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `polar_events`
--
ALTER TABLE `polar_events`
ADD CONSTRAINT `polar_events_polar_team_id_foreign` FOREIGN KEY (`polar_team_id`) REFERENCES `polar_teams` (`id`);

--
-- Constraints for table `polar_event_data`
--
ALTER TABLE `polar_event_data`
ADD CONSTRAINT `polar_event_data_polar_event_id_foreign` FOREIGN KEY (`polar_event_id`) REFERENCES `polar_events` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `polar_event_data_polar_player_id_foreign` FOREIGN KEY (`polar_player_id`) REFERENCES `polar_players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `polar_players`
--
ALTER TABLE `polar_players`
ADD CONSTRAINT `polar_players_polar_team_id_foreign` FOREIGN KEY (`polar_team_id`) REFERENCES `polar_teams` (`id`);

--
-- Constraints for table `report_cache`
--
ALTER TABLE `report_cache`
ADD CONSTRAINT `fk_report_cache_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `report_cache_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`),
ADD CONSTRAINT `report_cache_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `report_cache_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `report_cache_league_id_foreign` FOREIGN KEY (`league_id`) REFERENCES `leagues` (`id`),
ADD CONSTRAINT `report_cache_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`);

--
-- Constraints for table `report_player_roles`
--
ALTER TABLE `report_player_roles`
ADD CONSTRAINT `report_player_roles_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`);

--
-- Constraints for table `roster`
--
ALTER TABLE `roster`
ADD CONSTRAINT `roster_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `roster_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `roster_ibfk_3` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`);

--
-- Constraints for table `roster_restored`
--
ALTER TABLE `roster_restored`
ADD CONSTRAINT `roster_ibfk_1_` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `roster_ibfk_2_` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `roster_ibfk_3_` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`);

--
-- Constraints for table `schedule`
--
ALTER TABLE `schedule`
ADD CONSTRAINT `schedule_away_coach_id_foreign` FOREIGN KEY (`away_coach_id`) REFERENCES `coaches` (`id`),
ADD CONSTRAINT `schedule_home_coach_id_foreign` FOREIGN KEY (`home_coach_id`) REFERENCES `coaches` (`id`),
ADD CONSTRAINT `schedule_ibfk_1` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `schedule_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `schedule_ibfk_3` FOREIGN KEY (`home_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `schedule_ibfk_4` FOREIGN KEY (`away_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `social_connection`
--
ALTER TABLE `social_connection`
ADD CONSTRAINT `social_connection_handler1_fk` FOREIGN KEY (`handler_id1`) REFERENCES `social_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `social_connection_handler2_fk` FOREIGN KEY (`handler_id2`) REFERENCES `social_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `standings`
--
ALTER TABLE `standings`
ADD CONSTRAINT `standings_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `standings_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `standings_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `standings_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `standings_penalties`
--
ALTER TABLE `standings_penalties`
ADD CONSTRAINT `standings_penalties_competition_phase_group_id_foreign` FOREIGN KEY (`competition_phase_group_id`) REFERENCES `competition_phase_groups` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `standings_penalties_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `standings_penalties_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_career_lineups`
--
ALTER TABLE `stat_career_lineups`
ADD CONSTRAINT `stat_career_lineups_ibfk_1` FOREIGN KEY (`player_id1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_career_lineups_ibfk_2` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_career_lineups_ibfk_3` FOREIGN KEY (`player_id3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_career_lineups_ibfk_4` FOREIGN KEY (`player_id4`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_career_lineups_ibfk_5` FOREIGN KEY (`player_id5`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_career_lineups_ibfk_6` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_career_players`
--
ALTER TABLE `stat_career_players`
ADD CONSTRAINT `stat_career_players_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_career_players_ibfk_2` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_leagues`
--
ALTER TABLE `stat_competition_leagues`
ADD CONSTRAINT `stat_competition_leagues_ibfk_1` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_leagues_ibfk_2` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_leagues_ibfk_3` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_lineups`
--
ALTER TABLE `stat_competition_lineups`
ADD CONSTRAINT `stat_competition_lineups_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_4` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_5` FOREIGN KEY (`player_id1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_6` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_7` FOREIGN KEY (`player_id3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_8` FOREIGN KEY (`player_id4`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineups_ibfk_9` FOREIGN KEY (`player_id5`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_lineup_opponents_2`
--
ALTER TABLE `stat_competition_lineup_opponents_2`
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_4` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_5` FOREIGN KEY (`player_id1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_6` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_7` FOREIGN KEY (`player_id3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_8` FOREIGN KEY (`player_id4`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_lineup_opponents_2_ibfk_9` FOREIGN KEY (`player_id5`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_opponents`
--
ALTER TABLE `stat_competition_opponents`
ADD CONSTRAINT `stat_competition_opponents_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_opponents_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_opponents_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_opponents_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_players`
--
ALTER TABLE `stat_competition_players`
ADD CONSTRAINT `stat_competition_players_ibfk_1` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_players_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_players_ibfk_3` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_players_ibfk_4` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_players_ibfk_5` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_player_3x3`
--
ALTER TABLE `stat_competition_player_3x3`
ADD CONSTRAINT `stat_competition_player_3x3_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competition_player_3x3_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_competition_player_3x3_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_competition_player_3x3_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_competition_player_3x3_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_competition_playtype_defensive_players`
--
ALTER TABLE `stat_competition_playtype_defensive_players`
ADD CONSTRAINT `scpdp_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `scpdp_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `scpdp_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `scpdp_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `scpdp_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_competition_playtype_detail_players`
--
ALTER TABLE `stat_competition_playtype_detail_players`
ADD CONSTRAINT `stat_comp_playtype_detail_player_comp_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_detail_players_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_detail_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_detail_players_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_playtype_leagues`
--
ALTER TABLE `stat_competition_playtype_leagues`
ADD CONSTRAINT `stat_competition_playtype_leagues_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competition_playtype_leagues_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_competition_playtype_leagues_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_competition_playtype_opponents`
--
ALTER TABLE `stat_competition_playtype_opponents`
ADD CONSTRAINT `stat_competition_playtype_opponents_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competition_playtype_opponents_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_competition_playtype_opponents_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_competition_playtype_opponents_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_competition_playtype_players`
--
ALTER TABLE `stat_competition_playtype_players`
ADD CONSTRAINT `stat_competition_playtype_players_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_players_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_players_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_players_ibfk_4` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_playtype_players_ibfk_5` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_playtype_teams`
--
ALTER TABLE `stat_competition_playtype_teams`
ADD CONSTRAINT `stat_competition_playtype_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competition_playtype_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_competition_playtype_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_competition_playtype_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_competition_teams`
--
ALTER TABLE `stat_competition_teams`
ADD CONSTRAINT `stat_competition_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_competition_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_competition_team_3x3`
--
ALTER TABLE `stat_competition_team_3x3`
ADD CONSTRAINT `stat_competition_team_3x3_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competition_team_3x3_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_competition_team_3x3_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_competition_team_3x3_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_competition_team_hc_transition`
--
ALTER TABLE `stat_competition_team_hc_transition`
ADD CONSTRAINT `stat_competition_team_hc_transition_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competition_team_hc_transition_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_competition_team_hc_transition_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_competition_team_hc_transition_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_competititon_playtype_defense_players`
--
ALTER TABLE `stat_competititon_playtype_defense_players`
ADD CONSTRAINT `fk_competition_playtype_def_players_competition_team` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `fk_competition_playtype_defense_players_competition` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_competititon_playtype_defense_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_competititon_playtype_defense_players_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_drive_competition_opponents`
--
ALTER TABLE `stat_drive_competition_opponents`
ADD CONSTRAINT `stat_drive_competition_opponents_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_drive_competition_opponents_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_drive_competition_opponents_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_competition_opponents_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_drive_competition_players`
--
ALTER TABLE `stat_drive_competition_players`
ADD CONSTRAINT `stat_drive_competition_players_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_drive_competition_players_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_drive_competition_players_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_competition_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_drive_competition_players_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_drive_competition_teams`
--
ALTER TABLE `stat_drive_competition_teams`
ADD CONSTRAINT `stat_drive_competition_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_drive_competition_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_drive_competition_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_competition_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_drive_game_players`
--
ALTER TABLE `stat_drive_game_players`
ADD CONSTRAINT `stat_drive_game_players_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_drive_game_players_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_game_players_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_drive_game_players_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_game_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_drive_game_players_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_drive_game_players_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_drive_game_teams`
--
ALTER TABLE `stat_drive_game_teams`
ADD CONSTRAINT `stat_drive_game_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_drive_game_teams_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_game_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_drive_game_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_drive_game_teams_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_drive_game_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_game_lineups`
--
ALTER TABLE `stat_game_lineups`
ADD CONSTRAINT `stat_game_lineups_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_lineups_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_10` FOREIGN KEY (`player_id5`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_4` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_5` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_6` FOREIGN KEY (`player_id1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_7` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_8` FOREIGN KEY (`player_id3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineups_ibfk_9` FOREIGN KEY (`player_id4`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_game_lineups_gt`
--
ALTER TABLE `stat_game_lineups_gt`
ADD CONSTRAINT `stat_game_lineups_gt_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_player_id1_foreign` FOREIGN KEY (`player_id1`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_player_id2_foreign` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_player_id3_foreign` FOREIGN KEY (`player_id3`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_player_id4_foreign` FOREIGN KEY (`player_id4`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_player_id5_foreign` FOREIGN KEY (`player_id5`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_game_lineups_gt_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_game_lineup_opponents`
--
ALTER TABLE `stat_game_lineup_opponents`
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_10` FOREIGN KEY (`player_id5`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_11` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_4` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_5` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_6` FOREIGN KEY (`player_id1`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_7` FOREIGN KEY (`player_id2`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_8` FOREIGN KEY (`player_id3`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_lineup_opponents_ibfk_9` FOREIGN KEY (`player_id4`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_game_players`
--
ALTER TABLE `stat_game_players`
ADD CONSTRAINT `stat_game_players_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_players_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_players_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_players_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_players_ibfk_4` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_players_ibfk_5` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_players_ibfk_6` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_game_players_gt`
--
ALTER TABLE `stat_game_players_gt`
ADD CONSTRAINT `stat_game_players_gt_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_game_players_gt_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_players_gt_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_game_players_gt_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_players_gt_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_players_gt_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_game_players_gt_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_game_player_3x3`
--
ALTER TABLE `stat_game_player_3x3`
ADD CONSTRAINT `stat_game_player_3x3_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_game_player_3x3_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_player_3x3_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_game_player_3x3_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_player_3x3_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_player_3x3_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_game_player_3x3_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_game_playtype_defensive_players`
--
ALTER TABLE `stat_game_playtype_defensive_players`
ADD CONSTRAINT `sgpdp_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `sgpdp_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `sgpdp_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `sgpdp_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `sgpdp_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `sgpdp_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `sgpdp_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_game_playtype_players`
--
ALTER TABLE `stat_game_playtype_players`
ADD CONSTRAINT `stat_game_playtype_players_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_game_playtype_players_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_playtype_players_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_game_playtype_players_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_playtype_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_game_playtype_players_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_game_playtype_players_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_game_playtype_teams`
--
ALTER TABLE `stat_game_playtype_teams`
ADD CONSTRAINT `stat_game_playtype_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_game_playtype_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_game_playtype_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_playtype_teams_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_game_playtype_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_game_teams`
--
ALTER TABLE `stat_game_teams`
ADD CONSTRAINT `stat_game_teams_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_teams_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_teams_ibfk_2` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_teams_ibfk_3` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_teams_ibfk_4` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_game_teams_ibfk_5` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_game_team_3x3`
--
ALTER TABLE `stat_game_team_3x3`
ADD CONSTRAINT `stat_game_team_3x3_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_game_team_3x3_competition_opponent_id_foreign` FOREIGN KEY (`competition_opponent_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_team_3x3_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_game_team_3x3_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_game_team_3x3_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_game_team_3x3_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_possession_summary`
--
ALTER TABLE `stat_possession_summary`
ADD CONSTRAINT `stat_possession_summary_away_player_id1_foreign` FOREIGN KEY (`away_player_id1`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_away_player_id2_foreign` FOREIGN KEY (`away_player_id2`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_away_player_id3_foreign` FOREIGN KEY (`away_player_id3`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_away_player_id4_foreign` FOREIGN KEY (`away_player_id4`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_away_player_id5_foreign` FOREIGN KEY (`away_player_id5`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`),
ADD CONSTRAINT `stat_possession_summary_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`),
ADD CONSTRAINT `stat_possession_summary_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `stat_possession_summary_home_player_id1_foreign` FOREIGN KEY (`home_player_id1`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_home_player_id2_foreign` FOREIGN KEY (`home_player_id2`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_home_player_id3_foreign` FOREIGN KEY (`home_player_id3`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_home_player_id4_foreign` FOREIGN KEY (`home_player_id4`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_home_player_id5_foreign` FOREIGN KEY (`home_player_id5`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_possession_summary_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `stat_possession_summary_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `mapping_sources` (`id`);

--
-- Constraints for table `stat_report_parameter_connections`
--
ALTER TABLE `stat_report_parameter_connections`
ADD CONSTRAINT `stat_report_id_fk` FOREIGN KEY (`stat_report_id`) REFERENCES `stat_reports` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_report_parameter_id_fk` FOREIGN KEY (`stat_report_parameter_id`) REFERENCES `stat_report_parameters` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_season_playtype_players`
--
ALTER TABLE `stat_season_playtype_players`
ADD CONSTRAINT `stat_season_playtype_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `stat_season_playtype_players_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`),
ADD CONSTRAINT `stat_season_playtype_players_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_season_playtype_teams`
--
ALTER TABLE `stat_season_playtype_teams`
ADD CONSTRAINT `stat_season_playtype_teams_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`),
ADD CONSTRAINT `stat_season_playtype_teams_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`),
ADD CONSTRAINT `stat_season_playtype_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`);

--
-- Constraints for table `stat_starttype_competition_opponents`
--
ALTER TABLE `stat_starttype_competition_opponents`
ADD CONSTRAINT `ssc_opponents_competition_id_fk` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `ssc_opponents_phase_id_fk` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `ssc_opponents_team_id_fk` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_competition_opponents_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_starttype_competition_teams`
--
ALTER TABLE `stat_starttype_competition_teams`
ADD CONSTRAINT `stat_starttype_competition_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_competition_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_competition_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_competition_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stat_starttype_game_teams`
--
ALTER TABLE `stat_starttype_game_teams`
ADD CONSTRAINT `stat_starttype_game_teams_competition_id_foreign` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_game_teams_competition_phase_id_foreign` FOREIGN KEY (`competition_phase_id`) REFERENCES `competition_phases` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_game_teams_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_game_teams_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `stat_starttype_game_teams_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `pbp_sources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `streak_career_players`
--
ALTER TABLE `streak_career_players`
ADD CONSTRAINT `streak_career_players_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_interest`
--
ALTER TABLE `user_interest`
ADD CONSTRAINT `user_interest_interest_id_foreign` FOREIGN KEY (`interest_id`) REFERENCES `interests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sport`
--
ALTER TABLE `user_sport`
ADD CONSTRAINT `user_sport_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_video_tag_event_tree`
--
ALTER TABLE `user_video_tag_event_tree`
ADD CONSTRAINT `user_video_tag_event_tree_video_tag_event_tree_id_foreign` FOREIGN KEY (`video_tag_event_tree_id`) REFERENCES `video_tag_event_trees` (`id`);

--
-- Constraints for table `video_tag_clips`
--
ALTER TABLE `video_tag_clips`
ADD CONSTRAINT `video_tag_montages_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`);

--
-- Constraints for table `video_tag_clip_tagging_event`
--
ALTER TABLE `video_tag_clip_tagging_event`
ADD CONSTRAINT `video_tag_clip_tagging_event_video_tag_tagging_event_id_foreign` FOREIGN KEY (`video_tag_tagging_event_id`) REFERENCES `video_tag_tagging_events` (`id`),
ADD CONSTRAINT `video_tag_montage_tagging_event_video_tag_montage_id_foreign` FOREIGN KEY (`video_tag_clip_id`) REFERENCES `video_tag_clips` (`id`);

--
-- Constraints for table `video_tag_events`
--
ALTER TABLE `video_tag_events`
ADD CONSTRAINT `video_tag_events_parent_video_tag_event_id_foreign` FOREIGN KEY (`parent_video_tag_event_id`) REFERENCES `video_tag_events` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `video_tag_events_video_tag_event_tree_id_foreign` FOREIGN KEY (`video_tag_event_tree_id`) REFERENCES `video_tag_event_trees` (`id`);

--
-- Constraints for table `video_tag_event_trees`
--
ALTER TABLE `video_tag_event_trees`
ADD CONSTRAINT `video_tag_event_trees_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`);

--
-- Constraints for table `video_tag_taggings`
--
ALTER TABLE `video_tag_taggings`
ADD CONSTRAINT `video_tag_taggings_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`),
ADD CONSTRAINT `video_tag_taggings_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `video_tag_taggings_video_tag_video_id_foreign` FOREIGN KEY (`video_tag_video_id`) REFERENCES `video_tag_videos` (`id`);

--
-- Constraints for table `video_tag_tagging_events`
--
ALTER TABLE `video_tag_tagging_events`
ADD CONSTRAINT `video_tag_tagging_events_competition_team_id_foreign` FOREIGN KEY (`competition_team_id`) REFERENCES `competition_teams` (`id`),
ADD CONSTRAINT `video_tag_tagging_events_pbp_id_foreign` FOREIGN KEY (`pbp_id`) REFERENCES `pbp` (`id`),
ADD CONSTRAINT `video_tag_tagging_events_player_id_foreign` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
ADD CONSTRAINT `video_tag_tagging_events_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
ADD CONSTRAINT `video_tag_tagging_events_video_tag_event_id_foreign` FOREIGN KEY (`video_tag_event_id`) REFERENCES `video_tag_events` (`id`),
ADD CONSTRAINT `video_tag_tagging_events_video_tag_tagging_id_foreign` FOREIGN KEY (`video_tag_tagging_id`) REFERENCES `video_tag_taggings` (`id`);

--
-- Constraints for table `video_tag_videos`
--
ALTER TABLE `video_tag_videos`
ADD CONSTRAINT `video_tag_videos_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
