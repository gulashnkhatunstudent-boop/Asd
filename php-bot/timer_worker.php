<?php
/**
 * timer_worker.php
 * 
 * High-performance state-machine cron worker daemon.
 * Queries db states, applies secure select-for-update lockouts,
 * and handles dispatch timers.
 */

declare(strict_types=1);

// Prevent script timeout for CLI daemon
set_time_limit(0);

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/telegram_api.php';

// Check if run from command line
if (php_sapi_name() !== 'cli') {
    die("This script must be run via the PHP Command Line Interface (CLI)." . PHP_EOL);
}

// Ensure Bot Token is defined
if (!defined('TELEGRAM_BOT_TOKEN')) {
    die("Error: TELEGRAM_BOT_TOKEN is not defined. Ensure config.php is set up." . PHP_EOL);
}

// Initialize API instance
$telegram = new TelegramAPI(TELEGRAM_BOT_TOKEN, $pdo);

// Logging helper
function writeWorkerLog(string $message): void {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/worker.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[{$timestamp}] {$message}" . PHP_EOL, FILE_APPEND);
}

echo "Telegram Funnel Bot Worker Started..." . PHP_EOL;
writeWorkerLog("Worker process started successfully.");

// Endless loop for continuous state resolution
while (true) {
    try {
        // ========================================================
        // 1. RESOLVE STEP 1 USERS (DELAYED SALARY MESSAGE - 10s TIME GAP)
        // ========================================================
        
        // Retrieve batch of candidate records
        $stmt = $pdo->prepare("
            SELECT user_id, first_name 
            FROM users 
            WHERE step = 1 
              AND is_blocked = 0
              AND TIMESTAMPDIFF(SECOND, action_timestamp, NOW()) >= 10
            LIMIT 100
        ");
        $stmt->execute();
        $step1Candidates = $stmt->fetchAll();

        foreach ($step1Candidates as $user) {
            $userId = (int)$user['user_id'];
            $firstName = $user['first_name'];

            // Initialize isolated transaction block
            $pdo->beginTransaction();
            try {
                // Apply strict row locking
                $lockStmt = $pdo->prepare("SELECT step FROM users WHERE user_id = ? FOR UPDATE");
                $lockStmt->execute([$userId]);
                $currentUser = $lockStmt->fetch();

                if ($currentUser && (int)$currentUser['step'] === 1) {
                    // Update state to step 3 first before making Telegram HTTP API call
                    // This mitigates double send hazards if a timeout or duplicate loop occurs
                    $updateStmt = $pdo->prepare("
                        UPDATE users 
                        SET step = 3, action_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                        WHERE user_id = ?
                    ");
                    $updateStmt->execute([$userId]);

                    // Insert trace record to worker log table
                    $logStmt = $pdo->prepare("INSERT INTO worker_logs (user_id, action_type) VALUES (?, 'send_salary_message')");
                    $logStmt->execute([$userId]);

                    $pdo->commit();
                    writeWorkerLog("State Lock: Transformed User {$userId} from Step 1 -> Step 3. Dispatching salary message.");

                    // Dispatch media to user
                    $photoUrl = "https://i.ibb.co/4nYtsQ6z/IMG-20260604-WA0019.jpg";
                    $captionText = "💵➕💰 <b>Start building a supplemental income to your salary or pension today</b>\n\nIts, will you start now or in a year?";
                    
                    $telegram->sendPhoto($userId, $photoUrl, $captionText);
                    writeWorkerLog("Success: Sent Salary Message to User {$userId}");
                } else {
                    // User already transformed via webhook/button click in the interim, safe release
                    $pdo->commit();
                }
            } catch (Exception $txEx) {
                $pdo->rollBack();
                writeWorkerLog("Error handling Step 1 database loop for User {$userId}: " . $txEx->getMessage());
                // Pause slightly on transient exception
                usleep(250000); // 0.25s
            }
        }

        // ========================================================
        // 2. RESOLVE STEP 3 USERS (DELAYED MEDIA GROUP - 5s TIME GAP FROM STEP 3)
        // ========================================================
        $stmt = $pdo->prepare("
            SELECT user_id, first_name 
            FROM users 
            WHERE step = 3 
              AND is_blocked = 0
              AND TIMESTAMPDIFF(SECOND, action_timestamp, NOW()) >= 5
            LIMIT 100
        ");
        $stmt->execute();
        $step3Candidates = $stmt->fetchAll();

        foreach ($step3Candidates as $user) {
            $userId = (int)$user['user_id'];

            $pdo->beginTransaction();
            try {
                $lockStmt = $pdo->prepare("SELECT step FROM users WHERE user_id = ? FOR UPDATE");
                $lockStmt->execute([$userId]);
                $currentUser = $lockStmt->fetch();

                if ($currentUser && (int)$currentUser['step'] === 3) {
                    // Lock state transition first!
                    $updateStmt = $pdo->prepare("
                        UPDATE users 
                        SET step = 4, action_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                        WHERE user_id = ?
                    ");
                    $updateStmt->execute([$userId]);

                    $logStmt = $pdo->prepare("INSERT INTO worker_logs (user_id, action_type) VALUES (?, 'send_media_group')");
                    $logStmt->execute([$userId]);

                    $pdo->commit();
                    writeWorkerLog("State Lock: Transformed User {$userId} from Step 3 -> Step 4. Dispatching Media Group album.");

                    // Assemble the 4 mandatory media links
                    $mediaPhotos = [
                        "https://i.ibb.co/whR6Hdpg/IMG-20260604-WA0015.jpg",
                        "https://i.ibb.co/8QZqWVT/IMG-20260604-WA0018.jpg",
                        "https://i.ibb.co/7JrfWntY/IMG-20260604-WA0016.jpg",
                        "https://i.ibb.co/9kJ5z8sB/IMG-20260604-WA0017.jpg"
                    ];

                    $captionText = "🧿 <b>Activate Code: NEW-1 to join with a welcome bonus!</b>\n\nBest conditions and bonuses already available to you!\n\nClick /START to continue!";

                    $telegram->sendMediaGroup($userId, $mediaPhotos, $captionText);
                    writeWorkerLog("Success: Sent Media Group Album to User {$userId}");
                } else {
                    $pdo->commit();
                }
            } catch (Exception $txEx) {
                $pdo->rollBack();
                writeWorkerLog("Error handling Step 3 database loop for User {$userId}: " . $txEx->getMessage());
                usleep(250000); // 0.25s
            }
        }

    } catch (Exception $globalEx) {
        writeWorkerLog("Critical Error in Worker Loop: " . $globalEx->getMessage());
        echo "Error: " . $globalEx->getMessage() . PHP_EOL;
        // Keep the daemon alive but throttle the loop on heavy schema or database failure
        sleep(5);
    }

    // Standard throttle interval as specified (Sleep 2 seconds between batch cycles)
    sleep(2);
}
