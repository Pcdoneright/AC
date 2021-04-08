import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";

@Component({
    selector: 'dialog-transferitemlist',
    templateUrl: './transferitemlist.html',
  })
  export class transferitemlist implements AfterViewInit {
    @ViewChild('custitemlistg01') itemlistg01: WjFlexGrid;
    gH01:number;
    
    constructor(public dialogRef: MatDialogRef<transferitemlist>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService) {
        this.gH01 = (window.innerHeight * 0.95) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/Invwork/GetItemTransferReqList', {pflocation: this.data.flocation})
            .subscribe(results => {
                // Set initial value
                for (var i = 0; i < results.length; i++) {
                    results[i].cqty = 0;
                }
                this.wjH.gridLoad(this.itemlistg01, results);
                this.CompanySvc.ofHourGlass(false);
            });
    }

    closeDialog() {
        this.dialogRef.close(this.itemlistg01.itemsSource);
    }

    initGrids() {
        // wj-flex-grid
        this.itemlistg01.initialize({
            columns: [
                {binding: "cqty", header: "Qty", width: 100, isReadOnly: false}, // Non Existing Column
                {binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                {binding: "fdescription", header: "Description", width: 300, isReadOnly: true},
                {binding: "fuomdescription", header: "UOM", width: 140, isReadOnly: true},
                {binding: "funits", header: "Units/Case", width: 140, isReadOnly: true},
                {binding: "fonhand", header: "On Hand", width: 120, isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.itemlistg01, true);
        new wjGridFilter.FlexGridFilter(this.itemlistg01);
    }
  }