import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton]
})
export class EmptyStateComponent {
  @Input() icon = 'folder-open-outline';
  @Input() title = 'Nenhum item encontrado';
  @Input() message = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();

  constructor() {
    addIcons({ add });
  }

  onAction() {
    this.action.emit();
  }
}
