import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { invwork } from './invwork';
import { transferitemlist } from '../../inventory/itemlist/transferitemlist';
import { DataService } from '../../services/data.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'invtransferreq',
    templateUrl: './invtransferreq.html'
})
export class invtransferreq implements AfterViewInit {
    @ViewChild('invwork', {static: true}) invwork: invwork;
    currAction = '';
    pRows = [];
    prevTrx = [];
    
    constructor(public appH: appHelperService, private DataSvc: DataService, private dialog: MatDialog) {}
    
    async ngAfterViewInit() {
        this.invwork.parent = this;
        this.invwork.allowNegativeQty = false;
        this.invwork.trxType = 'XO'; // Transfer-Out
        this.invwork.OptNewAfterPost = false;

        // Add custom buttons
        this.invwork.bar01.navProperties['buttons'].push({name: 'Set Transfer-Out', style: 'secondary', action: 'customAction', function: 'SetTranferOut', show: true});
        this.invwork.bar01.navProperties['buttons'].push({name: 'Fill New Order', style: 'secondary', action: 'customAction', function: 'fillOrder', show: true, tooltip:"Create New Order with unfulfilled Qty"});
        this.invwork.bar02.navProperties['buttons'].push({name: ' Add From Favorites', style: 'light', icon: 'fa fa-star', action: 'customAction', function: 'ShowFavorites', show: true, tooltip:"Favorites List"});
    }

    SetTranferOut() {
        if (!this.invwork.validEntry()) return;

        // if (this.invwork.invworkheaders.isNew(0)) {
        //     this.appH.toastr('Please Save order first.', '', '', true, true);
        //     return;
        // };
        if (this.invwork.invworkheaders.items[0].fstatus !== 'O') {
            this.appH.toastr('Only Open Orders can be Transfer-Out.', 'warning', '', true, true);
            return;
        }

        // Flag an Update Order
        this.currAction = 'T';
        this.invwork.invworkheaders.items[0].ts = new Date(); // Force to update if nothing changed
        this.invwork.update();
    }

    async fillOrder() {
        this.pRows = [];
        this.prevTrx = [];

        if (!this.invwork.validEntry()) return;
        if (this.invwork.invworkheaders.items[0].fstatus !== 'C') {
            this.appH.toastr('Only Completed Orders can be selected.');
            return
        }

        if (this.invwork.dESrvc.checkForChanges()) {
            this.appH.toastr('Pending changes detected.');
            return;
        }
        
        this.invwork.invwork.items.forEach(row => {
            if (row.fqty - row.fqty3 > 0) {
                this.pRows.push({fitem: row.fitem, fqty: row.fqty - row.fqty3});
            }
        });

        if (this.pRows.length < 1) {
            this.appH.toastr('All rows where fullfiled.');
            return
        }

        this.prevTrx.push(this.invwork.invworkheaders.items[0]); // Save last trx
        this.invwork.createOrder();
        
        this.invwork.CompanySvc.ofHourGlass(true);
        setTimeout(async () => {
            this.invwork.invworkheaders.items[0].fnotes = 'Trx # ' + this.prevTrx[0].fiwhid + ' Fulfillment';
            this.invwork.invworkheaders.items[0].flocation = this.prevTrx[0].flocation;
            this.invwork.invworkheaders.items[0].flocation2 = this.prevTrx[0].flocation2;

            for (var i = 0; i < this.pRows.length; i++) {
                let nrow = await this.invwork.addinvwork(this.pRows[i].fitem, false);
                nrow.fqty = this.pRows[i].fqty;
            }
            
            this.invwork.wjH.gridLoad(this.invwork.invworkGrid, this.invwork.invwork.items);
            this.invwork.focusToScan();    
            this.invwork.CompanySvc.ofHourGlass(false);
        }, 50);
    }

    async ShowFavorites() {
        if (!this.invwork.validEntry()) return;
        
        let pData = { flocation: this.invwork.flocation };
        this.dialog.open(transferitemlist, {data: pData}).afterClosed().subscribe(async dataResponse => {
            if (!dataResponse) return;
            
            let row = null;
            // Add items with valid cqty
            for (var i = 0; i < dataResponse.length; i++) {
                if (dataResponse[i].cqty > 0) {
                    // Find Row 1st
                    row = this.invwork.invworkfindrow(dataResponse[i].fitem);
                    if (!row) {
                        row = await this.invwork.addinvwork(dataResponse[i].fitem, false);
                    }
                    row.fqty = dataResponse[i].cqty; // Update Qty
                }
            }
            this.invwork.wjH.gridLoad(this.invwork.invworkGrid, this.invwork.invwork.items);
            this.invwork.focusToScan();
        });
    }

    allowToUpdate(rowH) {
        return (rowH.fstatus == 'O'); // Open Only
    }

    InUpdate() {
        if (this.currAction == 'T') {
            this.invwork.invworkheaders.items[0].fstatus = 'T'; // In-Transfer
            this.currAction = '';
        }
        
        this.saveFavorites();
    }

    saveFavorites() {
        // Create array
        var favorites = [];
        for (var i = 0; i < this.invwork.invwork.items.length; i++) {
            favorites.push({ fitem: this.invwork.invwork.items[i].fitem });
        }
        // Save
        this.DataSvc.serverDataPost('api/Invwork/PostFavorites', favorites).subscribe();
    }
}
        