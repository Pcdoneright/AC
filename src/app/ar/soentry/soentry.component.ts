import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import {FormControl} from "@angular/forms";
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
import * as wjGridX from "@grapecity/wijmo.grid.xlsx";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjcCore from '@grapecity/wijmo';
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { CustItemList } from '../../ar/list/custitemlist.component';
import { CustItemHistoryList } from '../../ar/list/custitemhistorylist.component';
import { soentrybaseClass } from './soentrybase';
import { SoPayment } from './sopayment.component';
import { itemmaintComponent } from '../../inventory/itemmaint/itemmaint.component';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { soProperties } from '../components/soproperties';
import { appHelperService } from '../../services/appHelper.service';

@Component({
    selector: 'soentry',
    templateUrl: './soentry.component.html',
    styleUrls: ['./soentry.component.css'],
    providers: [DataEntryService],
    encapsulation: ViewEncapsulation.None
})
export class SoentryComponent extends soentrybaseClass implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('bar03', {static: true}) bar03: pcdrBuilderComponent;
    @ViewChild('bar04', {static: true}) bar04: pcdrBuilderComponent;
    @ViewChild('soproperties01', {static: true}) soproperties01: soProperties;
    selectedTab:number = 0;
    
    listCustomerGridSearch = new FormControl();
    factive:boolean = true;
    ctype:string = 'N';

    sotype:string = 'C';
    sostatus:string = 'S';
    sodatef:Date = new Date();
    sodatet:Date = new Date();
    orderstatus:any [];
    
    showMoreEdit:boolean;
    fitem:string;
    @ViewChild('fitemE') fitemE: ElementRef;
    
    tH01:number;
    defDepartment:number = 2; // TODO: s/b from companymstr

    // objects, DS, Grids, arrays
    @ViewChild('soeg01', {static: true}) listCustomerGrid: WjFlexGrid;
    @ViewChild('soeg02', {static: true}) listSOGrid: WjFlexGrid;
    @ViewChild('soeg03', {static: true}) salesdetailsGrid: WjFlexGrid;
    // @ViewChild('soeg04') salespaymentsGrid: WjFlexGrid;
    soCurrent: any = {finvoice_date: new Date(), fshipdate: new Date()}; // Wijmo throws error if null values
    customerterms:any[];
    representatives:any[];
    companylocations:any[];
    // public get mfshipdate() : Date { return this.salesordersFG.controls['fshipdate'].value; }
    // public set mfshipdate(value) { this.salesordersFG.controls['fshipdate'].setValue(value); }

    constructor(CompanySvc: CompanyService, DataSvc: DataService, dESrvc: DataEntryService,
        toastr: ToastrService, sharedSrvc: SharedService, dialog: MatDialog, $filter: PcdrFilterPipe,
        public wjH: wjHelperService, companyRules: CompanyRulesService, public appH: appHelperService) {

        super(CompanySvc, DataSvc, dESrvc, toastr, sharedSrvc, dialog, $filter, companyRules, appH);
        this.sharedSrvc.setProgramRights(this, 'soentry'); // sets fupdate, fadmin

        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.orderOrigin = 'SO';
        this.sodatef.setHours(12, 0, 0); // set hours to noon always
        this.sodatet.setHours(12, 0, 0);

        // Add more Validation as per Bruce 2019/08/30
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'fponumber', 'PO NUMBER');
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'fshipdate', 'SHIP DATE');

        // Get Customer Terms for DropDown
        DataSvc.serverDataGet('api/CustomerMaint/GetCustomerTermsDD').subscribe((dataResponse) => {
            this.customerterms = dataResponse;
        });

        // Get Representative for DropDown
        DataSvc.serverDataGet('api/RepresentativeMaint/GetRepresentativeDD').subscribe((dataResponse) => {
            this.representatives = dataResponse;
        });

        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
        });

        // Search Customer List
        this.listCustomerGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (val == null) return [];
                if (this.ctype != "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerList', { pActive: this.factive, pName: val, pType: this.ctype });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.listCustomerGrid, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Order Properties', 
            buttons: [
                {name: 'New Order', style: 'primary', action: 'listGridCreate'}
            ],
            rows: {grid: 'listCustomerGrid'}, 
            navButtons: [
                {name: 'Entry', action: 'selectedTab', val: 1}
            ]
        })
        
        this.bar02.setNavProperties(this, {
            title: 'Order List', 
            buttons: [
                {name: 'Edit Selected', style: 'success', action: 'listSOGridEdit'},
                {name: '', style: 'secondary', icon: 'fas fa-file-excel', tooltip: 'Export List To Excel', action: 'exportToXcel'}
            ],
            rows: {grid: 'listSOGrid'}
        })
        
        this.bar03.setNavProperties(this, {
            title: 'Properties', 
            buttons: [
                {name: 'Save', style: 'primary', action: 'update', val: null},
                {name: ' Payments', style: 'warning', icon: 'fa fa-money', action: 'payment'},
                {name: 'Invoice', style: 'success', action: 'complete', val: true},
                {name: 'Void', show: this.fadmin, style: 'danger', action: 'voidSO'},
                {name: ' Packing', style: 'light', icon: 'fa fa-print', action: 'printSO', val: 'P'},
                {name: ' Receipt', style: 'light', icon: 'fa fa-print', action: 'printSO', val: 'I'}
            ],
            validEntry: true,
            navButtons: [
                {name: 'List', action: 'selectedTab', val: 0}
            ],
            chevron: {action: 'editMore', show: 'showMoreEdit'},
            search: {action: 'searchSONumber', ngModel: 'searchId', placeholder: 'Order Number', val: true}
        })
        
        this.bar04.setNavProperties(this, {
            title: 'Details', 
            buttons: [
                {name: ' Add', style: 'success', icon: 'fa fa-plus', action: 'salesdetailsAdd'},
                {name: ' Remove', style: 'danger', icon: 'fa fa-minus-circle', action: 'salesdetailsRemove'},
                {name: ' Add From Favorites', style: 'light', icon: 'fa fa-star', action: 'addCustomerItems', tooltip:"Customer's Favorites List"},
                {name: 'Item Options', style: 'light', action: 'itemOptions', tooltip: "View Selected Item Alternatives"},
                {name: 'History', style: 'light', action: 'viewHistory', tooltip: "View Selected Item History"},
                {name: ' Save To Favorites', style: 'primary', icon: 'fa fa-star', action: 'saveFavorites', tooltip: "Save Items to Customer's Favorites with current Price"},
                {name: '  Item Maintenance', show: this.fadmin, style: 'secondary', icon: 'fa fa-gear', action: 'editItemmaint', tooltip: "Open Item Maintenance for selected Item"}
            ],
            rows: {grid: 'salesdetailsGrid'}
        })

        this.soproperties01.setProperties(this);
    }

    editItemmaint() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return;

        // Open Itemmaint, retrieve record
        let ret = this.sharedSrvc.openTask('itemmaintenance');
        if (ret) {
            // Wait for constructor()
            setTimeout(() => {
                let itm:itemmaintComponent = ret.component;
                if (itm) {
                    itm.selectedTab = 1;
                    itm.retrieveItem(row.fimid);
                }
            }, 150);
        }
    }

    // Open Payment Interface
    payment() {
        if (!this.validEntry()) return;
        
        this.dialog.open(SoPayment, {data: this}).afterClosed().subscribe(dataResponse => {
            // Complete
            if (dataResponse) {
                this.complete(true);
            }
        });
    }
   
    ngOnDestroy() {
    }

    // ngAfterContentInit() {
    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            // this.salespaymentsGrid.columns[1].dataMap = new wjGrid.DataMap(this.$filter.transform(dataResponse, {fgroupid: 'CPT'}, true), 'fid', 'fdescription');
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'SOS'}, true);
            this.orderstatus.unshift({fid: 'A', fdescription: 'All'}); // Add All
        }); // when codetable is needed
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

    // After salesorders.fdiscountp calculate totals
    onfdiscountp(event) {
        if (!this.validEntry()) return;
        var newval = this.CompanySvc.validNumber(event.srcElement.value, 2); // Convert to number
        if (newval == this.soCurrent.fdiscountp) return; // no changes exit
        
        this.soCurrent.fdiscountp = newval;
        this.salesordersTotals();
    }

    // Get Customer List
    listCustomerGridRefresh() {
        this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerList', { pActive: this.factive, pName: '', pType: 'A' })
            .subscribe(results => {
                this.wjH.gridLoad(this.listCustomerGrid, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    listSOGridRefresh() {
        if (this.sotype === 'C' && !this.wjH.getGridSelectecRow(this.listCustomerGrid)) {
            this.toastr.warning('Customer must be selected');
            return;
        }

        var fcid = (this.sotype === 'C') ? this.wjH.getGridSelectecRow(this.listCustomerGrid).fcid : 0;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/SO/GetSOList', {
            psotype: this.sotype,
            pfcid: fcid,
            pdatef: this.sodatef,
            pdatet: this.sodatet,
            pfstatus: this.sostatus
        }).subscribe((dataResponse) => {
            this.wjH.gridLoad(this.listSOGrid, dataResponse);
            this.listSOGridTotal();

            if (dataResponse.length === 0) this.toastr.info('No Rows found');
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listGridCreate() {
        let row = this.wjH.getGridSelectecRow(this.listCustomerGrid);
        if (!row) return;
        
        this.createSO(row, this.defDepartment); // Department=2 TODO: Department from cmpny
        this.selectedTab = 1;
        this.gridRepaint();
    };
    
    listSOGridEdit() {
        let row = this.wjH.getGridSelectecRow(this.listSOGrid);
        if (!row) return;

        this.dESrvc.pendingChangesContinue().then(() => {
            this.retrieveSO(row.fsoid);
            this.selectedTab = 1;
            this.gridRepaint();
        }).catch(()=>{});
    };

    // Extend to Fill grid with data
    postRetrieveSO() {
        this.soCurrent = this.salesorders.items[0]; // pointer
        this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
        // this.wjH.gridLoad(this.salespaymentsGrid, this.salespayments.items);
    }

    // Override to check if changes are pending
    createSO(customer, department) {
        this.dESrvc.pendingChangesContinue().then(() => {
           super.createSO(customer, department);
        }).catch(()=>{});
    }

    // Extend to Clear grid with data
    postCreateSO() {
        this.soCurrent = this.salesorders.items[0]; // pointer
        this.wjH.gridLoad(this.salesdetailsGrid, []);
        // this.wjH.gridLoad(this.salespaymentsGrid, []);
    }

    printSO(pType:string) {
        if (!this.validEntry()) return;

        this.CompanySvc.ofHourGlass(true);

        var mParms = [
            {fline: 1, fnumber: this.soCurrent.fsoid}
        ];

        var rpt = (pType == 'I') ? 'd_salesorder_invoice_rpt' : 'd_salesorder_packinglist_rpt';
        this.CompanySvc.ofCreateReport(rpt, mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }

    // Show more/less properties
    toggleShowMoreEdit() {
        this.showMoreEdit = !this.showMoreEdit;
        this.onResize(null);
        this.gridRepaint();
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (!this.fitem) return;
        if (this.fitem.length < 3) return false;

        this.salesdetailsAddItemByFitem(this.fitem, false).subscribe((row) => {
            if (row) {
                this.fitem = ''; // Clear value
                this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
                // this.wjH.gridScrollToRow(this.salesdetailsGrid, -1, 0); // No-focus only scroll
                // this.wjH.gridScrollToLastRow(this.salesdetailsGrid, 2); // No-focus only scroll
                this.wjH.gridScrollToRow( this.salesdetailsGrid, -1, 0, 'fsodid', row.fsodid); // No-focus only scroll
                setTimeout(()=> { this.fitemE.nativeElement.focus();});
            }
        });
    }

    addCustomerItems() {
        if (!this.validEntry()) return;

        let pData = { fcid: this.soCurrent.fcid };
        this.dialog.open(CustItemList, {data: pData}).afterClosed().subscribe(dataResponse => {
            if (!dataResponse) return;

            var calcTotal = false;
            // Add items with valid cqty
            for (var i = 0; i < dataResponse.length; i++) {
                if (dataResponse[i].cqty > 0) {
                    this.salesdetailsAddItem(dataResponse[i], false, false);
                    calcTotal = true;
                }
            }

            this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
            if (calcTotal) this.salesordersTotals();
        });
    }

    viewHistory() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return;
        
        let pData = { 
            fcid: this.soCurrent.fcid,
            fitem: row.fitem
         };
        this.dialog.open(CustItemHistoryList, {data: pData}); //.afterClosed().subscribe();
    }

    salesdetailsAdd() {
        if (!this.validEntry()) return;

        let pData = { fcid: this.soCurrent.fcid };
        this.dialog.open(ItemList, {data: pData}).afterClosed().subscribe(dataResponse => {
            if (!dataResponse) return;
            //-->dataResponse.fcost = 0; // Force non-existing value
            let row = this.salesdetailsAddItem(dataResponse, true, false); //  Add selection to salesdetails
            this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
            // this.wjH.gridScrollToLastRow(this.salesdetailsGrid, 3); // park on Price
            this.wjH.gridScrollToRow( this.salesdetailsGrid, -1, 0, 'fsodid', row.fsodid); // No-focus only scroll
            setTimeout(()=> { this.fitemE.nativeElement.focus();});
        });
    }

    // salespaymentsAdd() {
    //     if (!this.validEntry()) return;
    //     if (this.salesorders.items[0].fbalance == 0) return; // Exit if balance = 0

    //     this.salespaymentsAddItem('CSH', 'Cash', this.salesorders.items[0].fbalance); //  Add row with remaining balance
    //     this.wjH.gridLoad(this.salespaymentsGrid, this.salespayments.items);
    //     this.wjH.gridScrollToLastRow(this.salespaymentsGrid, 1);
    //     this.salesordersTotals();
    // }

    // salespaymentsRemove(event) {
    //     if (!this.validEntry()) return;
    //     let row = this.wjH.getGridSelectecRow(this.salespaymentsGrid);
    //     if (!row) return;

    //     var ptype = row.ftype; // Payment type
    //     this.salespayments.removeRow(row).subscribe(() => {
    //         // Reset Taxable flag when FoodStamp is removed
    //         if (ptype == 'FS') {this.salesdetailsResetTaxable()}
    //         this.salesordersTotals();
    //         this.wjH.gridLoad(this.salespaymentsGrid, this.salespayments.items);
    //     });
    // }

    // Show related items
    itemOptions() {
        if (!this.validEntry()) return;
        var row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return; // No selected row

        this.showItemOptions(row).subscribe(() => this.salesdetailsGrid.refresh());
    }

    salesdetailsRemove() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return;

        this.salesdetails.removeRow(row).subscribe(() => {
            this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
            this.salesordersTotals();
        });
    }

    saveFavorites() {
        if (!this.validEntry()) return;
        this.CompanySvc.ofHourGlass(true);
        // Create array
        var favorites = [];
        for (var i = 0; i < this.salesdetails.items.length; i++) {
            favorites.push({
                fitem: this.salesdetails.items[i].fitem, 
                fcid: this.soCurrent.fcid,
                fprice: this.salesdetails.items[i].fprice
            });
        }
        // Save
        this.DataSvc.serverDataPost('api/SO/PostFavorites', favorites).subscribe((dataResponse) => {
            this.toastr.success("Customer's Favorites Saved.");
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listSOGridTotal() {
        var ftotal = 0, fbalance = 0;

        this.listSOGrid.itemsSource.forEach((row) => {
            if (row.fstatus !== 'V') {
                ftotal += row.ftotal;
                fbalance += row.fbalance;
            }
        });
        this.listSOGrid.columnFooters.setCellData(0, 'ftotal', ftotal);
        this.listSOGrid.columnFooters.setCellData(0, 'fbalance', fbalance);
    }

    exportToXcel() {
        if (this.listSOGrid.rows.length == 0) return;
        
        let xcel = wjGridX.FlexGridXlsxConverter.save(this.listSOGrid, {
            includeColumnHeaders: true,
            includeRowHeaders: true
        });

        xcel.sheets[0].name = "Sales Order List";
        xcel.saveAsync('SalesOrderList.xlsx');
    }

    onResize(event) {
        // setTimeout(() => {
            this.tH01 = window.innerHeight - 55;
        // }, 100);
    }

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            switch (this.selectedTab) {
                case 0:
                    this.wjH.gridRedraw(this.listCustomerGrid);
                    this.wjH.gridRedraw(this.listSOGrid);
                    break;
                case 1:
                    this.wjH.gridRedraw(this.salesdetailsGrid);
                    break;
                // case 2:
                //     this.wjH.gridRedraw(this.salespaymentsGrid);
                //     break;
            }
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.listCustomerGrid.initialize({
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
        this.wjH.gridInit(this.listCustomerGrid, true);
        this.listCustomerGrid.hostElement.addEventListener('dblclick', (e)=> { 
            this.sotype = 'C';
            this.listSOGridRefresh();
        });
        new wjGridFilter.FlexGridFilter(this.listCustomerGrid);

        // wj-flex-grid
        this.listSOGrid.initialize({
            isReadOnly: true,
            columns: [
                { binding: "fdocnumber", header: "S.O.#", width: 100, format:'D' },
                { binding: "fdate", header: "Date", width: 100, format:'MM/dd/yyyy' },
                { binding: "finvoice_date", header: "Invoiced", width: 120, format:'MM/dd/yyyy' },
                { binding: 'cfstatus', header: 'Status', width: 100 },
                { binding: 'fname', header: 'Customer', width: '*' },
                { binding: 'fponumber', header: 'PO Number', width: 200 },
                { binding: 'ftotal', header: 'Total', width: 130, format: 'c' },
                { binding: 'fbalance', header: 'Balance', width: 130, format: 'c' }
            ]
        });
        this.wjH.gridInit(this.listSOGrid, true);
        this.listSOGrid.columnFooters.rows.push(new wjGrid.GroupRow());
        this.listSOGrid.hostElement.addEventListener('dblclick', (e)=> {
            this.listSOGridEdit();
        });
        new wjGridFilter.FlexGridFilter(this.listSOGrid);

        // wj-flex-grid
        this.salesdetailsGrid.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'cextended':
                        case 'fprice':
                            if (row.cfmarkup < this.minMarkup || row.fprice <= 0) {
                                wjcCore.toggleClass(e.cell, 'alert-row', true);
                            }
                            break;
                        case 'cunit':
                            e.cell.textContent = this.CompanySvc.currencyRenderer({value: this.CompanySvc.r2d(row.fprice / row.funits)});
                            break;
                    }
                }
            },
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

                switch (col.binding) {
                    case 'fqty':
                    case 'fprice':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            this.salesdetailsComputed(rec, rec.fprice, rec.fqty);
                            this.salesordersTotals();
                            rec.cfmarkup = this.companyRules.markupCalculate(rec.fprice, rec.funits, rec.fsalesbase);
                        }
                        break;
                }
            },
            columns: [
                { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                { binding: "cfitem", header: "UOM", width: 150, isReadOnly: true},
                { binding: "fdescription", header: "Description", width: '*'},
                { binding: "fprice", header: "Price", format: 'c', width: 80, },
                { binding: "cunit", header: "@Unit", dataType: 'Number', format: 'c', width: 80, isReadOnly: true },
                // { binding: "cfmarkup", header: "Markup%", width: 80, isReadOnly: true },
                { binding: "fqty", header: "Qty", width: 80, aggregate: 'Sum' },
                { binding: "fistaxable", header: "Tax", width: 70, isReadOnly: true },
                { binding: "cextended", header: "Extended", width: 100, format: 'c', isReadOnly: true },
                { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', isReadOnly: true }
            ]
        });
        this.wjH.gridInit(this.salesdetailsGrid);
        this.salesdetailsGrid.columnFooters.rows.push(new wjGrid.GroupRow());

        // wj-flex-grid
        // this.salespaymentsGrid.initialize({
        //     cellEditEnding: (s, e) => {
        //         var col = s.columns[e.col];
        //         var rec = s.rows[e.row].dataItem;
        //         if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

        //         switch (col.binding) {
        //             case 'famount':
        //                 var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
        //                 if (newval != rec[col.binding]) {
        //                     // Except for cash, value cannot exceed balance
        //                     if (rec.ftype !== 'CSH') {
        //                         //rowEntity.famount = Math.min(rowEntity.famount, this.salesorders.items[0].fbalance + oldValue);
        //                         rec.famount = Math.min(newval, this.salesorders.items[0].fbalance + rec.famount);
        //                     }
        //                     this.salesordersTotals();
        //                 }
        //                 break;
        //         }
        //     },
        //     columns: [
        //         { binding: "fdate", header: "Date", format: "MM/dd/yyyy", width: 130, isReadOnly: true },
        //         { binding: "ftype", header: "Type", width: 150, },
        //         { binding: "famount", header: "Amount", width: 120, format: 'c' },
        //         { binding: "freference", header: "Reference", width: 200}
        //     ]
        // });
        // this.wjH.gridInit(this.salespaymentsGrid);
    }
}