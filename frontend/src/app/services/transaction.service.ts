// Em src/app/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importe HttpHeaders
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Importe o AuthService

export interface TransactionPayload {
  book_id: number;
  transaction_type: 'emprestimo' | 'troca';
  offered_book_id?: number;
  request_message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:3000/api/transactions'; // Cheque sua URL

  constructor(
    private http: HttpClient,
    private authService: AuthService // <<< INJETE O AuthService
  ) {}

  /**
   * Cria uma transação (requer token).
   */
  createTransaction(payload: TransactionPayload): Observable<any> {
    const headers = this.authService.getAuthHeaders(); // <<< PEGA OS HEADERS
    return this.http.post(this.apiUrl, payload, { headers: headers }); // <<< ENVIA OS HEADERS
  }

  /**
   * Busca transações (requer token, pois a rota base usa authenticateToken).
   */
  getMyTransactions(status?: string): Observable<any[]> {
    let httpParams: { [key: string]: string } = {};
    if (status) {
      httpParams['status'] = status;
    }
    const headers = this.authService.getAuthHeaders(); // <<< PEGA OS HEADERS
    return this.http.get<any[]>(this.apiUrl, { params: httpParams, headers: headers }); // <<< ENVIA OS HEADERS
  }

  /**
   * Aceita uma solicitação pendente (requer token).
   */
  acceptTransaction(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders(); // <<< PEGA OS HEADERS
    return this.http.put(`${this.apiUrl}/${id}/accept`, {}, { headers: headers }); // <<< ENVIA OS HEADERS
  }

  /**
   * Recusa uma solicitação pendente (requer token).
   */
  rejectTransaction(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders(); // <<< PEGA OS HEADERS
    return this.http.put(`${this.apiUrl}/${id}/reject`, {}, { headers: headers }); // <<< ENVIA OS HEADERS
  }
  
  /**
   * Cancela uma solicitação (feita pelo solicitante, requer token).
   */
  cancelTransaction(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders(); // <<< PEGA OS HEADERS
    return this.http.delete(`${this.apiUrl}/${id}/cancel`, { headers: headers }); // <<< ENVIA OS HEADERS
  }

  /**
   * Confirma o recebimento de um livro (requer token).
   */
  confirmReceipt(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders(); // <<< PEGA OS HEADERS
    return this.http.put(`${this.apiUrl}/${id}/confirm-receipt`, {}, { headers: headers }); // <<< ENVIA OS HEADERS
  }
}