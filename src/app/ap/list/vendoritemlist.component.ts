import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";

@Component({
    selector: 'dialog-vendoritemlist',
    templateUrl: './vendoritemlist.component.html',
  })
  export class VendItemList implements AfterViewInit {
    @ViewChild('vilG01') itemlistg01: WjFlexGrid;
    gH01:number;
    
    constructor(public dialogRef: MatDialogRef<VendItemList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService) {
        this.gH01 = (window.innerHeight * 0.95) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/ItemMaint/GetItemVendorsList', {pfvid: this.data.fvid})
            .subscribe(results => {
                // Set initial value
                for (var i = 0; i < results.length; i++) {
                    results[i].cqty = 0;
                }
                this.wjH.gridLoad(this.itemlistg01, results);
                this.CompanySvc.ofHourGlass(false);
            });
    }

    // Assign Qty Based on Reorder-Point
    itemvendorsQtyToOrder() {
        var rowcount = this.itemlistg01.rows.length;
        for (var i = 0; i < rowcount; i++) {
            var row = this.itemlistg01.rows[i].dataItem;
            if (row.freorderpoint >= row.fohqty) row.cqty = Math.round(row.freorderqty / row.funits);
        }
        // Refresh Grid
        this.itemlistg01.refresh();
    }

    closeDialog() {
        this.dialogRef.close(this.itemlistg01.itemsSource);
    }

    initGrids() {
        // wj-flex-grid
        this.itemlistg01.initialize({
            columns: [
                {binding: "cqty", header: "Qty", width: 80, isReadOnly: false}, // Non Existing Column
                {binding: "fvitem", header: "Vendor Item", width: 200, isReadOnly: true},
                {binding: "fdescription", header: "Description", width: 300, isReadOnly: true},
                {binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                {binding: "fcost", header: "Cost", format: 'c', width: 100, isReadOnly: true},
                {binding: "funits", header: "# Units", width: 90, isReadOnly: true},
                {binding: "fohqty", header: "On Hand", width: 90, isReadOnly: true},
                {binding: "freorderqty", header: "Reorder Qty", width: 110, isReadOnly: true},
                {binding: "freorderpoint", header: "Reorder Pt.", width: 110, isReadOnly: true},
                {binding: "fweight", header: "Weight", width: 90, isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.itemlistg01, true);
        new wjGridFilter.FlexGridFilter(this.itemlistg01);
    }
  }