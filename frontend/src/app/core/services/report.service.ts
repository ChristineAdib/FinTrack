import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoryBreakdown,
  FinancialSummary,
  MonthlyTrend,
  ReportFilter
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  private buildParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.period) {
      params = params.set('period', filter.period);
    }
    if (filter.year) {
      params = params.set('year', filter.year.toString());
    }
    return params;
  }

  getSummary(filter: ReportFilter = {}): Observable<FinancialSummary> {
    const params = this.buildParams(filter);
    return this.http.get<FinancialSummary>(`${this.apiUrl}/summary`, { params });
  }

  getExpenseBreakdown(filter: ReportFilter = {}): Observable<CategoryBreakdown[]> {
    const params = this.buildParams(filter);
    return this.http.get<CategoryBreakdown[]>(`${this.apiUrl}/expense-breakdown`, { params });
  }

  getMonthlyTrend(filter: ReportFilter = {}): Observable<MonthlyTrend[]> {
    const params = this.buildParams(filter);
    return this.http.get<MonthlyTrend[]>(`${this.apiUrl}/monthly-trend`, { params });
  }
}
