import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent {
  newPost: string = '';
  posts = [
    { author: 'Alice Santos', time: '2h atrás', content: 'Alguém interessado em trocar um clássico de ficção científica?', likes: 4, comments: 1 },
    { author: 'Daniel Almeida', time: '5h atrás', content: 'Li o livro sobre a Biografia de André Silva recentemente e gostei muito! Altamente recomendado.', likes: 10, comments: 3 },
    { author: 'Marina Oliveira', time: '8h atrás', content: 'Alguém tem sugestões de leitura na área de filosofia?', likes: 2, comments: 0 },
  ];

  publishPost() {
    if (this.newPost.trim()) {
      this.posts.unshift({
        author: 'Você',
        time: 'agora mesmo',
        content: this.newPost,
        likes: 0,
        comments: 0
      });
      this.newPost = '';
    }
  }
}
