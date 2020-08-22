import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { DataEntryService, DataStore } from '../../../services/dataentry.service';
import { CompanyService } from '../../../services/company.service';
import { wjHelperService } from '../../../services/wjHelper.service';
import { DatePipe } from '@angular/common';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'customersalesbyitem',
    templateUrl: './customersalesbyitem.component.html',
    providers: [DataEntryService] // New instance gets created
})
export class customersalesbyitemComponent implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('custsalesbyitemg01', {static: true}) custmg01: WjFlexGrid;
    fdatef = new Date();
    fdatet = new Date();
    fdetails = false;
    fexcel = false;

    listGridSearch = new FormControl();
    listGridSearchRun = true;
    factive:boolean = true;
    ftype = 'N';
    
    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, public wjH: wjHelperService, private datePipe: DatePipe, private toastr: ToastrService) {
        this.listGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (!this.listGridSearchRun) return [];
                if (val == null) return [];
                if (this.ftype != "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerList', { pActive: this.factive, pName: val, pType: this.ftype });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.custmg01, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                //this.custmg01.autoSizeRows(); // Slows down
                this.CompanySvc.ofHourGlass(false);
                this.listGridSearchRun = true;
            });
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Customer List', 
            buttons: [
                {name: 'Report', icon: 'fa fa-print', style: 'primary', tooltip: 'Generate Report', action: 'print', val: null}
            ],
            rows: {grid: 'custmg01'}
        })
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM()
    }

    // barXX Events
    onClickNav(parm) {
        this.print();
    }

    print() {
        var row = this.wjH.getGridSelectecRow(this.custmg01);
        if (!row) {
            this.toastr.warning('Must select a customer from list.');
            return;
        }

        var mParms = 'pfcid=' + row.fcid +
            "&pdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
            "&pdatet=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd') +
            "&pshowdetail=" + this.fdetails.toString() +
            "&pexcel=" + this.fexcel.toString()
        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateJasperReport('CustomerSalesByItem.' + (this.fexcel ? 'xlsx': 'pdf'), mParms).subscribe((pResponse) => {
            // Open PDF or XLXS file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }

    // Get Customer List
    listSearch() {
        this.listGridSearchRun = false
        let val = this.listGridSearch.value;
        this.listGridSearch.setValue('X');
        setTimeout(()=> {
            this.listGridSearch.setValue('');
            this.listGridSearchRun = true;
        }, 800);
    }

    // Initialize Grid presentation (s/b on html)
    initGrids() {
        // wj-flex-grid
        this.custmg01.initialize({
            isReadOnly: true,
            loadedRows: (s,e) => { // optional for readonly faster performance
                for (var i = 0; i < s.rows.length; i++) {
                    var row = s.rows[i].dataItem;
                    row.fphone = this.CompanySvc.phoneRenderer({value: row.fphone});
                }
            },
            columns: [
                {binding: "fcid", header: "ID", width: 60, format: 'D'},
                {binding: "fname", header: "Name", width: 300},
                {binding: "fresalecertificate", header: "Certificate", width: 150},
                {binding: "ccfname", header: "Contact", width: 250},
                {binding: "fphone", header: "Phone", width: 130},
                {binding: "cftype", header: "Type", width: 85},
                {binding: "fnotes", header: "Notes", width: '*', wordWrap: true}
            ]
        });
        this.wjH.gridInit(this.custmg01, true);
        new wjGridFilter.FlexGridFilter(this.custmg01);
    }

}