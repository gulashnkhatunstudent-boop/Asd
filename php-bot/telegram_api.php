<?php
/**
 * telegram_api.php
 * 
 * Production-ready cURL based Telegram API Library.
 * Handles retry logic, error parsing, and logging.
 */

declare(strict_types=1);

require_once __DIR__ . '/db_connect.php';

class TelegramAPI {
    private string $botToken;
    private string $apiUrl;
    private ?PDO $pdo;

    public function __construct(string $botToken, ?PDO $pdo = null) {
        $this->botToken = $botToken;
        $this->apiUrl = "https://api.telegram.org/bot" . $this->botToken . "/";
        $this->pdo = $pdo;
    }

    /**
     * Executes a cURL request to the Telegram API with exponential backoff on transient failures.
     */
    private function makeRequest(string $method, array $params = []): array {
        $url = $this->apiUrl . $method;
        $maxAttempts = 3;
        $attempt = 0;
        $backoff = 1; // Start with 1 second delay

        while ($attempt < $maxAttempts) {
            $attempt++;
            $ch = curl_init();
            
            // Set up curl parameters
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt_refresh($ch, false);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 second timeout
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            // Handle connection/curl errors
            if ($response === false) {
                $this->logError("cURL Error on '{$method}' (Attempt {$attempt}): {$curlError}");
                if ($attempt < $maxAttempts) {
                    sleep($backoff);
                    $backoff *= 2; // Exponential backoff: 1, 2, 4 seconds
                    continue;
                }
                throw new Exception("Telegram API cURL Failure: " . $curlError);
            }

            // Parse response
            $result = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->logError("JSON Decode Error on '{$method}' Response (HTTP {$httpCode}): " . json_last_error_msg());
                throw new Exception("Invalid JSON received from Telegram API");
            }

            // Handle successful or expected API responses
            if ($result['ok'] === true) {
                return $result;
            }

            // Handle Telegram API errors (e.g. 403 Forbidden, 400 Bad Request, etc.)
            $errorCode = $result['error_code'] ?? 0;
            $description = $result['description'] ?? 'Unknown Telegram error';

            $this->logError("Telegram API Error on '{$method}': [Code {$errorCode}] {$description}");

            // Handle Bot Blocked situation
            if ($errorCode === 403 || strpos(strtolower($description), 'blocked') !== false) {
                if (isset($params['chat_id']) && $this->pdo) {
                    $this->markUserBlocked((int)$params['chat_id']);
                }
            }

            // Do not retry 400 Bad Request or 403 Forbidden - they are terminal client errors
            if ($errorCode >= 400 && $errorCode < 500) {
                return $result; // Return the parsed error output
            }

            // For server errors (5xx) or rate limits (429), retry if attempts remain
            if ($attempt < $maxAttempts) {
                sleep($backoff);
                $backoff *= 2;
                continue;
            }

            return $result;
        }

        throw new Exception("Telegram API query failed after {$maxAttempts} attempts.");
    }

    /**
     * Send structured text message.
     */
    public function sendMessage(int $chatId, string $text, array $replyMarkup = []): array {
        $params = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true
        ];
        if (!empty($replyMarkup)) {
            $params['reply_markup'] = $replyMarkup;
        }
        return $this->makeRequest('sendMessage', $params);
    }

    /**
     * Send a single photo with caption.
     */
    public function sendPhoto(int $chatId, string $photoUrl, string $caption = '', array $replyMarkup = []): array {
        $params = [
            'chat_id' => $chatId,
            'photo' => $photoUrl,
            'caption' => $caption,
            'parse_mode' => 'HTML'
        ];
        if (!empty($replyMarkup)) {
            $params['reply_markup'] = $replyMarkup;
        }
        return $this->makeRequest('sendPhoto', $params);
    }

    /**
     * Send a group of photos (album).
     */
    public function sendMediaGroup(int $chatId, array $photoUrls, string $captionForFirst = ''): array {
        $media = [];
        foreach ($photoUrls as $index => $url) {
            $item = [
                'type' => 'photo',
                'media' => $url,
            ];
            // Caption is only set on the first item of the media group
            if ($index === 0 && !empty($captionForFirst)) {
                $item['caption'] = $captionForFirst;
                $item['parse_mode'] = 'HTML';
            }
            $media[] = $item;
        }

        $params = [
            'chat_id' => $chatId,
            'media' => $media
        ];
        return $this->makeRequest('sendMediaGroup', $params);
    }

    /**
     * Acknowledge callback queries to clear loader on Telegram client.
     */
    public function answerCallbackQuery(string $callbackQueryId, string $text = '', bool $showAlert = false): array {
        $params = [
            'callback_query_id' => $callbackQueryId
        ];
        if (!empty($text)) {
            $params['text'] = $text;
            $params['show_alert'] = $showAlert;
        }
        return $this->makeRequest('answerCallbackQuery', $params);
    }

    /**
     * Safely updates regional DB to mark a user as blocked.
     */
    private function markUserBlocked(int $userId): void {
        try {
            $stmt = $this->pdo->prepare("UPDATE users SET is_blocked = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?");
            $stmt->execute([$userId]);
            $this->logError("User {$userId} has blocked the bot. Marked as is_blocked = 1 in database.");
        } catch (PDOException $e) {
            $this->logError("Failed to update user {$userId} blocked state: " . $e->getMessage());
        }
    }

    /**
     * Writes messages to standard errors log.
     */
    private function logError(string $message): void {
        $logDir = __DIR__ . '/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        $logFile = $logDir . '/error.log';
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[{$timestamp}] {$message}" . PHP_EOL, FILE_APPEND);
    }
}
