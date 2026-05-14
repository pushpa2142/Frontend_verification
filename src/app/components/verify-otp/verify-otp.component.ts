import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  resending = false;
  errorMessage = '';
  successMessage = '';

  phoneNumber = '';
  maskedPhone = '';

  // Countdown timer (2 minutes = 120 seconds)
  timeLeft = 120;
  timerExpired = false;
  private timerInterval?: ReturnType<typeof setInterval>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Retrieve the phone number stored during step 1
    const phone = this.authService.getPendingPhone();

    if (!phone) {
      // No phone in session — send user back to step 1
      this.router.navigate(['/verify']);
      return;
    }

    this.phoneNumber = phone;
    this.maskedPhone = this.maskPhone(phone);

    this.form = this.fb.group({
      otp: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^\d{6}$/),
        ],
      ],
    });

    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get otp() { return this.form.get('otp')!; }

  // ── Timer ──────────────────────────────────────────────────────────────────

  private startTimer(): void {
    this.timeLeft = 120;
    this.timerExpired = false;
    this.clearTimer();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timerExpired = true;
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timerClass(): string {
    if (this.timerExpired) return 'expired';
    if (this.timeLeft <= 30) return 'expiring';
    return '';
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    if (this.timerExpired) {
      this.errorMessage = 'The code has expired. Please request a new one.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.verifyOTP(this.phoneNumber, this.otp.value).subscribe({
      next: () => {
        this.loading = false;
        this.clearTimer();
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || 'Invalid code. Please try again.';
        // Clear input for retry
        this.otp.reset();
      },
    });
  }

  resendCode(): void {
    if (this.resending) return;

    this.resending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.otp.reset();

    this.authService.sendOTP(this.phoneNumber).subscribe({
      next: () => {
        this.resending = false;
        this.successMessage = 'A new code has been sent!';
        this.startTimer();
        setTimeout(() => (this.successMessage = ''), 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.resending = false;
        this.errorMessage = err.error?.message || 'Failed to resend code.';
      },
    });
  }

  goBack(): void {
    this.authService.clearPendingPhone();
    this.router.navigate(['/verify']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private maskPhone(phone: string): string {
    if (phone.length < 7) return phone;
    return phone.slice(0, 3) + ' ****' + phone.slice(-4);
  }

  /** Allow only digit input in the OTP field */
  onOtpKeypress(event: KeyboardEvent): boolean {
    return /\d/.test(event.key);
  }
}
