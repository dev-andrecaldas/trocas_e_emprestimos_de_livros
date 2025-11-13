import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Book {
  id: number;
  title: string;
  author: string;
  condition: string;
  exchange_available: boolean;
  loan_available: boolean;
  owner_name?: string;
  genre?: string; // incluído
  description?: string;
  available?: boolean;
  year?: number; // incluído
  img?: string;  // incluído
  ownerId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:3000/api/books'; // ajuste se necessário

  constructor(private http: HttpClient) {}

  // Buscar todos os livros (com filtros opcionais)
  getAllBooks(filters?: { search?: string; type?: string; genre?: string }): Observable<Book[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.genre) params = params.set('genre', filters.genre);

    return this.http.get<Book[]>(this.apiUrl, { params });
  }

  // Buscar um livro específico por ID
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  // Criar um novo livro (com token)
  createBook(bookData: any): Observable<Book> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });

    return this.http.post<Book>(this.apiUrl, bookData, { headers });
  }

  // Atualizar um livro existente (com token)
  updateBook(id: number, bookData: any): Observable<Book> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });

    return this.http.put<Book>(`${this.apiUrl}/${id}`, bookData, { headers });
  }

  // Excluir um livro (com token)
  deleteBook(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  // Buscar livros do usuário logado
  getMyBooks(): Observable<Book[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });

    return this.http.get<Book[]>(`${this.apiUrl}/user/my-books`, { headers });
  }
}
