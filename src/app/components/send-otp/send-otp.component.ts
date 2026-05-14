import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-send-otp',
  templateUrl: './send-otp.component.html',
  styleUrls: ['./send-otp.component.scss'],
})
export class SendOtpComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\+[1-9]\d{1,14}$/),
        ],
      ],
    });
  }

  get phone() { return this.form.get('phoneNumber')!; }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    const phoneNumber = this.phone.value.trim();

    this.authService.sendOTP(phoneNumber).subscribe({
      next: (response) => {
        this.loading = false;
        // Navigate to the OTP verification step
        this.router.navigate(['/verify/confirm']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || 'Failed to send verification code. Please try again.';
      },
    });
  }
}
