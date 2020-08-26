import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { invwork } from './invwork';

@Component({
    selector: 'invtransferin',
    templateUrl: './invtransferin.html'
})
export class invtransferin implements AfterViewInit {
    @ViewChild('invwork', {static: true}) invwork: invwork;
    
    constructor(public appH: appHelperService) {}
    
    ngAfterViewInit() {
        this.invwork.parent = this;
        this.invwork.allowNegativeQty = false;
        this.invwork.trxType = 'XI'; // Trasnfer-In
        this.invwork.validateTransaction = true;
        this.invwork.afterRetrieveTrx = true;
    }

    validateTransaction(row) {
        return (row.fstatus == 'T');
    }

    afterRetrieveTrx() {
        this.invwork.invworkheaders.items[0].flocation2 = this.appH.getUserLocation() // Assign user location2
        this.invwork.invworkheaders.items[0].ftype = 'XI'
        // Update fqty2
        this.invwork.invwork.items.forEach((row) => {
            row.fqty2 = row.fqty;
        })
    }

    allowToUpdate(row) {
        return (row.fstatus == 'T'); // In-Transit Only
    }

    InUpdate() {
        this.invwork.invworkheaders.items[0].fstatus = 'C'; // Complete trx
    }
}
