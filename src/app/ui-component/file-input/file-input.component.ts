import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-file-input',
  standalone: true,
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.scss',
  imports: [MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule],
})
export class FileInputComponent {
  @Input() disabled: boolean = false;
  @Input() accept: string = '';
  @Input() label: string = '';
  @Output() changeEvent = new EventEmitter<File>();

  @ViewChild('fileInput') fileInput!: ElementRef;
  file: File | null = null;

  constructor() {}

  get displayedValue(): string {
    return this.file ? this.file.name : '';
  }

  get icon(): string {
    return this.file ? 'close' : 'upload_file';
  }

  onClickToUploadFile(): void {
    this.fileInput.nativeElement.click();
  }

  onUploadFile(): void {
    const files = this.fileInput.nativeElement.files;
    if (files && files.length > 0) {
      this.file = files[0];
      this.changeEvent.emit(this.file!);
    }
  }

  handleIconClick(): void {
    if (this.file) {
      this.file = null;
      this.fileInput.nativeElement.value = '';
      this.changeEvent.emit(this.file!);
    } else {
      this.onClickToUploadFile();
    }
  }
}
