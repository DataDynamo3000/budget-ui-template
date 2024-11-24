import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, ExpenseCriteria, ExpenseUpsertDto, Page } from '../../shared/domain';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly baseUrl = `${environment.apiUrl}/expenses`.replace('/api', '');
  constructor(private http: HttpClient) {}

  // GET: Ausgaben abrufen
  getExpenses(criteria: ExpenseCriteria): Observable<Page<Expense>> {
    const params = new HttpParams({ fromObject: { ...criteria } });
    return this.http.get<Page<Expense>>(this.baseUrl, { params });
  }

  // PUT: Ausgaben erstellen/aktualisieren
  upsertExpense(expense: ExpenseUpsertDto): Observable<Expense> {
    return this.http.put<Expense>(this.baseUrl, expense);
  }

  // DELETE: Ausgaben löschen
  deleteExpense(expenseId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${expenseId}`);
  }
}
