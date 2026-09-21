<?php

namespace App\Http\Controllers;

use App\Models\Income;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    /**
     * Get all incomes belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $incomes = $user->incomes()
            ->latest('date')
            ->get();

        return response()->json([
            'incomes' => $incomes,
        ]);
    }

    /**
     * Create a new income for the authenticated user.
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
            'amount' => ['required', 'numeric', 'min:0.01'],
            'source' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
        ]);

        $income = $user->incomes()->create($validated);

        return response()->json([
            'message' => 'Income created successfully',
            'income' => $income,
        ], 201);
    }

    /**
     * Update an income belonging to the authenticated user.
     */
    public function update(
        Request $request,
        Income $income
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($income->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'source' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
        ]);

        $income->update($validated);

        return response()->json([
            'message' => 'Income updated successfully',
            'income' => $income,
        ]);
    }

    /**
     * Delete an income belonging to the authenticated user.
     */
    public function destroy(
        Request $request,
        Income $income
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($income->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $income->delete();

        return response()->json([
            'message' => 'Income deleted successfully',
        ]);
    }
}