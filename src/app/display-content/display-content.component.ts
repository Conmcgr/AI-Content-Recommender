import { Component } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-display-content',
  standalone: true,
  imports: [
    RouterModule,
    HttpClientModule],
  templateUrl: './display-content.component.html',
  styleUrl: './display-content.component.scss'
})

export class DisplayContentComponent {
  vidId1: string;
  vidId2: string;
  vidId3: string;

  constructor(private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer, private http: HttpClient) {
    this.route.queryParams.subscribe(params => {
      this.vidId1 = params['vid_id1'];
      this.vidId2 = params['vid_id2'];
      this.vidId3 = params['vid_id3'];
    });
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  onVideoClick(videoId: string) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found');
      this.router.navigate(['/login']);
      return;
    }
    this.http.post('/api/video/add-queue', { videoId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    this.router.navigate(['/home']);
  }

  getSafeUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

}
