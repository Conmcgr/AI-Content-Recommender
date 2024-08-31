import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string;
  password: string;
  errorMessage: string;

  constructor(private router: Router, private http: HttpClient) { }

  onSubmit() {
    this.http.post('/api/login', { username: this.username, password: this.password }).subscribe(
      (response: any) => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/home']);
      },
      (error) => {
        this.errorMessage = 'Incorrect username/password';
      }
    );
  }
}
