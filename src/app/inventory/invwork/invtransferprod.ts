import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { invwork } from './invwork';

@Component({
    selector: 'invtransferprod',
    templateUrl: './invtransferprod.html'
})
export class invtransferprod implements AfterViewInit {
    @ViewChild('invwork', {static: true}) invwork: invwork;
    
    constructor(public appH: appHelperService) {}
    
    ngAfterViewInit() {
        this.invwork.parent = this;
        this.invwork.allowNegativeQty = false;
        this.invwork.trxType = 'IP'; // Trasnfer to Production

        setTimeout(() => {
            this.invwork.createOrder(); // Create New Order
        }, 0);
    }

    allowToUpdate(row) {
        return (row.fstatus == 'O'); // Open Only
    }

    InUpdate() {
        this.invwork.invworkheaders.items[0].fstatus = 'C'; // Complete trx
    }
}
        