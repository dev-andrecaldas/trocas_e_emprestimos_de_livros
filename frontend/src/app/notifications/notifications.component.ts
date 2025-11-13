import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importe
import { TransactionService } from '../services/transaction.service';
import { AuthService } from '../services/auth.service';

// Crie uma interface melhor para Transaction
export interface Transaction {
  transaction_id: number;
  status: string;
  transaction_type: 'troca' | 'emprestimo';
  book_title: string;
  requester_name: string;
  owner_name: string;
  requester_id: number;
  owner_id: number;
  // Para Trocas
  offered_book_title?: string;
  // Para Regras de Confirmação
  requester_confirmed_receipt: boolean;
  owner_confirmed_receipt: boolean;
  // Para Prazos
  due_date?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule], // Adicione
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  transactions: Transaction[] = [];
  loading = false;
  currentFilter: string = 'pendente';
  currentUserId: number | null = null;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.user_id || user?.id || null;
    
    this.loadTransactions(this.currentFilter);
  }

  loadTransactions(status: string): void {
    this.currentFilter = status;
    this.loading = true;
    
    // Usando o método do backend que filtra por status
    this.transactionService.getMyTransactions(status).subscribe({
      next: (data) => {
        this.transactions = data; 
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erro ao buscar transações:', err);
      }
    });
  }

  // --- Métodos de Ação ---

  accept(id: number): void {
    this.transactionService.acceptTransaction(id).subscribe({
      next: () => {
        alert('Solicitação aceita!');
        this.loadTransactions(this.currentFilter); // Recarrega a lista
      },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  reject(id: number): void {
    this.transactionService.rejectTransaction(id).subscribe({
      next: () => {
        alert('Solicitação recusada.');
        this.loadTransactions(this.currentFilter); // Recarrega a lista
      },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  confirmReceipt(id: number): void {
    this.transactionService.confirmReceipt(id).subscribe({
      next: () => {
        alert('Recebimento confirmado! A outra parte será notificada.');
        this.loadTransactions(this.currentFilter); // Recarrega a lista
      },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }
}