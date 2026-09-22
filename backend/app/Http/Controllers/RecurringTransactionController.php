<?php

namespace App\Http\Controllers;

use App\Models\RecurringTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringTransactionController extends Controller
{
    /**
     * Get all recurring transactions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $recurringTransactions = $user->recurringTransactions()
            ->with('category')
            ->latest()
            ->get();

        return response()->json([
            'recurring_transactions' => $recurringTransactions,
        ]);
    }

    /**
     * Create a new recurring transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validated = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:255'],
            'frequency' => [
                'required',
                'in:daily,weekly,monthly,yearly',
            ],
            'start_date' => ['required', 'date'],
            'next_occurrence' => ['required', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        /*
         * If a category is provided, make sure it belongs
         * to the authenticated user.
         */
        if (!empty($validated['category_id'])) {
            $categoryBelongsToUser = $user->categories()
                ->where('id', $validated['category_id'])
                ->exists();

            if (!$categoryBelongsToUser) {
                return response()->json([
                    'message' => 'The selected category does not belong to you.',
                ], 403);
            }
        }

        /*
         * Income transactions do not require a category.
         * Expense transactions can optionally have one.
         */
        if ($validated['type'] === 'income') {
            $validated['category_id'] = null;
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        $recurringTransaction = $user->recurringTransactions()
            ->create($validated);

        $recurringTransaction->load('category');

        return response()->json([
            'message' => 'Recurring transaction created successfully',
            'recurring_transaction' => $recurringTransaction,
        ], 201);
    }

    /**
     * Update an existing recurring transaction.
     */
    public function update(
        Request $request,
        RecurringTransaction $recurringTransaction
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($recurringTransaction->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:255'],
            'frequency' => [
                'required',
                'in:daily,weekly,monthly,yearly',
            ],
            'start_date' => ['required', 'date'],
            'next_occurrence' => ['required', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        /*
         * Make sure the selected category belongs
         * to the authenticated user.
         */
        if (!empty($validated['category_id'])) {
            $categoryBelongsToUser = $user->categories()
                ->where('id', $validated['category_id'])
                ->exists();

            if (!$categoryBelongsToUser) {
                return response()->json([
                    'message' => 'The selected category does not belong to you.',
                ], 403);
            }
        }

        /*
         * Income transactions do not need a category.
         */
        if ($validated['type'] === 'income') {
            $validated['category_id'] = null;
        }

        $recurringTransaction->update($validated);

        $recurringTransaction->load('category');

        return response()->json([
            'message' => 'Recurring transaction updated successfully',
            'recurring_transaction' => $recurringTransaction,
        ]);
    }

    /**
     * Delete a recurring transaction.
     */
    public function destroy(
        Request $request,
        RecurringTransaction $recurringTransaction
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($recurringTransaction->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $recurringTransaction->delete();

        return response()->json([
            'message' => 'Recurring transaction deleted successfully',
        ]);
    }

    /**
     * Activate or deactivate a recurring transaction.
     */
    public function toggle(
        Request $request,
        RecurringTransaction $recurringTransaction
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($recurringTransaction->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $recurringTransaction->update([
            'is_active' => !$recurringTransaction->is_active,
        ]);

        return response()->json([
            'message' => $recurringTransaction->is_active
                ? 'Recurring transaction activated successfully'
                : 'Recurring transaction deactivated successfully',
            'recurring_transaction' => $recurringTransaction,
        ]);
    }
}