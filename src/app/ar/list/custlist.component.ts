import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";

@Component({
    selector: 'dialog-custlist',
    templateUrl: './custlist.component.html',
  })
  export class CustomerList implements AfterViewInit {
    @ViewChild('custlistg01') custlistg01: WjFlexGrid;
    listGridSearch = new FormControl();
    searchType = 'N';
    gH01:number;
    listGridSearchRun = true;

    constructor(public dialogRef: MatDialogRef<CustomerList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService) {
        this.gH01 = (window.innerHeight * 0.95) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();
        
        this.listGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (!this.listGridSearchRun) return [];
                if (val == null) return [];
                if (this.searchType != "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerList', {
                    pActive: true,
                    pName: val,
                    pType: this.searchType
                });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.custlistg01, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    // Get Customer List
    listSearch() {
        this.listGridSearchRun = false
        this.listGridSearch.setValue('X');
        setTimeout(()=> {
            this.listGridSearch.setValue('');
            this.listGridSearchRun = true;
        }, 800);    
    }

    closeDialog() {
        let row = this.wjH.getGridSelectecRow(this.custlistg01);
        if (!row) {
            this.dialogRef.close();
            return;
        }
        this.dialogRef.close(row);
    }

    initGrids() {
        // wj-flex-grid
        this.custlistg01.initialize({
            isReadOnly: true,
            loadedRows: (s,e) => { // optional for readonly faster performance
                for (var i = 0; i < s.rows.length; i++) {
                    var row = s.rows[i].dataItem;
                    row.fphone = this.CompanySvc.phoneRenderer({value: row.fphone});
                }
            },
            columns: [
                {binding: "fcid", header: "ID", width: 65, format: 'D'},
                {binding: "fname", header: "Name", width: 300},
                {binding: "fresalecertificate", header: "Certificate", width: 150},
                {binding: "ccfname", header: "Contact", width: 250},
                {binding: "fphone", header: "Phone", width: 115},
                {binding: "cftype", header: "Type", width: 80},
                {binding: "fnotes", header: "Notes", width: 350}
            ]
        });
        this.wjH.gridInit(this.custlistg01, true);
        new wjGridFilter.FlexGridFilter(this.custlistg01);
        this.custlistg01.hostElement.addEventListener('dblclick', (e)=> {
            this.closeDialog();
        });
    }
  }