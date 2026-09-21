const API_BASE_URL = "http://127.0.0.1:8000/api";

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

export async function getDashboard(): Promise<DashboardData> {
    return apiRequest<DashboardData>("/dashboard");
}