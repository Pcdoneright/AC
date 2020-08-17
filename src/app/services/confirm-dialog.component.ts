import { MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';

@Component({
    selector: 'confirm-dialog',
    template: `
        <h1 md-dialog-title style="min-width: 250px">{{ title }}</h1>
        <div md-dialog-content [ngClass]='mclass' >{{ message }}</div>
        <div md-dialog-actions class="modal-footer">
            <button *ngIf='displayNo' type="button" class="btn btn-secondary" style="min-width: 100px" (click)="dialogRef.close(false)">{{ no }}</button>
            <button type="button" class="btn btn-primary" style="min-width: 100px" (click)="dialogRef.close(true)">{{ yes }}</button>
        </div>
    `
})
export class ConfirmDialog {
    public title: string;
    public message: string;
    public yes: string;
    public no: string;
    public mclass: string;
    public displayNo: boolean = true;

    constructor(public dialogRef: MatDialogRef<ConfirmDialog>) {}
}