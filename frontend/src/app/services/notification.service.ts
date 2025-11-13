import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';

// Interface para o que vem da API
export interface AppNotification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_id: number;
  created_at: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/api/notifications'; // Cheque sua porta/URL

  // BehaviorSubject "guarda" o valor atual da contagem
  private unreadCount = new BehaviorSubject<number>(0);
  
  // Os componentes vão "ouvir" este Observable
  public unreadCount$ = this.unreadCount.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Busca todas as notificações (lidas ou não)
   */
  getNotifications(is_read?: boolean): Observable<AppNotification[]> {
    let params = {};
    if (is_read === false) {
      params = { is_read: 'false' };
    } else if (is_read === true) {
      params = { is_read: 'true' };
    }
    
    // O backend espera { message: '...', data: [...] }
    return this.http.get<{ message: string, data: AppNotification[] }>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          // Atualiza a contagem de "não lidas" se buscamos por elas
          if (is_read === false) {
            this.unreadCount.next(response.data.length);
          }
        }),
        map(response => response.data) // Retorna apenas o array de dados
      );
  }

  /**
   * Puxa a contagem de "não lidas" para o BehaviorSubject
   */
  fetchUnreadCount(): void {
    this.http.get<{ message: string, data: AppNotification[] }>(this.apiUrl, { params: { is_read: 'false' } })
      .subscribe({
        next: (response) => {
          this.unreadCount.next(response.data.length);
        },
        error: () => {
          this.unreadCount.next(0); // Zera em caso de erro
        }
      });
  }

  /**
   * Marca uma notificação como lida
   */
  markAsRead(id: number): Observable<AppNotification> {
    return this.http.put<{ message: string, data: AppNotification }>(`${this.apiUrl}/${id}/read`, {})
      .pipe(
        tap(() => {
          // Após marcar como lida, atualiza a contagem
          this.fetchUnreadCount();
        }),
        map(response => response.data)
      );
  }
}