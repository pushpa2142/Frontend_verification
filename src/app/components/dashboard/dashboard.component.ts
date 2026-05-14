import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  user: UserProfile | null = null;
  loading = true;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.getProfile().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.user = response.data;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load profile.';
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  get maskedPhone(): string {
    if (!this.user?.phoneNumber) return '';
    const n = this.user.phoneNumber;
    return n.slice(0, 3) + ' **** ' + n.slice(-4);
  }

  get verifiedDate(): string {
    if (!this.user?.phoneVerifiedAt) return '';
    return new Date(this.user.phoneVerifiedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  get memberSince(): string {
    if (!this.user?.createdAt) return '';
    return new Date(this.user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
}
