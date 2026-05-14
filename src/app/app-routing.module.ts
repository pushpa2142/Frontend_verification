import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SendOtpComponent } from './components/send-otp/send-otp.component';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

const routes: Routes = [
  { path: '', redirectTo: '/verify', pathMatch: 'full' },
  {
    path: 'verify',
    component: SendOtpComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'verify/confirm',
    component: VerifyOtpComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '/verify' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
