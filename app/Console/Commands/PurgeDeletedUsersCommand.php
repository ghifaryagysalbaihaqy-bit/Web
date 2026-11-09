<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('users:purge-deleted')]
#[Description('Permanently purge users and their stored files whose 3-day deletion grace period has expired.')]
class PurgeDeletedUsersCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking for users scheduled for deletion...');

        $purgedCount = User::purgeExpiredScheduledDeletions();

        if ($purgedCount > 0) {
            $this->info("Successfully purged {$purgedCount} expired user(s) and their stored files.");
        } else {
            $this->info('No expired users pending deletion.');
        }

        return Command::SUCCESS;
    }
}
