<?php

namespace App\Http\Controllers;

use App\Models\SavingsGoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingsGoalController extends Controller
{
    /**
     * Get all savings goals for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $goals = $user->savingsGoals()
            ->latest()
            ->get();

        return response()->json([
            'savings_goals' => $goals,
        ]);
    }

    /**
     * Create a new savings goal.
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
            'name' => ['required', 'string', 'max:255'],
            'target_amount' => ['required', 'numeric', 'min:0.01'],
            'current_amount' => ['nullable', 'numeric', 'min:0'],
            'target_date' => ['nullable', 'date'],
        ]);

        $currentAmount = $validated['current_amount'] ?? 0;

        if ($currentAmount > $validated['target_amount']) {
            return response()->json([
                'message' => 'Current amount cannot be greater than the target amount.',
            ], 422);
        }

        $validated['current_amount'] = $currentAmount;

        $goal = $user->savingsGoals()->create($validated);

        return response()->json([
            'message' => 'Savings goal created successfully',
            'savings_goal' => $goal,
        ], 201);
    }

    /**
     * Update an existing savings goal.
     */
    public function update(
        Request $request,
        SavingsGoal $savingsGoal
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($savingsGoal->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'target_amount' => ['required', 'numeric', 'min:0.01'],
            'current_amount' => ['required', 'numeric', 'min:0'],
            'target_date' => ['nullable', 'date'],
        ]);

        if ($validated['current_amount'] > $validated['target_amount']) {
            return response()->json([
                'message' => 'Current amount cannot be greater than the target amount.',
            ], 422);
        }

        $savingsGoal->update($validated);

        return response()->json([
            'message' => 'Savings goal updated successfully',
            'savings_goal' => $savingsGoal,
        ]);
    }

    /**
     * Delete an existing savings goal.
     */
    public function destroy(
        Request $request,
        SavingsGoal $savingsGoal
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($savingsGoal->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $savingsGoal->delete();

        return response()->json([
            'message' => 'Savings goal deleted successfully',
        ]);
    }
}