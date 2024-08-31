import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  onSubmit() {
    const loginData = {
      username: this.username,
      password: this.password
    };

    this.http.post<any>('/api/auth/login', loginData).subscribe(
      response => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/home']);
      },
      error => {
        this.errorMessage = 'Incorrect username/password';
      }
    );
  }
}
