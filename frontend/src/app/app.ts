import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  constructor(public router: Router) {}

  get showHeader(): boolean {
    const hiddenRoutes = ['/', '/register']; // rotas onde o header NÃO aparece
    return !hiddenRoutes.includes(this.router.url);
  }
}
