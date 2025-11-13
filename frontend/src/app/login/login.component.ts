import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isRegisterMode = false;

  loginData = {
    email: '',
    password: ''
  };

  // AJUSTADO PARA CORRESPONDER AO SEU BACKEND
  registerData = {
    username: '',
    full_name: '', // <-- MUDANÇA DE 'name' PARA 'full_name'
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/feed']);
      },
      // SUBSTITUA ESTE BLOCO 'error'
      error: (err) => {
        console.error('Resposta completa do erro:', err); // Mantém o log completo
  
        // Extrai a mensagem de detalhe que o seu backend enviou
        const errorDetails = err.error?.details?.[0]?.msg || 'Verifique os dados e tente novamente.';
        
        // Exibe a mensagem de erro específica para o usuário
        alert(`Erro no login: ${errorDetails}`);
      }
    });
  }
  onRegister() {
    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        alert('Usuário registrado com sucesso! Faça o login para continuar.');
        this.toggleMode(); // Volta para la tela de login
      },
      error: (err) => {
        console.error('Erro no registro:', err);
        // Exibe detalhes do erro, se a API os enviar
        const errorDetails = err.error?.details?.join('\n') || 'Verifique os dados e tente novamente.';
        alert(`Não foi possível registrar o usuário:\n${errorDetails}`);
      }
    });
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
  }
}