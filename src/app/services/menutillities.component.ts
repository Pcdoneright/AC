import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
// import { DialogService } from '@ngneat/dialog';
import { ItemPriceCheck } from '../inventory/itempricecheck/itempricecheck.component';

@Component({
    selector: 'menutillities',
    template: `
        <button type="button" class="btn btn-secondary btn-sm" style='margin-top: -5px' (click)="priceCheck()" ><i class="fa fa-barcode"></i> Price Check</button>
    `
})

export class MenUtillitiesComponent {
    // constructor(private dialog: DialogService) {}
    constructor(private dialog: MatDialog) {}

    priceCheck() {
        // this.dialog.open(ItemPriceCheck, {draggable: true, resizable: true, closeButton: false, width: '60vw'}).afterClosed$.subscribe();
        this.dialog.open(ItemPriceCheck).afterClosed().subscribe();
    }
}