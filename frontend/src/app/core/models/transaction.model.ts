export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  transactionDate: string;
  createdAtUtc: string;
}

export interface CreateTransactionRequest {
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  transactionDate: string;
}

export interface UpdateTransactionRequest {
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  transactionDate: string;
}

export interface TransactionFilter {
  search?: string;
  type?: TransactionType | '';
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CategoriesResponse {
  income: string[];
  expense: string[];
}
