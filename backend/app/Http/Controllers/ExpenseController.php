<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * Get all expenses belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $expenses = $user->expenses()
            ->with('category')
            ->latest('date')
            ->get();

        return response()->json([
            'expenses' => $expenses,
        ]);
    }

    /**
     * Create a new expense for the authenticated user.
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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
        ]);

        $category = $user->categories()
            ->where('id', $validated['category_id'])
            ->first();

        if (!$category) {
            return response()->json([
                'message' => 'The selected category does not belong to the authenticated user.',
            ], 403);
        }

        $expense = $user->expenses()->create($validated);

        $expense->load('category');

        return response()->json([
            'message' => 'Expense created successfully',
            'expense' => $expense,
        ], 201);
    }

    /**
     * Update an expense belonging to the authenticated user.
     */
    public function update(
        Request $request,
        Expense $expense
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
        ]);

        $category = $user->categories()
            ->where('id', $validated['category_id'])
            ->first();

        if (!$category) {
            return response()->json([
                'message' => 'The selected category does not belong to the authenticated user.',
            ], 403);
        }

        $expense->update($validated);

        $expense->load('category');

        return response()->json([
            'message' => 'Expense updated successfully',
            'expense' => $expense,
        ]);
    }

    /**
     * Delete an expense belonging to the authenticated user.
     */
    public function destroy(
        Request $request,
        Expense $expense
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully',
        ]);
    }
}