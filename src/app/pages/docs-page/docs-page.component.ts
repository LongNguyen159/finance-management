import { Component } from '@angular/core';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';

@Component({
  selector: 'app-docs-page',
  standalone: true,
  imports: [UserManualComponent],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.scss'
})
export class DocsPageComponent {

}
