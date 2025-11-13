import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule

// Imports do Angular Material (necessários)
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

// Importe sua interface Book
import { Book } from '../services/book.service';

// Interface para os dados que o modal recebe
export interface OfferBookData {
  myBooks: Book[];
}

@Component({
  selector: 'app-offer-book-modal',
  standalone: true,
  imports: [
    CommonModule, // Adicione CommonModule
    MatDialogModule, 
    MatButtonModule,
    MatListModule 
  ],
  templateUrl: './offer-book-modal.component.html',
  styleUrls: ['./offer-book-modal.component.scss']
})
export class OfferBookModalComponent {
  selectedBookId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<OfferBookModalComponent>,
    // Injeta os dados (lista de livros) enviados pelo BookListComponent
    @Inject(MAT_DIALOG_DATA) public data: OfferBookData 
  ) {}

  // Fecha o modal sem retornar nada (Cancelar)
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Guarda o ID do livro selecionado
  selectBook(bookId: number): void {
    this.selectedBookId = bookId;
  }
}