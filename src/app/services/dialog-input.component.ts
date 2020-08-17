import { MatDialogRef } from '@angular/material/dialog';
import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'input-dialog',
    template: `
        <h1 md-dialog-title style="min-width: 350px">{{ title }}</h1>
        <div md-dialog-content>
            <div class="form-group">
                <label for="usr">{{ message }}:</label>
                <input #indfld type="text" class="form-control" [(ngModel)]="textValue" [ngClass]="{'secure-font':hideInput == true}">
            </div>
            <keypad *ngIf='allowKeypad' [keypadValue]='textValue' (keypadValueChange)="onKeypadValueChange($event)" (keypadEnter)="onYes()"></keypad>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">{{ no }}</button>
            <button *ngIf='!allowKeypad' type="button" class="btn btn-primary" type="submit" (click)="onYes()">{{ yes }}</button>
        </div>
    `,
})
export class InputDialog {
    @ViewChild('indfld') infield: ElementRef;
    public title: string;
    public message: string;
    public yes: string;
    public no: string;
    public hideInput: boolean;
    public allowKeypad: boolean = true;
    textValue: string;

    constructor(public dialogRef: MatDialogRef<InputDialog>) {}

    ngAfterViewInit() {
        setTimeout(() => this.infield.nativeElement.select(), 100);
    }

    onKeypadValueChange(event) {
        this.textValue = event;
    }

    onYes() {
        // Return only with proper value
        if (this.textValue) {
            this.dialogRef.close(this.textValue);
        }
    }
}