import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";

@Component({
    selector: 'dialog-itemlist',
    templateUrl: './itemlist.component.html',
  })
  export class ItemList implements AfterViewInit {
    @ViewChild('itemlistg01') itemlistg01: WjFlexGrid;
    @ViewChild('itemlistg02') itemlistg02: WjFlexGrid;
    listGridSearch = new FormControl();
    searchItemType = 'D';
    gH01:number;

    constructor(public dialogRef: MatDialogRef<ItemList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService) {
        //dialogRef['height'] = "95%"; // Force value
        this.gH01 = (window.innerHeight * 0.95) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();
        
        this.listGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (val == null || val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                var api = (this.searchItemType == 'D') ? 'api/ItemMaint/GetListByDescription' : 'api/ItemMaint/GetListByItem';
                return this.DataSvc.serverDataGet(api, {psearch: val, pActive: true, pfcid: this.data.fcid });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.itemlistg02, []); // Clear data
                this.wjH.gridLoad(this.itemlistg01, results, false);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    closeDialog() {
        let row = this.wjH.getGridSelectecRow(this.itemlistg01);
        if (!row) {
            this.dialogRef.close();
            return;
        }
        let rowRlt = this.wjH.getGridSelectecRow(this.itemlistg02);
        this.dialogRef.close((rowRlt) ? rowRlt : row);
    }

    gridRepaint() {
        setTimeout(() => {
            this.wjH.gridRedraw(this.itemlistg01);
            this.wjH.gridRedraw(this.itemlistg02);
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.itemlistg01.initialize({
            isReadOnly: true,
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.itemlistg01, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.itemlistg01);
                    if (!row) return;

                    this.DataSvc.serverDataGet('api/ItemMaint/GetListByItemID', {pfimid: row.fimid, pActive: true, pfcid: this.data.fcid}).subscribe((dataResponse) => {
                        this.wjH.gridLoad(this.itemlistg02, dataResponse);
                    });
                }
            },
            columns: [
                {binding: "fimid", header: "ID", width: 65, format: 'D'},
                {binding: "fitem", header: "Item", width: 180},
                {binding: "fdescription", header: "Description", width: 250},
                {binding: "fuomdescription", header: "UOM", width: 120},
                {binding: "funits", header: "# Units", width: 95},
                {binding: "fsaleprice", header: "Price", width: 80, format: 'c'},
                {binding: "fcategory", header: "Category", width: 140}
            ]
        });
        this.wjH.gridInit(this.itemlistg01, true);
        new wjGridFilter.FlexGridFilter(this.itemlistg01);
        this.itemlistg01.hostElement.addEventListener('dblclick', (e)=> {
            this.closeDialog();
        });
        
        // wj-flex-grid
        this.itemlistg02.initialize({
            isReadOnly: true,
            columns: [
                {binding: "fimid", header: "ID", width: 65, format: 'D'},
                {binding: "fitem", header: "Item", width: 180},
                {binding: "fdescription", header: "Description", width: 250},
                {binding: "fuomdescription", header: "UOM", width: 120},
                {binding: "funits", header: "# Units", width: 95},
                {binding: "fsaleprice", header: "Price", width: 80, format: 'c'},
                {binding: "fcategory", header: "Category", width: 140}
            ]
        });
        this.wjH.gridInit(this.itemlistg02, true);
        this.itemlistg02.hostElement.addEventListener('dblclick', (e)=> {
            this.closeDialog();
        });
    }
  }