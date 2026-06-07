#!/bin/bash
# ----------------------------------------------------
# Telegram Funnel Bot - Worker Watchdog Script
# Keeps timer_worker.php running indefinitely.
# ----------------------------------------------------

echo "Initializing Telegram Bot Watchdog Daemon..."

# Navigate to the script's directory to ensure correct imports
cd "$(dirname "$0")"

# Continuous retry loop
while true
do
    echo "Starting state-machine worker processor (timer_worker.php)..."
    php timer_worker.php
    
    echo "Worker process exited with code $?. Restarting in 2 seconds..."
    sleep 2
done
