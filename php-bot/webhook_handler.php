<?php
/**
 * webhook_handler.php
 * 
 * Telegram Webhook Handler.
 * Automatically processes chat member joins, callbacks, and slash commands.
 */

declare(strict_types=1);

// Set content-type to JSON
header('Content-Type: application/json');

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/telegram_api.php';

// Helper function to write to webhook log
function writeWebhookLog(string $message): void {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/webhook.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[{$timestamp}] {$message}" . PHP_EOL, FILE_APPEND);
}

// Get the raw input
$rawInput = file_get_contents('php://input');
if (empty($rawInput)) {
    writeWebhookLog("Warning: Received empty payload.");
    echo json_encode(['ok' => false, 'error' => 'No payload']);
    exit;
}

// Parse request payload
$update = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    writeWebhookLog("Error: Invalid JSON Payload received: " . json_last_error_msg());
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

// Complete request logging for auditing/debugging
writeWebhookLog("Received update: " . json_encode($update));

// Retrieve Bot Token from config
if (!defined('TELEGRAM_BOT_TOKEN')) {
    writeWebhookLog("Error: Bot token is undefined in configuration. Run install.php.");
    echo json_encode(['ok' => false, 'error' => 'System unconfigured']);
    exit;
}

$telegram = new TelegramAPI(TELEGRAM_BOT_TOKEN, $pdo);

try {
    // ----------------------------------------------------
    // CASE 1: USER GROUP/CHANNEL MEMBER STATUS UPDATE (JOIN EVENT)
    // ----------------------------------------------------
    if (isset($update['chat_member'])) {
        $chatMemberUpdate = $update['chat_member'];
        $chatId = (int)$chatMemberUpdate['chat']['id'];
        $newMember = $chatMemberUpdate['new_chat_member'];
        $user = $newMember['user'];
        $status = $newMember['status'];

        $userId = (int)$user['id'];
        $username = $user['username'] ?? null;
        $firstName = $user['first_name'] ?? 'User';

        writeWebhookLog("Processing chat_member update: User ID = {$userId}, Channel ID = {$chatId}, Status = {$status}");

        // Trigger on "member" state (joined)
        if ($status === 'member') {
            // Check if user already exists
            $checkStmt = $pdo->prepare("SELECT user_id, step FROM users WHERE user_id = ?");
            $checkStmt->execute([$userId]);
            $existingUser = $checkStmt->fetch();

            if (!$existingUser) {
                // Safe insert inside a transaction
                $pdo->beginTransaction();
                try {
                    $insertStmt = $pdo->prepare("
                        INSERT INTO users (user_id, username, first_name, step, action_timestamp, is_blocked)
                        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, 0)
                        ON DUPLICATE KEY UPDATE 
                            username = VALUES(username),
                            first_name = VALUES(firstName)
                    ");
                    $insertStmt->execute([$userId, $username, $firstName]);
                    $pdo->commit();
                    
                    writeWebhookLog("Created new user database state: ID = {$userId}, Name = {$firstName}");
                } catch (Exception $dbEx) {
                    $pdo->rollBack();
                    throw $dbEx;
                }

                // Send Welcome Message with bonus button
                $welcomeText = "🎁 <b>Welcome!</b>\n\nClaim your bonus below. 👇";
                $keyboard = [
                    'inline_keyboard' => [[
                        ['text' => '🎁 GET BONUS', 'callback_data' => 'get_bonus']
                    ]]
                ];

                $telegram->sendMessage($userId, $welcomeText, $keyboard);
                writeWebhookLog("Dispatched welcome message to User ID = {$userId}");
            } else {
                writeWebhookLog("User {$userId} already exists in database (Step Reference: {$existingUser['step']}). Ignored duplicate join triggers.");
            }
        }
        
        echo json_encode(['ok' => true]);
        exit;
    }

    // ----------------------------------------------------
    // CASE 2: CALLBACK QUERY (GET BONUS CLICK)
    // ----------------------------------------------------
    if (isset($update['callback_query'])) {
        $callbackQuery = $update['callback_query'];
        $callbackQueryId = $callbackQuery['id'];
        $callbackData = $callbackQuery['data'] ?? '';
        $user = $callbackQuery['from'];
        $userId = (int)$user['id'];

        writeWebhookLog("Processing callback: User ID = {$userId}, Callback Data = {$callbackData}");

        if ($callbackData === 'get_bonus') {
            // Lock and verify user state - Prevent concurrent duplicate triggers or clicking after state changes
            $pdo->beginTransaction();
            try {
                // SELECT FOR UPDATE to handle race conditions gracefully
                $stmt = $pdo->prepare("SELECT step FROM users WHERE user_id = ? FOR UPDATE");
                $stmt->execute([$userId]);
                $userState = $stmt->fetch();

                if (!$userState) {
                    // Create state if missing
                    $firstName = $user['first_name'] ?? 'User';
                    $username = $user['username'] ?? null;
                    $stmtInsert = $pdo->prepare("
                        INSERT INTO users (user_id, username, first_name, step, action_timestamp) 
                        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
                    ");
                    $stmtInsert->execute([$userId, $username, $firstName]);
                    $currentStep = 1;
                } else {
                    $currentStep = (int)$userState['step'];
                }

                if ($currentStep === 1) {
                    // Critical State Transition: Step 1 -> Step 2
                    $updateStmt = $pdo->prepare("
                        UPDATE users 
                        SET step = 2, action_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                        WHERE user_id = ?
                    ");
                    $updateStmt->execute([$userId]);

                    // Log callback interaction
                    $logStmt = $pdo->prepare("
                        INSERT INTO callback_logs (user_id, callback_data) 
                        VALUES (?, 'get_bonus')
                    ");
                    $logStmt->execute([$userId]);

                    $pdo->commit();
                    writeWebhookLog("State lock success. User {$userId} transitioning from Step 1 -> Step 2.");

                    // Acknowledge callback immediately to clear spinner
                    $telegram->answerCallbackQuery($callbackQueryId);

                    // Send Photo #1 with redirect button
                    $photoUrl = "https://i.ibb.co/1Y39dQgM/IMG-20260604-WA0020.jpg";
                    $captionText = "If you're looking for <b>\"quick and easy,\"</b>\nyou're not looking for me.\n\n👛🔄 But if you're ready for the real working system,\nclick <b>READY</b> below⤵️";
                    
                    $keyboard = [
                        'inline_keyboard' => [[
                            ['text' => 'READY BELOW', 'url' => 'https://t.me/Anita_Desai_here']
                        ]]
                    ];

                    $telegram->sendPhoto($userId, $photoUrl, $captionText, $keyboard);
                    writeWebhookLog("Dispatched Bonus conversion photo to user {$userId}");
                } else {
                    // Ignore clicks on outdated states (Double click prevention)
                    $pdo->commit();
                    $telegram->answerCallbackQuery($callbackQueryId, "Bonus already claimed!");
                    writeWebhookLog("Ignored callback: User {$userId} was already in Step {$currentStep}");
                }

            } catch (Exception $txEx) {
                $pdo->rollBack();
                writeWebhookLog("Callback transaction exception rolled back: " . $txEx->getMessage());
                $telegram->answerCallbackQuery($callbackQueryId, "An error occurred. Please try again.");
                throw $txEx;
            }
        } else {
            $telegram->answerCallbackQuery($callbackQueryId);
        }

        echo json_encode(['ok' => true]);
        exit;
    }

    // ----------------------------------------------------
    // CASE 3: STANDARD BOT SLASH COMMANDS / CHAT (START COMMAND)
    // ----------------------------------------------------
    if (isset($update['message'])) {
        $msg = $update['message'];
        $chatId = (int)$msg['chat']['id'];
        $from = $msg['from'] ?? null;
        $text = trim($msg['text'] ?? '');

        if ($from) {
            $userId = (int)$from['id'];
            $username = $from['username'] ?? null;
            $firstName = $from['first_name'] ?? 'User';

            writeWebhookLog("Processing chat message: User ID = {$userId}, Text = '{$text}'");

            // Check for /START or /start commands
            if (strcasecmp($text, '/start') === 0) {
                // Ensure user state is logged in database (if they command-start the bot before completing join/flows)
                $checkStmt = $pdo->prepare("SELECT user_id FROM users WHERE user_id = ?");
                $checkStmt->execute([$userId]);
                if (!$checkStmt->fetch()) {
                    $insertStmt = $pdo->prepare("
                        INSERT INTO users (user_id, username, first_name, step, action_timestamp) 
                        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
                    ");
                    $insertStmt->execute([$userId, $username, $firstName]);
                    writeWebhookLog("Self-start user registered in DB: {$userId}");
                }

                // Send Final Redirect Message
                $redirectText = "👋🏻 <b>I have a quick update for you.</b>\n\nPlease message me privately👉🏻\n\n@Anita_Desai_here";
                $telegram->sendMessage($userId, $redirectText);
                writeWebhookLog("Dispatched /start funnel redirection for user {$userId}");
            }
        }

        echo json_encode(['ok' => true]);
        exit;
    }

    // Unhandled event
    writeWebhookLog("Info: System received an unhandled update structure.");
    echo json_encode(['ok' => true, 'info' => 'Unhandled update type']);

} catch (Exception $ex) {
    writeWebhookLog("Critical Error in Webhook Handler: " . $ex->getMessage());
    echo json_encode(['ok' => false, 'error' => $ex->getMessage()]);
}
