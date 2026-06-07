<?php
/**
 * db_connect.php
 * 
 * Secure DB Connection layer using PDO.
 * Part of the Enterprise Telegram Funnel Bot System.
 */

declare(strict_types=1);

// We require the config file which contains database credentials
$config_path = __DIR__ . '/config.php';

if (!file_exists($config_path)) {
    // If running in development/installation mode, don't crash entirely here
    // but allow the installer to function.
    if (basename($_SERVER['PHP_SELF']) !== 'install.php') {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => 'System is not configured. Please run install.php first.'
        ]);
        exit;
    }
} else {
    require_once $config_path;
}

try {
    // Construct PDO with proper UTF-8 charset
    $dsn = sprintf(
        "mysql:host=%s;dbname=%s;charset=utf8mb4",
        DB_HOST,
        DB_NAME
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // True prepared statements for security
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // Secure logging: Do not leak database credentials in output error
    error_log("Database Connection Failed: " . $e->getMessage());
    
    if (basename($_SERVER['PHP_SELF']) !== 'install.php') {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => 'Database connection failed. Please check error.log.'
        ]);
        exit;
    }
}
