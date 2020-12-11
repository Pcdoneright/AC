import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { invwork } from './invwork';
import { DataService } from '../../services/data.service';

@Component({
    selector: 'invphysicalpost',
    templateUrl: './invphysicalpost.html'
})
export class invphysicalpost implements AfterViewInit {
    @ViewChild('invwork', {static: true}) invwork: invwork;
    
    constructor(public appH: appHelperService, private DataSvc: DataService) {}
    
    ngAfterViewInit() {
        this.invwork.parent = this;
        this.invwork.allowNegativeQty = false;
        this.invwork.trxType = 'AP'; // Physical Inventory

        this.invwork.createOrder(); // Create by default and retrieve items
        setTimeout(() => {
            this.allowCustomAction();
        }, 500);
    }

    allowCustomAction() {
        if (!this.invwork.validEntry()) return;
        if (this.invwork.invworkheaders.items[0].fstatus == 'O') {
            
            this.appH.ofHourGlass(true);
            this.DataSvc.serverDataGet('api/Invwork/GetInvworkAP', {pfloc: this.invwork.invworkheaders.items[0].flocation}).subscribe((dataResponse) => {
                this.invwork.invwork.loadData(dataResponse.invworks);
                this.invwork.wjH.gridLoad(this.invwork.invworkGrid, this.invwork.invwork.items, false);
                this.invwork.focusToScan();
                this.appH.ofHourGlass(false);
            });
        }
    }

    allowToUpdate(row) {
        return (row.fstatus == 'O'); // Open Only
    }

    InUpdate() {
        this.invwork.invworkheaders.items[0].fstatus = 'C'; // Complete trx
        // Update details
        this.invwork.invwork.items.forEach((row) => {
            row.fiwhid = this.invwork.invworkheaders.items[0].fiwhid;
            row.fstatus = 'C';
        });
    }
}
