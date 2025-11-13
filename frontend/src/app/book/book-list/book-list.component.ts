import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../services/book.service'; // Adjusted path
import { TransactionService, TransactionPayload } from '../../services/transaction.service'; // Adjusted path
import { AuthService } from '../../services/auth.service'; // Adjusted path

// --- [INÍCIO DAS MUDANÇAS] ---
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 1. Import MatDialog and MatDialogModule
import { OfferBookModalComponent } from '../../offer-book-modal/offer-book-modal.component'; // Subiu DOIS níveis// 2. Import the Modal Component (adjust path if needed)
// --- [FIM DAS MUDANÇAS] ---

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule // <<< 3. ADD MatDialogModule HERE
  ],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  selectedType = '';
  selectedGenre = '';
  userId: number | null = null;

  // --- [INÍCIO DAS MUDANÇAS] ---
  myAvailableBooks: Book[] = []; // <<< 4. Property to store user's books for the modal
  // --- [FIM DAS MUDANÇAS] ---

  constructor(
    private bookService: BookService,
    private transactionService: TransactionService,
    private authService: AuthService,
    public dialog: MatDialog // <<< 5. Inject MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const user = this.authService.getCurrentUser();
    const userIdFromAuth = user?.user_id || user?.id;
    this.userId = userIdFromAuth ? Number(userIdFromAuth) : null;

    this.bookService.getAllBooks().subscribe({
      next: (books: Book[]) => {
        // --- FILTRO DE DISPONIBILIDADE APLICADO AQUI ---
        // Guarda todos os livros recebidos
        const allBooks = books; 
        // Filtra para mostrar apenas os disponíveis na lista principal
        this.books = allBooks.filter(book => book.available === true); 
        // --------------------------------------------------
        
        // Inicializa filteredBooks com os livros disponíveis filtrados
        this.filteredBooks = this.books; 
        this.loading = false;
        
        // Aplica os outros filtros (busca, tipo, gênero) sobre os livros já filtrados por disponibilidade
        this.applyFilters(); 
      },
      error: (err: any) => {
        this.error = 'Erro ao carregar livros.';
        this.loading = false;
      }
    });
    this.loadMyBooks(); // Carrega seus livros para o modal de troca
  }

  // --- [INÍCIO DAS MUDANÇAS] ---
  // <<< 7. Method to load user's books (filtered for trade) >>>
  loadMyBooks(): void {
    if (!this.userId) return; // Only load if user is logged in

    this.bookService.getMyBooks().subscribe({
        next: (myBooks) => {
             // Filter books that are available and the user owns
             this.myAvailableBooks = myBooks.filter(book => book.exchange_available && book.ownerId === this.userId);
        },
        error: (err) => {
            console.error("Erro ao carregar meus livros:", err);
            this.myAvailableBooks = []; // Ensure it's empty on error
        }
    });
  }
  // --- [FIM DAS MUDANÇAS] ---

  // --- Filters ---
  onSearchChange() { this.applyFilters(); }
  onTypeChange() { this.applyFilters(); }
  onGenreChange() { this.applyFilters(); }

    // A função applyFilters NÃO precisa mais filtrar por available, 
  // pois a lista this.books já está pré-filtrada.
  private applyFilters() {
    console.log("Aplicando filtros..."); // Log geral
    const term = this.searchTerm.toLowerCase();
    
    // Começa com a lista de livros já filtrada por available=true
    let tempFilteredBooks = this.books; 

    tempFilteredBooks = tempFilteredBooks.filter(book => {
      const matchesType = !this.selectedType ||
        (this.selectedType === 'emprestimo' && book.loan_available) ||
        (this.selectedType === 'troca' && book.exchange_available);
      
      // --- DEBUG DO GÊNERO ---
      // Converte ambos para minúsculas e remove espaços para comparação robusta
      const normalizedSelectedGenre = this.selectedGenre?.trim().toLowerCase();
      const normalizedBookGenre = book.genre?.trim().toLowerCase();
      
      const matchesGenre = !this.selectedGenre || normalizedBookGenre === normalizedSelectedGenre;
      
      // Loga apenas se um gênero está selecionado, para não poluir o console
      if (this.selectedGenre) { 
          console.log(
              `Livro: "${book.title}" | Gênero Livro: '${book.genre}' (Normalizado: '${normalizedBookGenre}') | Gênero Selecionado: '${this.selectedGenre}' (Normalizado: '${normalizedSelectedGenre}') | Match=${matchesGenre}`
          );
      }
      // --- FIM DO DEBUG ---

      const matchesSearch = !this.searchTerm ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term);

      return matchesType && matchesGenre && matchesSearch;
    });
    
    this.filteredBooks = tempFilteredBooks;
    console.log("Livros após filtro:", this.filteredBooks.length); // Log do resultado
  }


  // --- Loan Request (No changes needed, but improved error handling) ---
  requestLoan(book: Book) {
    if (Number(book.ownerId) === this.userId) return;

    const payload: TransactionPayload = {
      book_id: book.id,
      transaction_type: 'emprestimo'
    };

    this.transactionService.createTransaction(payload).subscribe({
      next: () => alert('Empréstimo solicitado com sucesso!'),
      // <<< Improved Error Handling >>>
      error: (err: any) => alert(`Erro ao solicitar empréstimo: ${err.error?.message || 'Verifique sua conexão.'}`)
    });
  }

  // --- [INÍCIO DAS MUDANÇAS] ---
  // <<< 8. requestExchange completely replaced with modal logic >>>
  requestExchange(bookToReceive: Book) {
    if (Number(bookToReceive.ownerId) === this.userId) return;

    // Check if user has any books to offer
    if (!this.myAvailableBooks || this.myAvailableBooks.length === 0) {
        alert("Você não possui livros disponíveis para oferecer em troca.");
        return;
    }

    // 1. Open the Modal, passing the user's available books
    const dialogRef = this.dialog.open(OfferBookModalComponent, {
      width: '450px',
      data: { myBooks: this.myAvailableBooks } // Send books to the modal
    });

    // 2. Listen for the result when the modal is closed
    dialogRef.afterClosed().subscribe(offeredBookId => {
      // 3. If the user selected a book (offeredBookId is a number)
      if (offeredBookId) {

        // Prevent offering the same book being requested
        if (offeredBookId === bookToReceive.id) {
            alert("Você não pode oferecer o mesmo livro que está tentando receber.");
            return;
        }

        // 4. Build the COMPLETE payload
        const payload: TransactionPayload = {
          book_id: bookToReceive.id,
          transaction_type: 'troca',
          offered_book_id: offeredBookId // Include the offered book ID
        };

        // 5. Send the request to the backend
        this.transactionService.createTransaction(payload).subscribe({
          next: () => alert('Proposta de troca enviada com sucesso!'),
          // <<< Improved Error Handling >>>
          error: (err: any) => alert(`Erro ao solicitar troca: ${err.error?.message || 'Verifique sua conexão.'}`)
        });
      } else {
        console.log('Solicitação de troca cancelada.'); // User closed the modal or clicked cancel
      }
    });
  }
  // --- [FIM DAS MUDANÇAS] ---
}