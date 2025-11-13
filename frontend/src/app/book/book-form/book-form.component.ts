import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BookService, Book } from '../../services/book.service'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss']
})
export class BookFormComponent implements OnInit {
  // Use Input() com setter para garantir que userId seja número ou null
  private _userId: number | null = null;
  @Input() 
  set userId(value: number | string | null | undefined) {
      this._userId = (value !== null && value !== undefined && !isNaN(Number(value))) ? Number(value) : null;
  } 
  get userId(): number | null {
      return this._userId;
  }

  @Output() bookCreated = new EventEmitter<Book>();
  @Output() closeForm = new EventEmitter<void>();

  bookForm!: FormGroup;
  loading = false;
  success: string | null = null;
  error: string | null = null;
  errorDetails: string[] = []; // Para detalhes da validação do backend

  // <<< MUDANÇA: Lista de gêneros para o <select> >>>
  genres = ['Ficção', 'Romance', 'Aventura', 'Fantasia', 'Terror', 'Suspense', 'Drama', 'Biografia', 'Educativo', 'Poesia', 'Clássicos'];
  
  // <<< MUDANÇA: Lista de condições que o backend aceita >>>
  conditions = ['novo', 'usado - bom', 'usado - razoável', 'usado - ruim'];

  constructor(private fb: FormBuilder, private bookService: BookService) {}

  ngOnInit(): void {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      author: ['', [Validators.required, Validators.maxLength(255)]],
      // <<< MUDANÇA: Nome 'publication_year' e validação mais específica >>>
      publication_year: [null, [Validators.min(0), Validators.max(new Date().getFullYear())]], 
      // <<< MUDANÇA: Condição com valor default da lista e required >>>
      condition: ['novo', Validators.required], 
      // <<< MUDANÇA: Gênero agora é string e obrigatório? (Decida se é obrigatório) >>>
      main_genre: ['', Validators.required], 
      exchange_available: [false, Validators.required], // Required para garantir boolean
      loan_available: [false, Validators.required],   // Required para garantir boolean
      // Campos extras que o backend pode esperar (ajuste conforme 'prepareBookData')
      publisher: [''], 
      isbn: [''],
      description: ['']
      // 'img' não precisa estar no form se vamos definir fixo
    });
  }

  // <<< REMOVIDO: Lógica onGenreChange não é mais necessária com <select> >>>

  submit() {
    // Marca todos os campos como 'touched' para mostrar erros de validação
    this.bookForm.markAllAsTouched(); 
    if (this.bookForm.invalid) {
        this.error = "Por favor, corrija os erros no formulário.";
        this.errorDetails = [];
        return;
    }

    if (this.userId === null) {
        this.error = "Erro: ID do usuário não encontrado. Faça login novamente.";
        this.errorDetails = [];
        return;
    }

    this.loading = true;
    this.success = null;
    this.error = null;
    this.errorDetails = [];

    // <<< MUDANÇA: Mapeia os nomes do formulário para os nomes esperados pelo backend >>>
    const formData = this.bookForm.value;
    const dataToSend = { 
      title: formData.title,
      author: formData.author,
      // Envia null se o ano não for preenchido
      year: formData.publication_year ? Number(formData.publication_year) : null, 
      condition: formData.condition,
      // Envia o gênero selecionado
      genre: formData.main_genre, 
      exchange_available: formData.exchange_available,
      loan_available: formData.loan_available,
      // Campos opcionais
      publisher: formData.publisher || null,
      isbn: formData.isbn || null,
      description: formData.description || null,
      // Define a imagem e owner_id (ownerId no frontend)
      img: 'Em desenvolvimento', // placeholder
      ownerId: this.userId, // O serviço/backend espera ownerId ou owner_id? Ajuste se necessário.
      available: true // Livro novo começa disponível
    };

    this.bookService.createBook(dataToSend).subscribe({
      next: (book) => {
        this.success = 'Livro adicionado com sucesso!';
        this.bookCreated.emit(book);
        this.loading = false;
        this.bookForm.reset({ // Limpa o form com valores padrão
             publication_year: null, 
             condition: 'novo', 
             main_genre: '', 
             exchange_available: false, 
             loan_available: false,
             publisher: '',
             isbn: '',
             description: ''
        }); 
        // Fecha o form após sucesso (opcional)
        // setTimeout(() => this.cancel(), 1500); 
      },
      error: (err: any) => { // <<< TIPO ADICIONADO
        console.error("Erro Raw:", err); // Loga o erro completo no console
        this.error = 'Erro ao adicionar livro.';
        // Tenta pegar detalhes do erro do backend (se houver)
        if (err.error && err.error.details && Array.isArray(err.error.details)) {
            this.errorDetails = err.errors.details;
            this.error = err.error.error || 'Erro ao adicionar livro.'; // Usa a msg principal do backend
        } else if (err.error && err.error.message) {
            this.errorDetails = [err.error.message];
        } else if (typeof err.error === 'string') {
             this.errorDetails = [err.error];
        } else {
            this.errorDetails = ['Ocorreu um erro inesperado. Tente novamente.'];
        }
        this.loading = false;
      }
    });
  }

  cancel() {
    this.closeForm.emit();
  }
}