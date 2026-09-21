<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BudgetController extends Controller
{
    /**
     * Get all budgets for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $budgets = $user->budgets()
            ->latest('month')
            ->get();

        return response()->json([
            'budgets' => $budgets,
        ]);
    }

    /**
     * Create a new monthly budget.
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
            'month' => [
                'required',
                'date_format:Y-m',
                Rule::unique('budgets')->where(function ($query) use ($user) {
                    return $query->where('user_id', $user->id);
                }),
            ],
            'needs_percentage' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
            'wants_percentage' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
            'savings_percentage' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
        ]);

        $totalPercentage =
            $validated['needs_percentage'] +
            $validated['wants_percentage'] +
            $validated['savings_percentage'];

        if ($totalPercentage != 100) {
            return response()->json([
                'message' => 'The budget percentages must add up to 100%.',
                'total_percentage' => $totalPercentage,
            ], 422);
        }

        $budget = $user->budgets()->create($validated);

        return response()->json([
            'message' => 'Budget created successfully',
            'budget' => $budget,
        ], 201);
    }

    /**
     * Update an existing monthly budget.
     */
    public function update(
        Request $request,
        Budget $budget
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($budget->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'month' => [
                'required',
                'date_format:Y-m',
                Rule::unique('budgets')
                    ->where(function ($query) use ($user) {
                        return $query->where('user_id', $user->id);
                    })
                    ->ignore($budget->id),
            ],
            'needs_percentage' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
            'wants_percentage' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
            'savings_percentage' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
        ]);

        $totalPercentage =
            $validated['needs_percentage'] +
            $validated['wants_percentage'] +
            $validated['savings_percentage'];

        if ($totalPercentage != 100) {
            return response()->json([
                'message' => 'The budget percentages must add up to 100%.',
                'total_percentage' => $totalPercentage,
            ], 422);
        }

        $budget->update($validated);

        return response()->json([
            'message' => 'Budget updated successfully',
            'budget' => $budget,
        ]);
    }

    /**
     * Delete an existing monthly budget.
     */
    public function destroy(
        Request $request,
        Budget $budget
    ): JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($budget->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $budget->delete();

        return response()->json([
            'message' => 'Budget deleted successfully',
        ]);
    }
}