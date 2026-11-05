import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoriesResponse,
  CreateTransactionRequest,
  PagedResult,
  Transaction,
  TransactionFilter,
  UpdateTransactionRequest
} from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  getTransactions(filter: TransactionFilter = {}): Observable<PagedResult<Transaction>> {
    let params = new HttpParams();

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.type) {
      params = params.set('type', filter.type);
    }
    if (filter.category && filter.category !== 'All') {
      params = params.set('category', filter.category);
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.page) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize) {
      params = params.set('pageSize', filter.pageSize.toString());
    }
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortDescending !== undefined) {
      params = params.set('sortDescending', filter.sortDescending.toString());
    }

    return this.http.get<PagedResult<Transaction>>(this.apiUrl, { params });
  }

  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  getRecentTransactions(count = 5): Observable<Transaction[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<Transaction[]>(`${this.apiUrl}/recent`, { params });
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`);
  }

  createTransaction(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, request);
  }

  updateTransaction(id: number, request: UpdateTransactionRequest): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, request);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
