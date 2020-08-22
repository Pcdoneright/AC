import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import { pcdrBuilderComponent } from '../../services/builder/builder.component';

@Component({
    selector: 'poreceive',
    templateUrl: './poreceive.component.html',
    providers: [DataEntryService],
})
export class PoreceiveComponent implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('bar03', {static: true}) bar03: pcdrBuilderComponent;
    @ViewChild('purchasedetailsGrid', {static: true}) purchasedetailsGrid: WjFlexGrid;
    @ViewChild('listPOGrid', {static: true}) listPOGrid: WjFlexGrid;
    @ViewChild('fitemE') fitemE: ElementRef;
    tH01:number;
    showMoreEdit = false;
    poCurrent: any = {};
    fshipto: string;
    fitem:string;
    selectedTab:number = 0;
    searchId = '';
    orderstatus:any [];

    purchaseorders:DataStore;
    purchasedetails:DataStore;
    companylocations: any[];
    
    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dESrvc: DataEntryService, 
        private toastr: ToastrService, public sharedSrvc: SharedService, private $filter: PcdrFilterPipe, 
        public wjH: wjHelperService) {
        
        this.sharedSrvc.setProgramRights(this, 'poreceive'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        // Data Stores, Unique Keys, updatable, validate fields
        this.purchaseorders = this.dESrvc.newDataStore('purchaseorders', ['fpoid'], true, ['fvcid', 'fshipto']);
        this.purchasedetails = this.dESrvc.newDataStore('purchasedetails', ['fpoid', 'fpodid'], true, ['fdescription', 'fvitem']);
        this.dESrvc.validateDataStore('purchaseorders', 'PROPERTIES', 'fvcid', 'CONTACT');
        this.dESrvc.validateDataStore('purchaseorders', 'PROPERTIES', 'fshipto', 'SHIP TO');
        this.dESrvc.validateDataStore('purchasedetails', 'DETAILS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('purchasedetails', 'DETAILS', 'fvitem', 'VENDOR ITEM');

        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
            this.companylocations.unshift({fcmpid: 1, fcmplid: 0, fname: "All"}); // Add first item
            this.fshipto = this.sharedSrvc.user.flocation; // Assign user location
        });

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'POS'}, true);
            this.orderstatus.unshift({fid: 'A', fdescription: 'All'}); // Add All
        });
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Purchase Order List', 
            buttons: [
                {name: 'Edit Selected', style: 'success', tooltip: 'Selected', action: 'listPOGridEdit'}
            ],
            rows: {grid: 'listPOGrid'}, 
            navButtons: [
                {name: 'Entry', action: 'selectedTab', val: 1}
            ]
        })

        this.bar02.setNavProperties(this, {
            title: 'PO Properties', 
            buttons: [
                {name: 'Complete', style: 'success', action: 'update'},
                {name: ' Receipt', style: 'light', icon: 'fa fa-print', action: 'printPO'}
            ],
            validEntry: true,
            navButtons: [
                {name: 'List', action: 'selectedTab', val: 0},
            ],
            chevron: {action: 'editMore', show: 'showMoreEdit'},
            search: {action: 'searchPONumber', ngModel: 'searchId', placeholder: 'PO Number', }
        })

        this.bar03.setNavProperties(this, {
            title: 'Details', 
            buttons: [
                {name: 'Change Qty', style: 'primary', action: 'editQty'}
            ],
            rows: {grid: 'purchasedetailsGrid'}
        })
    }

    // barXX Events
    onClickNav(parm) {
        switch(parm.action) {
            case 'selectedTab':
                this.selectedTab = parm.val;
                if (this.selectedTab == 2) {
                    this.onResize(null);
                    this.gridRepaint();
                }
                break;
            case 'editMore':
                this.showMoreEdit = !this.showMoreEdit;
                this.onResize(null);
                this.gridRepaint();
                break;                
            default:
                this[parm.action](parm.val);
                break;
        }
    }

    editQty() {
        if (!this.validEntry()) { this.focusToScan(); return };
        var row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        if (!row) { this.focusToScan(); return }; // No selected row

        this.CompanySvc.inputDialog('Qty', row['freceivedqty'], 'Receving Quantity', 'Continue', 'Cancel', false, true, false, 'inputDialogQty', this).subscribe(() => {
            this.focusToScan();
        });
    }
    
    inputDialogQty(val) {
        let amt = this.CompanySvc.validNumber(val); // Will make it at least 0
        console.log('amt', amt);
        if (amt < 0) {
            this.toastr.warning('Quantity cannot be negative!');
            return false
        }

        var row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        row.freceivedqty = amt;
        this.purchasedetailsComputed(row, row.freceivedqty);
        this.purchasedetailsGrid.refresh(false);
        return true;
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();
    }

    validEntry() {
        return (this.purchaseorders.items.length == 1);
    }

    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        
        if (this.purchaseorders.items[0].fstatus !== 'O') {
            this.toastr.info('Only OPEN orders can be modified.');
            return;
        }

        if (this.dESrvc.validate() !== '')  return;
        this.CompanySvc.ofHourGlass(true);

        // Set date if not set
        if (!this.purchaseorders.items[0].freceivedate) {
            this.purchaseorders.items[0].freceivedate = new Date();
            this.purchaseorders.items[0].freceivedate.setHours(12, 0, 0);// Remove time
        }

        // Last Update
        this.purchaseorders.items[0].ts = new Date();
        this.purchaseorders.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/PO/Postupdate').subscribe((dataResponse) => {
            this.printPO();
            // this.CompanySvc.ofHourGlass(false);
        });
    }

    // Calculate purchasedetails computed fields 1 row
    purchasedetailsComputed(row, freceivedqty) {
        row.cweight = freceivedqty * row.fweight;
    }

    listPOGridRefresh() {
        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetPOOpenList', { pfshipto: this.fshipto }).subscribe(results => {
            this.wjH.gridLoad(this.listPOGrid, results);
            if (results.length === 0) this.toastr.info('No Rows found');
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listPOGridEdit() {
        let row = this.wjH.getGridSelectecRow(this.listPOGrid);
        if (!row) return;

        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.retrievePO(row.fpoid);
            this.selectedTab = 1;
            this.focusToScan();
        });
    };

    searchPONumber() {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetValidatePonumber', {pfponumber: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0) {
                if (dataResponse[0].fstatus !== 'O') {
                    this.toastr.info('Only OPEN orders can be modified.');
                }
                this.dESrvc.pendingChangesContinue().subscribe(() => {
                    this.retrievePO(dataResponse[0].fpoid);
                    this.searchId = '';
                });
            }
            else
                this.toastr.info('P.O. Number Not Found');

            this.CompanySvc.ofHourGlass(false);
        });
    }

    retrievePO(afpoid:number):void {
        if (!afpoid) return;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetPO', {pfpoid: afpoid}).subscribe((dataResponse) => {
            this.purchaseorders.loadData(dataResponse.purchaseorders);
            this.purchasedetails.loadData(dataResponse.purchasedetails);
            this.poCurrent = this.purchaseorders.items[0]; // pointer
            this.wjH.gridLoad(this.purchasedetailsGrid, this.purchasedetails.items);
            // Calculate Computed Columns
            this.purchasedetailsComputedAll();

            this.focusToScan();
            this.CompanySvc.ofHourGlass(false);
        });
    }

    // Calculate purchasedetails computed fields for all rows
    purchasedetailsComputedAll() {
        this.purchasedetails.items.forEach((item) => {
            this.purchasedetailsComputed(item, item.freceivedqty);
        });
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (!this.fitem) return;
        // if (this.fitem.length < 3) return false;

        var row = this.$filter.transform(this.purchasedetails.items, {fitem: this.fitem}, true);
        if (row.length == 0) {row = this.$filter.transform(this.purchasedetails.items, {fvitem: this.fitem}, true)}
        
        if (row.length > 0) {
            this.fitem = ''; // Clear value
            row[0].freceivedqty += 1; // Increment Qty
            this.purchasedetailsComputed(row[0], row[0].freceivedqty);
            this.purchasedetailsGrid.refresh();
            this.wjH.gridScrollToRow(this.purchasedetailsGrid, -1, 0, 'fpodid', row[0].fpodid); // No-focus only scroll
        }
        else {
            this.toastr.error('Item NOT FOUND!','', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
        }
        
        this.focusToScan();
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }

    printPO() {
        if (!this.validEntry()) return;
        this.CompanySvc.ofHourGlass(true);

        var mParms = 'pfpoid=' + this.poCurrent.fpoid;
        this.CompanySvc.ofCreateJasperReport('POReceive.pdf', mParms).subscribe((pResponse) => {
            this.CompanySvc.ofHourGlass(false);
            // Print PDF file
            setTimeout(() => {
                this.CompanySvc.printPDFserverFile(pResponse.data, this);
            }, 1000);
        });
    }

    onResize(event) {
        this.tH01 = window.innerHeight - 55;
    }

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            switch (this.selectedTab) {
                case 0:
                    this.wjH.gridRedraw(this.listPOGrid);
                    break;
                case 1:
                    this.wjH.gridRedraw(this.purchasedetailsGrid);
                    break;
            }
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.listPOGrid.initialize({
            isReadOnly: true,
            columns: [
                { binding: "fponumber", header: "PO#", width: 80, format:'D', align: "left" },
                { binding: "fdate", header: "Date", width: 100, format:'MM/dd/yyyy' },
                { binding: "freceivedate", header: "Received", width: 120, format:'MM/dd/yyyy' },
                { binding: 'cfstatus', header: 'Status', width: 100 },
                { binding: 'cfname', header: 'Vendor', width: '*', minWidth: 100 }
            ]
        });
        this.wjH.gridInit(this.listPOGrid, true);
        this.listPOGrid.hostElement.addEventListener('dblclick', (e)=> {
            this.listPOGridEdit();
        });
        new wjGridFilter.FlexGridFilter(this.listPOGrid);

        // wj-flex-grid
        this.purchasedetailsGrid.initialize({
            isReadOnly: true,
            // cellEditEnding: (s, e) => {
            //     var col = s.columns[e.col];
            //     var rec = s.rows[e.row].dataItem;
            //     if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

            //     switch (col.binding) {
            //         case 'freceivedqty':
            //             var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
            //             if (newval != rec[col.binding]) {
            //                 rec[col.binding] = newval;
            //                 this.purchasedetailsComputed(rec, rec.freceivedqty);
            //             }
            //             break;
            //     }
            // },
            columns: [
                { binding: "fitem", header: "Item Number", width: 200},
                { binding: "fvitem", header: "Vendor Item", width: 200},
                { binding: "fdescription", header: "Description", width: '*', minWidth: 100},
                { binding: "fqty", header: "Qty", width: 80, aggregate: 'Sum'},
                { binding: "freceivedqty", header: "Received", width: 80, aggregate: 'Sum' },
                { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', align: "right"},
                { binding: "fexpirationdate", header: "Exp Date", format: 'MM/dd/yyyy', width: 130 },
                { binding: "floc1", header: "Aisle", width: 80},
                { binding: "floc1", header: "Row", width: 80},
                { binding: "floc1", header: "Column", width: 80}
            ]
        });
        this.wjH.gridInit(this.purchasedetailsGrid);
        // add custom editors to the grid
        this.wjH.gridCreateEditor(this.purchasedetailsGrid.columns.getColumn('fexpirationdate'), 'Date');
        this.purchasedetailsGrid.columnFooters.rows.push(new wjGrid.GroupRow());
    }
}
