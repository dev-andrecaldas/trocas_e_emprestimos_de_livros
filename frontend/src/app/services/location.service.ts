import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Define a "forma" dos dados que vamos receber
export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Cidade {
  id: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // URL da API oficial do IBGE
  private baseUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades';

  constructor(private http: HttpClient) { }

  // Busca todos os estados
  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.baseUrl}/estados`).pipe(
      // Usamos 'pipe' e 'map' para ordenar os estados por nome, o que é melhor para o usuário
      map(estados => estados.sort((a, b) => a.nome.localeCompare(b.nome)))
    );
  }

  // Busca as cidades de um estado específico pela sua sigla (ex: 'BA')
  getCidades(ufSigla: string): Observable<Cidade[]> {
    return this.http.get<Cidade[]>(`${this.baseUrl}/estados/${ufSigla}/municipios`).pipe(
      map(cidades => cidades.sort((a, b) => a.nome.localeCompare(b.nome)))
    );
  }
}