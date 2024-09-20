import { Component } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface VideoDetails {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
}

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
  videoDetails: { [key: string]: VideoDetails } = {};

  constructor(private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer, private http: HttpClient) {
    this.route.queryParams.subscribe(params => {
      this.vidId1 = params['vid_id1'];
      this.vidId2 = params['vid_id2'];
      this.vidId3 = params['vid_id3'];
    });
  }

  ngOnInit() {
    this.fetchVideoDetails(this.vidId1);
    this.fetchVideoDetails(this.vidId2);
    this.fetchVideoDetails(this.vidId3);
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  onVideoClick(videoId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found');
      this.router.navigate(['/login']);
      return;
    }
    this.http.post('/api/video/add-to-queue', { videoId }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(
      response => {
        console.log('Video added to queue:', response);
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        this.router.navigate(['/home']);
      },
      error => {
        console.error('Error adding video to queue:', error);
      }
    );
  }

  fetchVideoDetails(videoId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found');
      this.router.navigate(['/login']);
      return;
    }
    console.log('Fetching video details for:', videoId);
    this.http.get<VideoDetails>(`/api/video/video-info`, {
      headers: { Authorization: `Bearer ${token}`, 'videoId': videoId }
    }).subscribe(
      response => {
        console.log('Fetched video details:', response);
        this.videoDetails[videoId] = response;
      },
      error => {
        console.error('Error fetching video details:', error);
      }
    );
  }
}
