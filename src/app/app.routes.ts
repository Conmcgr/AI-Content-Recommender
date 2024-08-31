import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { StartSessionComponent } from './start-session/start-session.component';
import { SettingsComponent } from './settings/settings.component';
import { DisplayContentComponent } from './display-content/display-content.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'start-session', component: StartSessionComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'display-content', component: DisplayContentComponent }
  // Add other routes here
];
