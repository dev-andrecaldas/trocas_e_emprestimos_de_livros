import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private apiUrl = 'http://localhost:3000/api/feed'; // ajuste se necessário

  constructor(private http: HttpClient) {}

  getAllPosts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createPost(content: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { content });
  }

  toggleLike(postId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/like`, {});
  }

  addComment(postId: string, text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/comments`, { text });
  }

  getComments(postId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${postId}/comments`);
  }
}
