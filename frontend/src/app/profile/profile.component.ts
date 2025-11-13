import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BookService, Book } from '../services/book.service';
import { LocationService, Estado, Cidade } from '../services/location.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;

  // Edição de perfil
  editMode = false;
  editableUser: any = {};
  selectedAvatar: string | null = null;
  estados: Estado[] = [];
  cidades: Cidade[] = [];
  allGenres = ['Ficção', 'Romance', 'Aventura', 'Fantasia', 'Terror', 'Biografia', 'Educativo', 'Drama', 'Suspense', 'Poesia'];

  // Adição de livro
  bookModal = false;
  bookForm!: FormGroup;
  loading = false;
  success: string | null = null;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private bookService: BookService,
    private locationService: LocationService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.initBookForm();
  }

  // ====================== PERFIL ======================
  private loadUserProfile() {
    this.authService.getUserProfile().subscribe({
      next: (data) => {
        data.preferences = data.preferences || [];
        this.user = data;
        
        // Correção 1: Busca os livros do usuário ao carregar o perfil
        this.loadUserBooks(); 
      },
      error: (err) => console.error('Erro ao carregar perfil:', err)
    });
  }

  // Nova função para carregar os livros
  private loadUserBooks() {
    this.bookService.getMyBooks().subscribe({
      next: (books) => {
        if (this.user) {
          this.user.books = books;
        }
      },
      error: (err) => console.error('Erro ao carregar livros do usuário:', err)
    });
  }

  toggleEditMode() {
    if (!this.user) return;
    this.editableUser = JSON.parse(JSON.stringify(this.user));
    if (!this.editableUser.preferences) this.editableUser.preferences = [];
    this.loadEstados();
    if (this.editableUser.state) this.onStateChange(this.editableUser, false);
    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;
    this.selectedAvatar = null;
    this.editableUser = {};
  }

  saveProfile() {
    if (!this.editableUser) return;
    if (this.selectedAvatar) this.editableUser.avatar = this.selectedAvatar;
    this.authService.updateUserProfile(this.editableUser).subscribe({
      next: (updatedUser) => {
        this.user = { ...this.editableUser };
        this.editMode = false;
        this.selectedAvatar = null;
        alert('Perfil atualizado com sucesso!');
      },
      error: (err) => alert('Erro ao salvar o perfil. Verifique os campos e tente novamente.')
    });
  }

  selectAvatar(avatarFileName: string) {
    this.selectedAvatar = avatarFileName;
  }

  loadEstados() {
    this.locationService.getEstados().subscribe({
      next: (data) => {
        this.estados = data;
        if (this.editableUser.state) this.onStateChange(this.editableUser, false);
      },
      error: (err) => console.error(err)
    });
  }

  onStateChange(userObject: any, resetCity = true) {
    const estadoSelecionado = userObject.state;
    if (estadoSelecionado) {
      this.locationService.getCidades(estadoSelecionado).subscribe({
        next: (data) => {
          this.cidades = data;
          if (resetCity) userObject.city = '';
        }
      });
    }
  }

  onPreferenceChange(genre: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (!this.editableUser.preferences) this.editableUser.preferences = [];
    const prefs = this.editableUser.preferences as string[];
    if (isChecked && !prefs.includes(genre)) prefs.push(genre);
    else if (!isChecked) prefs.splice(prefs.indexOf(genre), 1);
  }

  deleteAccount() {
    const password = prompt('Digite sua senha para confirmar a exclusão:');
    if (!password) return;
    this.authService.deleteAccount(password).subscribe({
      next: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/']);
      },
      error: () => alert('Senha incorreta ou erro ao deletar a conta.')
    });
  }

  // ====================== LIVRO ======================
  initBookForm() {
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      condition: ['novo', Validators.required], 
      genre: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1000), Validators.max(new Date().getFullYear())]],
      exchange_available: [false],
      loan_available: [false],
      img: ['em desenvolvimento']
    });
  }

  openBookModal() {
    this.bookModal = true;
    this.success = null;
    this.error = null;
  }

  closeBookModal() {
    this.bookModal = false;
    this.bookForm.reset({
      condition: 'novo',
      img: 'em desenvolvimento',
      exchange_available: false,
      loan_available: false
    });
    this.success = null;
    this.error = null;
  }

  submitBook() {
    // Esta verificação impede o envio se o formulário (ex: ano) estiver inválido
    if (this.bookForm.invalid) return; 

    this.loading = true;
    
    // 1. Pegamos os dados DO FORMULÁRIO (que contém o 'year')
    const bookData = this.bookForm.value; 
    
    this.bookService.createBook(bookData).subscribe({
      // 2. 'createdBook' é a resposta do backend (pode não ter o 'year')
      next: (createdBook) => {
        this.success = 'Livro adicionado com sucesso!';
        
        // ===== CORREÇÃO (Problema de ID e Sincronização) =====
        // Em vez de adicionar manualmente o livro, recarregamos a lista
        // do servidor. Isso garante que temos o ID correto e todos
        // os dados estão sincronizados com o backend.
        this.loadUserBooks(); 
        
        this.loading = false;
        this.closeBookModal();
      },
      error: (err) => {
        this.error = 'Erro ao adicionar livro: ' + (err.message || err);
        this.loading = false;
      }
    });
  }

  // Função para deletar o livro
  deleteBook(bookId: number) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) {
      return;
    }

    this.bookService.deleteBook(bookId).subscribe({
      next: () => {
        // ===== CORREÇÃO (Erro TS7006) =====
        // Adicionamos o tipo (book: Book) para o TypeScript saber
        // que 'book' tem uma propriedade 'id'.
        this.user.books = this.user.books.filter((book: Book) => book.id !== bookId);
        alert('Livro excluído com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao excluir livro:', err);
        alert('Erro ao excluir livro. Tente novamente.');
      }
    });
  }
}

