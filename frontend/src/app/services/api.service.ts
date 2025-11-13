import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Exemplo: buscar feed
  getFeed(): Observable<any> {
    return this.http.get(`${this.baseUrl}/feed`);
  }

  // Exemplo: buscar livros
  getBooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/books`);
  }

  // Exemplo: login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }
}
