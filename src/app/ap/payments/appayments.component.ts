import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { OrderByPipe } from 'ngx-pipes';
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjGridX from "@grapecity/wijmo.grid.xlsx";

@Component({
    selector: 'appayments',
    templateUrl: './appayments.component.html',
    providers: [DataEntryService, OrderByPipe],
})
export class AppaymentsComponent implements OnDestroy, AfterViewInit {
    tH01:number;
    poCurrent: any = {};

    listVendorGridSearch = new FormControl();
    factive:boolean = true;
    vtype = 'V';
    potype = 'V';
    searchId = '';
    searchItemType = 'I'; // Initial value only for ItemList
    podatef:Date = new Date();
    podatet:Date = new Date();

    purchaseorders:DataStore;
    purchasedetails:DataStore;
    @ViewChild('poeG01', {static: true}) listVendorGrid: WjFlexGrid;
    @ViewChild('poeG02', {static: true}) listPOGrid: WjFlexGrid;
    
    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dESrvc: DataEntryService, 
        private toastr: ToastrService, public sharedSrvc: SharedService, private dialog: MatDialog, 
        private $filter: PcdrFilterPipe, private OrderByPipe: OrderByPipe, public wjH: wjHelperService, 
        private companyRules: CompanyRulesService) {
        
        this.sharedSrvc.setProgramRights(this, 'poentry'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.podatef.setHours(12, 0, 0);
        this.podatet.setHours(12, 0, 0);

        // Search Vendor List
        this.listVendorGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (val == null) return [];
                if (this.vtype !== "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/VendorMaint/GetVendorList', { pActive: this.factive, pName: val, pType: this.vtype });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.listVendorGrid, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();
    }

    listVendorGridRefresh() {
        this.DataSvc.serverDataGet('api/VendorMaint/GetVendorList', { pActive: this.factive, pName: '', pType: 'A' })
            .subscribe(results => {
                this.wjH.gridLoad(this.listVendorGrid, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    listPOGridRefresh() {
        if (this.potype === 'V' && !this.wjH.getGridSelectecRow(this.listVendorGrid)) {
            this.toastr.warning('Vendor must be selected');
            return;
        }

        var fvid = (this.potype == 'V') ? this.wjH.getGridSelectecRow(this.listVendorGrid).fvid : 0;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetPOPaymentList', {
            ppotype: this.potype,
            pfvid: fvid,
            pdatef: this.podatef,
            pdatet: this.podatet,
        }).subscribe((dataResponse) => {
            this.wjH.gridLoad(this.listPOGrid, dataResponse);
            this.listPOGridTotal();

            if (dataResponse.length === 0) this.toastr.info('No Rows found');
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listPOGridTotal() {
        var ftotal = 0, fbalance = 0, fpayments = 0;

        this.listPOGrid.itemsSource.forEach((row) => {
            if (row.fstatus !== 'V') {
                ftotal += row.ftotal;
                fbalance += row.fbalance;
                fpayments += row.famount;
            }
        });
        this.listPOGrid.columnFooters.setCellData(0, 4, fpayments);
        // this.listPOGrid.columnFooters.setCellData(0, 8, ftotal);
        // this.listPOGrid.columnFooters.setCellData(0, 9, fbalance);
    }

    exportToXcel() {
        if (this.listPOGrid.rows.length == 0) return;
        
        let xcel = wjGridX.FlexGridXlsxConverter.save(this.listPOGrid, {
            includeColumnHeaders: true,
            includeRowHeaders: true
        });

        xcel.sheets[0].name = "P.O. Payment History";
        xcel.saveAsync('appayments.xlsx');
    }

    onResize(event) {
        this.tH01 = window.innerHeight - 55;
    }

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            this.wjH.gridRedraw(this.listPOGrid);
            this.wjH.gridRedraw(this.listVendorGrid);
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.listVendorGrid.initialize({
            isReadOnly: true,
            loadedRows: (s,e) => { // optional for readonly faster performance
                for (var i = 0; i < s.rows.length; i++) {
                    var row = s.rows[i].dataItem;
                    row.fphone = this.CompanySvc.phoneRenderer({value: row.fphone});
                }
            },
            columns: [
                {binding: "fvid", header: "ID", width: 60, format: 'D'},
                {binding: "fname", header: "Name", width: '*'},
                {binding: "faddress1", header: "Address", width: 250},
                {binding: "vcfname", header: "Contact", width: 250},
                {binding: "fphone", header: "Phone", width: 130},
                {binding: "cftype", header: "Type", width: 85},
                {binding: "fcustomerid", header: "Cust. ID", width: 120}
            ]
        });
        this.wjH.gridInit(this.listVendorGrid, true);
        this.listVendorGrid.hostElement.addEventListener('dblclick', (e)=> { 
            this.potype = 'V';
            this.listPOGridRefresh();
        });
        new wjGridFilter.FlexGridFilter(this.listVendorGrid);

        // wj-flex-grid
        this.listPOGrid.initialize({
            isReadOnly: true,
            columns: [
                { binding: "fponumber", header: "PO#", width: 80, format:'D', align: "left" },
                { binding: "fdate", header: "Date", width: 100, format:'MM/dd/yyyy' },
                { binding: 'cfstatus', header: 'Status', width: 100 },
                { binding: "pfdate", header: "Payment", width: 100, format:'MM/dd/yyyy' },
                { binding: 'famount', header: 'Total', width: 130, format: 'c' },
                { binding: 'cftype', header: 'Type', width: 100 },
                { binding: 'freference', header: 'Reference', width: 120 },
                { binding: 'fname', header: 'Vendor', width: '*', minWidth: 100 },
                { binding: 'ftotal', header: 'Total', width: 130, format: 'c' },
                { binding: 'fbalance', header: 'Balance', width: 130, format: 'c', align: "right" }
            ]
        });
        this.wjH.gridInit(this.listPOGrid, true);
        this.listPOGrid.columnFooters.rows.push(new wjGrid.GroupRow());
        new wjGridFilter.FlexGridFilter(this.listPOGrid);
    }
}
