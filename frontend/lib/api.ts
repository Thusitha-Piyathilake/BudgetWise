const API_BASE_URL = "http://127.0.0.1:8000/api";

// =====================================================
// Dashboard Types
// =====================================================

export type DashboardData = {
    month: string;

    summary: {
        monthly_income: number;
        monthly_expenses: number;
        available_balance: number;
    };

    budget: {
        needs_percentage: number;
        wants_percentage: number;
        savings_percentage: number;

        needs_budget: number;
        wants_budget: number;
        savings_budget: number;

        needs_spent: number;
        wants_spent: number;
        savings_amount: number;
    };

    savings_goals: {
        id: number;
        name: string;
        target_amount: string;
        current_amount: string;
        target_date: string | null;
    }[];

    recent_transactions: {
        id: number;
        type: "income" | "expense";
        description: string | null;
        amount: number;
        date: string;
        category?: string | null;
        category_type?: "need" | "want" | null;
    }[];
};

// =====================================================
// Category Types
// =====================================================

export type Category = {
    id: number;
    user_id: number;
    name: string;
    type: "need" | "want";
    created_at?: string;
    updated_at?: string;
};

export type CategoryResponse = {
    categories: Category[];
};

export type SingleCategoryResponse = {
    message: string;
    category: Category;
};

// =====================================================
// Income Types
// =====================================================

export type Income = {
    id: number;
    user_id: number;
    amount: string;
    source: string;
    date: string;
    created_at?: string;
    updated_at?: string;
};

export type IncomeResponse = {
    incomes: Income[];
};

export type SingleIncomeResponse = {
    message: string;
    income: Income;
};

// =====================================================
// Expense Types
// =====================================================

export type Expense = {
    id: number;
    user_id: number;
    category_id: number;
    amount: string;
    description: string | null;
    date: string;
    category?: Category;
    created_at?: string;
    updated_at?: string;
};

export type ExpenseResponse = {
    expenses: Expense[];
};

export type SingleExpenseResponse = {
    message: string;
    expense: Expense;
};

// =====================================================
// Budget Types
// =====================================================

export type Budget = {
    id: number;
    user_id: number;
    month: string;
    needs_percentage: string;
    wants_percentage: string;
    savings_percentage: string;
    created_at?: string;
    updated_at?: string;
};

export type BudgetResponse = {
    budgets: Budget[];
};

export type SingleBudgetResponse = {
    message: string;
    budget: Budget;
};

// =====================================================
// Common Response Types
// =====================================================

export type DeleteResponse = {
    message: string;
};

// =====================================================
// API Request Helper
// =====================================================

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem("auth_token");

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",

                ...(token
                    ? {
                          Authorization: `Bearer ${token}`,
                      }
                    : {}),

                ...options.headers,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
                "Something went wrong with the API request."
        );
    }

    return data;
}

// =====================================================
// Dashboard API
// =====================================================

export async function getDashboard(): Promise<DashboardData> {
    return apiRequest<DashboardData>("/dashboard");
}

// =====================================================
// Authentication API
// =====================================================

export async function logout(): Promise<{
    message: string;
}> {
    return apiRequest<{ message: string }>("/logout", {
        method: "POST",
    });
}

// =====================================================
// Category API
// =====================================================

export async function getCategories(): Promise<CategoryResponse> {
    return apiRequest<CategoryResponse>("/categories");
}

export async function createCategory(data: {
    name: string;
    type: "need" | "want";
}): Promise<SingleCategoryResponse> {
    return apiRequest<SingleCategoryResponse>(
        "/categories",
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
}

export async function updateCategory(
    id: number,
    data: {
        name: string;
        type: "need" | "want";
    }
): Promise<SingleCategoryResponse> {
    return apiRequest<SingleCategoryResponse>(
        `/categories/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteCategory(
    id: number
): Promise<DeleteResponse> {
    return apiRequest<DeleteResponse>(
        `/categories/${id}`,
        {
            method: "DELETE",
        }
    );
}

// =====================================================
// Income API
// =====================================================

export async function getIncomes(): Promise<IncomeResponse> {
    return apiRequest<IncomeResponse>("/incomes");
}

export async function createIncome(data: {
    amount: number;
    source: string;
    date: string;
}): Promise<SingleIncomeResponse> {
    return apiRequest<SingleIncomeResponse>("/incomes", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateIncome(
    id: number,
    data: {
        amount: number;
        source: string;
        date: string;
    }
): Promise<SingleIncomeResponse> {
    return apiRequest<SingleIncomeResponse>(
        `/incomes/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteIncome(
    id: number
): Promise<DeleteResponse> {
    return apiRequest<DeleteResponse>(
        `/incomes/${id}`,
        {
            method: "DELETE",
        }
    );
}

// =====================================================
// Expense API
// =====================================================

export async function getExpenses(): Promise<ExpenseResponse> {
    return apiRequest<ExpenseResponse>("/expenses");
}

export async function createExpense(data: {
    category_id: number;
    amount: number;
    description: string;
    date: string;
}): Promise<SingleExpenseResponse> {
    return apiRequest<SingleExpenseResponse>(
        "/expenses",
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
}

export async function updateExpense(
    id: number,
    data: {
        category_id: number;
        amount: number;
        description: string;
        date: string;
    }
): Promise<SingleExpenseResponse> {
    return apiRequest<SingleExpenseResponse>(
        `/expenses/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteExpense(
    id: number
): Promise<DeleteResponse> {
    return apiRequest<DeleteResponse>(
        `/expenses/${id}`,
        {
            method: "DELETE",
        }
    );
}

// =====================================================
// Budget API
// =====================================================

export async function getBudgets(): Promise<BudgetResponse> {
    return apiRequest<BudgetResponse>("/budgets");
}

export async function createBudget(data: {
    month: string;
    needs_percentage: number;
    wants_percentage: number;
    savings_percentage: number;
}): Promise<SingleBudgetResponse> {
    return apiRequest<SingleBudgetResponse>(
        "/budgets",
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
}

export async function updateBudget(
    id: number,
    data: {
        month: string;
        needs_percentage: number;
        wants_percentage: number;
        savings_percentage: number;
    }
): Promise<SingleBudgetResponse> {
    return apiRequest<SingleBudgetResponse>(
        `/budgets/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteBudget(
    id: number
): Promise<DeleteResponse> {
    return apiRequest<DeleteResponse>(
        `/budgets/${id}`,
        {
            method: "DELETE",
        }
    );
}