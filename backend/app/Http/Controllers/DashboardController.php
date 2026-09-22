<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | Current Month
        |--------------------------------------------------------------------------
        */

        $currentMonth = now()->format('Y-m');

        /*
        |--------------------------------------------------------------------------
        | Monthly Income
        |--------------------------------------------------------------------------
        */

        $monthlyIncome = $user->incomes()
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | Monthly Expenses
        |--------------------------------------------------------------------------
        */

        $monthlyExpenses = $user->expenses()
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | Available Balance
        |--------------------------------------------------------------------------
        */

        $availableBalance = $monthlyIncome - $monthlyExpenses;

        /*
        |--------------------------------------------------------------------------
        | Budget
        |--------------------------------------------------------------------------
        */

        $budget = $user->budgets()
            ->where('month', $currentMonth)
            ->first();

        $needsPercentage = $budget
            ? (float) $budget->needs_percentage
            : 50.00;

        $wantsPercentage = $budget
            ? (float) $budget->wants_percentage
            : 30.00;

        $savingsPercentage = $budget
            ? (float) $budget->savings_percentage
            : 20.00;

        /*
        |--------------------------------------------------------------------------
        | Budget Amounts
        |--------------------------------------------------------------------------
        */

        $needsBudget = $monthlyIncome * ($needsPercentage / 100);
        $wantsBudget = $monthlyIncome * ($wantsPercentage / 100);
        $savingsBudget = $monthlyIncome * ($savingsPercentage / 100);

        /*
        |--------------------------------------------------------------------------
        | Actual Needs and Wants Spending
        |--------------------------------------------------------------------------
        */

        $needsSpent = $user->expenses()
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->whereHas('category', function ($query) {
                $query->where('type', 'need');
            })
            ->sum('amount');

        $wantsSpent = $user->expenses()
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->whereHas('category', function ($query) {
                $query->where('type', 'want');
            })
            ->sum('amount');

        /*
        |--------------------------------------------------------------------------
        | Savings
        |--------------------------------------------------------------------------
        */

        $savingsAmount = max(
            0,
            $monthlyIncome - $monthlyExpenses
        );

        /*
        |--------------------------------------------------------------------------
        | Savings Goals
        |--------------------------------------------------------------------------
        */

        $savingsGoals = $user->savingsGoals()
            ->latest()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Recent Transactions
        |--------------------------------------------------------------------------
        */

        $recentIncomes = $user->incomes()
            ->latest('date')
            ->take(5)
            ->get()
            ->map(function ($income) {
                return [
                    'id' => $income->id,
                    'type' => 'income',
                    'description' => $income->source,
                    'amount' => (float) $income->amount,
                    'date' => $income->date,
                ];
            });

        $recentExpenses = $user->expenses()
            ->with('category')
            ->latest('date')
            ->take(5)
            ->get()
            ->map(function ($expense) {
                return [
                    'id' => $expense->id,
                    'type' => 'expense',
                    'description' => $expense->description,
                    'amount' => (float) $expense->amount,
                    'date' => $expense->date,
                    'category' => $expense->category?->name,
                    'category_type' => $expense->category?->type,
                ];
            });

        $recentTransactions = $recentIncomes
            ->concat($recentExpenses)
            ->sortByDesc('date')
            ->take(5)
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Analytics - Income vs Expense
        |--------------------------------------------------------------------------
        |
        | Uses the same current-month values already calculated above.
        | This does not change the existing calculations.
        |
        */

        $incomeVsExpense = [
            'income' => (float) $monthlyIncome,
            'expenses' => (float) $monthlyExpenses,
        ];

        /*
        |--------------------------------------------------------------------------
        | Analytics - Expense By Category
        |--------------------------------------------------------------------------
        |
        | Gets current-month expenses grouped by category.
        |
        */

        $expenseByCategory = $user->expenses()
            ->with('category')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->get()
            ->groupBy(function ($expense) {
                return $expense->category?->name ?? 'Uncategorized';
            })
            ->map(function ($expenses, $categoryName) {
                return [
                    'category' => $categoryName,
                    'amount' => round(
                        $expenses->sum('amount'),
                        2
                    ),
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Analytics - Monthly Income vs Expense Trend
        |--------------------------------------------------------------------------
        |
        | Provides the current month and previous 5 months.
        |
        */

        $monthlyTrend = collect();

        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $month = $monthDate->format('Y-m');

            $income = $user->incomes()
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month])
                ->sum('amount');

            $expenses = $user->expenses()
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month])
                ->sum('amount');

            $monthlyTrend->push([
                'month' => $month,
                'income' => (float) $income,
                'expenses' => (float) $expenses,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'month' => $currentMonth,

            'summary' => [
                'monthly_income' => (float) $monthlyIncome,
                'monthly_expenses' => (float) $monthlyExpenses,
                'available_balance' => (float) $availableBalance,
            ],

            'budget' => [
                'needs_percentage' => $needsPercentage,
                'wants_percentage' => $wantsPercentage,
                'savings_percentage' => $savingsPercentage,

                'needs_budget' => round($needsBudget, 2),
                'wants_budget' => round($wantsBudget, 2),
                'savings_budget' => round($savingsBudget, 2),

                'needs_spent' => (float) $needsSpent,
                'wants_spent' => (float) $wantsSpent,
                'savings_amount' => round($savingsAmount, 2),
            ],

            /*
            |--------------------------------------------------------------------------
            | Analytics
            |--------------------------------------------------------------------------
            */

            'analytics' => [
                'income_vs_expense' => $incomeVsExpense,

                'expense_by_category' => $expenseByCategory,

                'monthly_trend' => $monthlyTrend,
            ],

            'savings_goals' => $savingsGoals,

            'recent_transactions' => $recentTransactions,
        ]);
    }
}