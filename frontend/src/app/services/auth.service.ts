import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, map } from 'rxjs'; // Importações corretas

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/auth';

  // --- [Lógica Reativa] ---
  private currentUserSubject: BehaviorSubject<any | null>;
  public currentUser$: Observable<any | null>;
  public isLoggedIn$: Observable<boolean>;
  // --- [FIM] ---

  constructor(private http: HttpClient) {
    // --- [Inicialização Reativa] ---
    this.currentUserSubject = new BehaviorSubject<any | null>(this.getCurrentUser());
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoggedIn$ = this.currentUser$.pipe(
      map(user => !!user)
    );
    // --- [FIM] ---
  }

  // =======================
  // AUTENTICAÇÃO
  // =======================
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((res: any) => {
          if (res.token && res.user) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.currentUserSubject.next(res.user); // Notifica mudança
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null); // Notifica mudança
  }

  // =======================
  // PERFIL (Sem mudanças)
  // =======================
  getUserProfile(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/profile`, { headers });
  }

  updateUserProfile(profileData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/profile`, profileData, { headers });
  }

  changePassword(passwords: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/change-password`, passwords, { headers });
  }

  deleteAccount(password: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const options = {
      headers: headers,
      body: { password }
    };
    return this.http.delete(`${this.apiUrl}/profile`, options);
  }

  // =======================
  // MÉTODOS AUXILIARES
  // =======================
  
  // --- CORREÇÃO APLICADA AQUI ---
  // Torna o método público para ser usado por outros serviços
  getAuthHeaders(): HttpHeaders { // <<< REMOVIDO 'private'
    const token = localStorage.getItem('token');
    // Retorna vazio se não houver token, para evitar erros no backend
    if (!token) {
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  // --- FIM DA CORREÇÃO ---

  // Retorna o usuário logado localmente
  getCurrentUser(): any {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  // Retorna se o usuário está logado (sincronamente)
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}