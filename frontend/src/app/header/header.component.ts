import { Component, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs'; // Import Observable

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  dropdownOpen = false;
  @ViewChild('profileContainer') profileContainer!: ElementRef;

  // --- [CORREÇÃO APLICADA AQUI] ---
  // Initialize the Observables directly using the services.
  unreadCount$: Observable<number>;
  isLoggedIn$: Observable<boolean>;
  // --- [FIM DA CORREÇÃO] ---

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // --- [CORREÇÃO APLICADA AQUI] ---
    // Assign the Observables in the constructor.
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    // --- [FIM DA CORREÇÃO] ---
  }

  ngOnInit(): void {
    // Now, ngOnInit just needs to *trigger* the initial fetch if logged in.
    this.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) {
        this.notificationService.fetchUnreadCount();
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/feed']);
  }

  goTo(path: string): void {
    this.router.navigate([path]);
    this.dropdownOpen = false;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    console.log('Usuário deslogado');
    this.router.navigate(['/']);
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.dropdownOpen && this.profileContainer?.nativeElement.contains(event.target) === false) {
      this.dropdownOpen = false;
    }
  }
}