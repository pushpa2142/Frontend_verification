import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface SendOtpData {
  phoneNumber: string;
  expiresAt: string;
}

export interface VerifyOtpData {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name?: string;
  isPhoneVerified: boolean;
  phoneVerifiedAt?: string;
  createdAt?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  private readonly TOKEN_KEY = 'pv_token';
  private readonly USER_KEY  = 'pv_user';
  private readonly PHONE_KEY = 'pv_phone'; // Temporary: phone between steps

  /** Emits the current authenticated user (null if logged out) */
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── OTP Flow ──────────────────────────────────────────────────────────────

  /**
   * Request an OTP to be sent to the given phone number
   */
  sendOTP(phoneNumber: string): Observable<ApiResponse<SendOtpData>> {
    return this.http.post<ApiResponse<SendOtpData>>(
      `${this.API}/api/auth/send-otp`,
      { phoneNumber }
    ).pipe(
      tap(() => this.savePendingPhone(phoneNumber))
    );
  }

  /**
   * Verify the OTP code; stores JWT and user on success
   */
  verifyOTP(phoneNumber: string, otp: string): Observable<ApiResponse<VerifyOtpData>> {
    return this.http.post<ApiResponse<VerifyOtpData>>(
      `${this.API}/api/auth/verify-otp`,
      { phoneNumber, otp }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveSession(response.data.token, response.data.user);
          this.clearPendingPhone();
        }
      })
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.API}/api/auth/profile`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateStoredUser(response.data);
        }
      })
    );
  }

  getVerificationStatus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/api/auth/status`);
  }

  // ── Session Management ────────────────────────────────────────────────────

  /** Store JWT token and user profile in localStorage */
  private saveSession(token: string, user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private updateStoredUser(user: UserProfile): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /** Load user from localStorage on service init */
  private loadUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Retrieve the stored JWT token */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Check if a token exists (user is "logged in") */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Get the current user snapshot */
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  /** Sign out: clear session and redirect */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.clearPendingPhone();
    this.currentUserSubject.next(null);
    this.router.navigate(['/verify']);
  }

  // ── Pending Phone (between steps) ─────────────────────────────────────────

  savePendingPhone(phone: string): void {
    sessionStorage.setItem(this.PHONE_KEY, phone);
  }

  getPendingPhone(): string | null {
    return sessionStorage.getItem(this.PHONE_KEY);
  }

  clearPendingPhone(): void {
    sessionStorage.removeItem(this.PHONE_KEY);
  }
}
