import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

@Component({
    selector: 'app-file-input',
    standalone: true,
    templateUrl: './file-input.component.html',
    styleUrls: ['./file-input.component.scss'],
    imports: [MatIconModule]
})
export class FileInputComponent {
    @Input() disabled: boolean = false;
    @Input() accept: string = '';
    @Output() changeEvent = new EventEmitter<File>();

    @ViewChild('fileInput') fileInput!: ElementRef;
    file: File | null = null;

    constructor() {}

    get displayedValue(): string {
        return this.file ? this.file.name : '';
    }

    get icon(): string {
        return this.file ? 'icons/exit-cross' : 'icons/folder';
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