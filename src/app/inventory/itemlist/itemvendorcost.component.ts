import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';

@Component({
    selector: 'dialog-itemvendorcost',
    templateUrl: './itemvendorcost.component.html',
  })
  export class Itemvendorcost implements AfterViewInit {
    @ViewChild('itemrelg01') itemrelg01: WjFlexGrid;
    gH01:number;

    constructor(public dialogRef: MatDialogRef<Itemvendorcost>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private DataSvc: DataService, public wjH: wjHelperService) {
        //dialogRef['height'] = "95%"; // Force value
        this.gH01 = (window.innerHeight * 0.50) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/ItemMaint/GetItemVendorCost', { pfitem: this.data.fitem })
            .subscribe((results) => {
                this.wjH.gridLoad(this.itemrelg01, results);
                this.CompanySvc.ofHourGlass(false);
            });
    }

    initGrids() {
        // wj-flex-grid
        this.itemrelg01.initialize({
            isReadOnly: true,
            columns: [
                {binding: "fvitem", header: "Vendor Item", width: 200},
                {binding: "fdescription", header: "Vendor Description", width: 250},
                {binding: "fname", header: "Vendor", width: 250},
                {binding: "fcost", header: "Cost", format:'c', width: 100},
                {binding: "cpriceunit", header: "Per Unit", format:'c', width: 100}
            ]
        });
        this.wjH.gridInit(this.itemrelg01, true);
    }
  }