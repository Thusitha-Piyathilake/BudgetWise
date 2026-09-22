<?php

namespace App\Console\Commands;

use App\Models\RecurringTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessRecurringTransactions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'recurring:process';

    /**
     * The console command description.
     */
    protected $description = 'Process due recurring transactions';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();

        $recurringTransactions = RecurringTransaction::query()
            ->where('is_active', true)
            ->whereNotNull('next_occurrence')
            ->where('next_occurrence', '<=', $now)
            ->get();

        if ($recurringTransactions->isEmpty()) {
            $this->info('No recurring transactions are due.');
            return self::SUCCESS;
        }

        $processedCount = 0;

        foreach ($recurringTransactions as $recurringTransaction) {
            DB::transaction(function () use (
                $recurringTransaction,
                $now,
                &$processedCount
            ) {
                $nextOccurrence = $recurringTransaction->next_occurrence
                    ? $recurringTransaction->next_occurrence->copy()
                    : $now->copy();

                /*
                 * Process every missed occurrence.
                 *
                 * This is useful if the application was not running
                 * on the exact date a recurring transaction was due.
                 */
                while ($nextOccurrence->lessThanOrEqualTo($now)) {
                    if ($recurringTransaction->type === 'expense') {
                        $recurringTransaction
                            ->user
                            ->expenses()
                            ->create([
                                'category_id' => $recurringTransaction->category_id,
                                'amount' => $recurringTransaction->amount,
                                'description' => $recurringTransaction->description,
                                'date' => $nextOccurrence->toDateString(),
                            ]);
                    } elseif ($recurringTransaction->type === 'income') {
                        $recurringTransaction
                            ->user
                            ->incomes()
                            ->create([
                                'amount' => $recurringTransaction->amount,
                                'source' => $recurringTransaction->source
                                    ?? $recurringTransaction->description
                                    ?? 'Recurring Income',
                                'date' => $nextOccurrence->toDateString(),
                            ]);
                    }

                    $processedCount++;

                    $nextOccurrence = $this->calculateNextOccurrence(
                        $nextOccurrence,
                        $recurringTransaction->frequency
                    );
                }

                $recurringTransaction->update([
                    'next_occurrence' => $nextOccurrence,
                ]);
            });
        }

        $this->info(
            "Processed {$processedCount} recurring transaction occurrence(s)."
        );

        return self::SUCCESS;
    }

    /**
     * Calculate the next occurrence based on the frequency.
     */
    private function calculateNextOccurrence(
        $date,
        string $frequency
    ) {
        return match ($frequency) {
            'daily' => $date->copy()->addDay(),

            'weekly' => $date->copy()->addWeek(),

            'monthly' => $date->copy()->addMonthNoOverflow(),

            'yearly' => $date->copy()->addYearNoOverflow(),

            default => throw new \InvalidArgumentException(
                "Unsupported recurring transaction frequency: {$frequency}"
            ),
        };
    }
}