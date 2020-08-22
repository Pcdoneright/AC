import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import * as wjGridX from "@grapecity/wijmo.grid.xlsx";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjcCore from '@grapecity/wijmo';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { FunctionCall } from '@angular/compiler';
import { BreakPoint } from '@angular/flex-layout';

@Component({
    selector: 'custmaint',
    templateUrl: './custmaint.component.html',
    providers: [DataEntryService]
})
export class CustmaintComponent implements AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('bar03', {static: true}) bar03: pcdrBuilderComponent;
    @ViewChild('bar04', {static: true}) bar04: pcdrBuilderComponent;
    @ViewChild('bar05', {static: true}) bar05: pcdrBuilderComponent;
    @ViewChild('bar06', {static: true}) bar06: pcdrBuilderComponent;
    @ViewChild('custmg01', {static: true}) custmg01: WjFlexGrid;
    @ViewChild('custmg02', {static: true}) gcustomeritems: WjFlexGrid;
    @ViewChild('custmg03', {static: true}) gcustomercontacts: WjFlexGrid;
    @ViewChild('custmg04', {static: true}) gcustomerbilltos: WjFlexGrid;
    @ViewChild('custmg05', {static: true}) gcustomershiptos: WjFlexGrid;
    selectedTab = 0;
    listGridSearch = new FormControl();
    listGridSearchRun = true;
    factive:boolean = true;
    gH01:number;
    gH02:number;
    gH05:number;
    ftype = 'N';
    cstCurrent: any = {};
    minMarkup = 0;

    listPaymentmethod:any[];
    listCustomerterms:any[];
    listRepresentatives:any[];
    listTaxrates:any[];
    listTypes:any[];
    listCC:any[];
    showMoreEdit:boolean = true;
    searchId:string = '';
    searchItem:string = '';

    customers:DataStore;
    customeritems:DataStore;
    customercontacts:DataStore;
    customerbilltos:DataStore;
    customershiptos:DataStore;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, private dESrvc: DataEntryService, private companyRules: CompanyRulesService, private toastr: ToastrService, private $filter: PcdrFilterPipe, public wjH: wjHelperService, public sharedSrvc: SharedService, public dialog: MatDialog) {
        // Data Stores, Assign Unique Keys
        this.customers = this.dESrvc.newDataStore('customers', ['fcid'], true, ['fctid', 'fname', 'frid', 'ftrid', 'ftype']);
        this.customeritems = this.dESrvc.newDataStore('customeritems', ['fcid', 'fitem'], true, ['fitem']);
        this.customercontacts = this.dESrvc.newDataStore('customercontacts', ['fcid', 'fccid'], true, ['ftype', 'fname']);
        this.customerbilltos = this.dESrvc.newDataStore('customerbilltos', ['fcid', 'fcbtid'], true, ['ftype', 'faddress1']);
        this.customershiptos = this.dESrvc.newDataStore('customershiptos', ['fcid', 'fcstid'], true, ['ftype', 'faddress1']);
        this.dESrvc.validateDataStore('customers', 'CUSTOMER PROPERTIES', 'fctid', 'TERMS');
        this.dESrvc.validateDataStore('customers', 'CUSTOMER PROPERTIES', 'fname', 'NAME');
        this.dESrvc.validateDataStore('customers', 'CUSTOMER PROPERTIES', 'frid', 'REPRESENTATIVE');
        this.dESrvc.validateDataStore('customers', 'CUSTOMER PROPERTIES', 'ftrid', 'TAX RATE');
        this.dESrvc.validateDataStore('customers', 'CUSTOMER PROPERTIES', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('customeritems', 'FAVORITE ITEMS', 'fitem', 'ITEM');
        this.dESrvc.validateDataStore('customercontacts', 'CONTACTS', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('customercontacts', 'CONTACTS', 'fname', 'NAME');
        this.dESrvc.validateDataStore('customerbilltos', 'BILL-TO', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('customerbilltos', 'BILL-TO', 'faddress1', 'ADDRESS 1');
        this.dESrvc.validateDataStore('customershiptos', 'SHIP-TO', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('customershiptos', 'SHIP-TO', 'faddress1', 'ADDRESS 1');

        // Get Customer Terms for DropDown
        this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerTermsDD').subscribe((dataResponse) => {
            this.listCustomerterms = dataResponse;
        });

        DataSvc.serverDataGet('api/RepresentativeMaint/GetRepresentativeDD').subscribe((dataResponse) => {
            this.listRepresentatives = dataResponse;
        });

        this.DataSvc.serverDataGet('api/TaxMaint/GetTaxRatesDD').subscribe((dataResponse) => {
            this.listTaxrates = dataResponse;
        });
        
        this.DataSvc.serverDataGet('api/CompanyMaint/GetMinMarkup').subscribe((dataResponse) => {
            this.minMarkup = dataResponse.fminmarkup;
        });

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
                {name: 'Edit Customer', style: 'success', tooltip: 'Selected', action: 'listGridDoubleClick', val: null},
                {name: '', style: 'secondary', icon: 'fas fa-file-excel', tooltip: 'Export List To Excel', action: 'exportToXcel', val: null}
            ],
            rows: {grid: 'custmg01'}, 
            navButtons: [
                {name: 'Entry', action: 'selectedTab', val: 1}
            ]
        })
        
        this.bar02.setNavProperties(this, {
            title: 'Customer Properties', 
            buttons: [
                {name: 'Save', style: 'primary', action: 'update', val: null},
                {name: 'New Customer', style: 'success', action: 'newCustomer'},
                {name: 'Favorites', style: 'light', icon: 'fa fa-print', action: 'printPL'}
            ],
            validEntry: true,
            navButtons: [
                {name: 'List', action: 'selectedTab', val: 0},
                {name: 'Contacts', action: 'selectedTab', val: 2}
            ],
            chevron: {action: 'editMore', show: 'showMoreEdit'},
            search: {action: 'searchByIdNumber', ngModel: 'searchId', placeholder: 'Customer ID', }
        })

        this.bar03.setNavProperties(this, {
            title: 'Favorite Items', 
            buttons: [
                {name: 'Add', style: 'success', icon: 'fa fa-plus', action: 'favoritesAdd', val: null},
                {name: 'Remove', style: 'danger', icon: 'fa fa-minus', action: 'favoritesRemove', val: null}
            ],
            rows: {grid: 'gcustomeritems'}
        })
        
        this.bar04.setNavProperties(this, {
            title: 'Contacts', 
            buttons: [
                {name: 'Add', style: 'success', icon: 'fa fa-plus', action: 'contactsAdd', val: null},
                {name: 'Remove', style: 'danger', icon: 'fa fa-minus', action: 'contactsRemove', val: null}
            ],
            rows: {grid: 'gcustomercontacts'},
            navButtons: [
                {name: 'Entry', action: 'selectedTab', val: 1}
            ],
            subnavbar: false
        })
        
        this.bar05.setNavProperties(this, {
            title: 'Bill To', 
            buttons: [
                {name: 'Add', style: 'success', icon: 'fa fa-plus', action: 'billtosAdd', val: null},
                {name: 'Remove', style: 'danger', icon: 'fa fa-minus', action: 'billtosRemove', val: null}
            ],
            rows: {grid: 'gcustomerbilltos'},
            subnavbar: false
        })

        this.bar06.setNavProperties(this, {
            title: 'Ship To', 
            buttons: [
                {name: 'Add', style: 'success', icon: 'fa fa-plus', action: 'shiptosAdd'},
                {name: 'Remove', style: 'danger', icon: 'fa fa-minus', action: 'shiptosRemove'},
                {name: 'Copy From BILL-TO', style: 'light', action: 'copyBilltos'}
            ],
            rows: {grid: 'gcustomershiptos'},
            subnavbar: false
        })
        
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.initGrids();
        this.wjH.fixWM();

        this.dESrvc.initCodeTable().subscribe((dataResponse)=> { // when codetable is needed
            this.listPaymentmethod = this.$filter.transform(dataResponse, {fgroupid: 'CMP'}, true);
            this.listTypes = this.$filter.transform(dataResponse, {fgroupid: 'CMT'}, true);
            this.listCC = this.$filter.transform(dataResponse, {fgroupid: 'CC'}, true);
            
            this.gcustomercontacts.columns[0].dataMap = new wjGrid.DataMap(this.$filter.transform(dataResponse, {fgroupid: 'CCT'}, true), 'fid', 'fdescription');
            let ctype = this.$filter.transform(dataResponse, {fgroupid: 'AT'}, true);
            this.gcustomerbilltos.columns[0].dataMap = new wjGrid.DataMap(ctype, 'fid', 'fdescription');
            this.gcustomershiptos.columns[0].dataMap = new wjGrid.DataMap(ctype, 'fid', 'fdescription');
        });
    }

    // barXX Events
    onClickNav(parm) {
        
        switch(parm.action) {
            case 'selectedTab':
                this.selectedTab = parm.val;
                if (this.selectedTab == 2) {
                    this.onResize(null);
                    this.gridRepaint('2');
                }
                break;
            case 'editMore':
                this.showMoreEdit = !this.showMoreEdit;
                this.onResize(null);
                this.gridRepaint('1');
                break;                
            default:
                this[parm.action]();
                break;
        }
    }

    // Get Customer List
    listSearch() {
        this.listGridSearchRun = false
        let val = this.listGridSearch.value;
        this.listGridSearch.setValue('X');
        setTimeout(()=> {
            this.listGridSearch.setValue('');
            this.listGridSearchRun = true;
        }, 800);    }

    searchByIdNumber() {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.DataSvc.serverDataGet('api/CustomerMaint/GetValidateCustomer', {pfcid: this.searchId}).subscribe((dataResponse) => {
            if (dataResponse.length > 0) {
                this.retrieveRecord(dataResponse[0].fcid);
                this.searchId = '';
            }
            else
                this.toastr.info('Customer ID Not Found');
        });
    }

    // Get Item for EDIT
    retrieveRecord(afid) {
        if (!afid) return;
        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.CompanySvc.ofHourGlass(true);

            this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomer', { pfcid: afid }).subscribe((dataResponse) => {
                this.customers.loadData(dataResponse.customers);
                this.customeritems.loadData(dataResponse.customeritems);
                this.customercontacts.loadData(dataResponse.customercontacts);
                this.customerbilltos.loadData(dataResponse.customerbilltos);
                this.customershiptos.loadData(dataResponse.customershiptos);
                this.cstCurrent = this.customers.items[0];

                // Calculate Markup %
                this.customeritems.items.forEach((row) => {
                    row.cfmarkup = this.companyRules.markupCalculate(row.fprice, row.funits, row.fsalesbase);
                })
                
                this.wjH.gridLoad(this.gcustomeritems, this.customeritems.items);
                this.wjH.gridLoad(this.gcustomercontacts, this.customercontacts.items);
                this.wjH.gridLoad(this.gcustomerbilltos, this.customerbilltos.items);
                this.wjH.gridLoad(this.gcustomershiptos, this.customershiptos.items);
                this.CompanySvc.ofHourGlass(false);
            });
        });
    }

    listGridDoubleClick() {
        var row = this.wjH.getGridSelectecRow(this.custmg01);
        if (!row) return;
        this.retrieveRecord(row.fcid);
        this.selectedTab = 1;
        this.gridRepaint('1');
    };

    // New Item
    newCustomer() {
        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.CompanySvc.ofHourGlass(true);
            this.DataSvc.serverDataGet('api/Company/Getnextsequence', { seq: 'customers' }).subscribe((dataResponse) => {
                var fseq = dataResponse.data;

                // Clear data
                this.customers.loadData([]);
                this.customeritems.loadData([]);
                this.customercontacts.loadData([]);
                this.customerbilltos.loadData([]);
                this.customershiptos.loadData([]);
                this.wjH.gridLoad(this.gcustomeritems, []);
                this.wjH.gridLoad(this.gcustomercontacts, []);
                this.wjH.gridLoad(this.gcustomerbilltos, []);
                this.wjH.gridLoad(this.gcustomershiptos, []);

                this.DataSvc.serverDataGet('api/CompanyMaint/GetCompanyCustomerDflt').subscribe((dataResponse) => {
                    var cp = dataResponse[0];
                    this.customers.addRow({
                        fcid: fseq,
                        factive: true,
                        fistaxexcempt: false,
                        fdiscountp: 0,
                        fcreditlimit: 0,
                        fpaymentmethod: cp.fcust_paymentmethod,
                        frid: cp.fcust_rid,
                        ftrid: cp.fcust_trid,
                        ftype: cp.fcust_type,
                        fctid: cp.fcust_ctid
                    });
                    this.cstCurrent = this.customers.items[0];
                    
                    this.CompanySvc.ofHourGlass(false);
                });
            });
        });
    }

    // Save the item
    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        // Validate Details
        if (this.customercontacts.items.length < 1) {
            this.toastr.warning('Customer Must Have At Least 1 Contact');
            return;
        }
        if (this.customerbilltos.items.length < 1) {
            this.toastr.warning('Customer Must Have At Least 1 Bill-To');
            return;
        }
        if (this.customershiptos.items.length < 1) {
            this.toastr.warning('Customer Must Have At Least 1 Ship-To');
            return;
        }

        this.CompanySvc.ofHourGlass(true);

        // Last Update
        this.customers.items[0].ts = new Date();
        this.customers.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/CustomerMaint/Postupdate').finally(() => {
            this.CompanySvc.ofHourGlass(false)
        }).subscribe();
    }

    // Valid Entry
    validEntry() {
        if (this.customers.items.length !== 1) return false;
        return (this.customers.items[0].fcid > 0);
    }

    customeritemsAddItem(pitem) {
        if (this.$filter.transform(this.customeritems.items, {fitem: pitem.fitem}, true).length > 0) {
            this.toastr.info('Item already exist.');
            return; // No duplicates
        }

        this.customeritems.addRow({
            fcid: this.customers.items[0].fcid,
            fitem: pitem.fitem,
            fdescription: pitem.fdescription,
            fuomdescription: pitem.fuomdescription,
            fprice: pitem.fsaleprice,
            funits: pitem.funits,
            fsalesbase: pitem.fsalesbase,
            cfmarkup: this.companyRules.markupCalculate(pitem.fsaleprice, pitem.funits, pitem.fsalesbase)
        }, true);

        this.wjH.gridLoad(this.gcustomeritems, this.customeritems.items);
        this.wjH.gridScrollToRow(this.gcustomeritems, 3, 0);
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (this.searchItem.length < 3) return false;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemWithPrice', {
            pfitem: this.searchItem,
            pfcid: this.customers.items[0].fcid
        }).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                this.toastr.warning('Item not found!');
                return;
            }

            this.searchItem = ''; // Clear value
            this.customeritemsAddItem(dataResponse[0]);
        });
    }

    favoritesAdd() {
        if (!this.validEntry()) return;

        let pData = { fcid: this.cstCurrent.fcid };
        // this.dialog.open(ItemList, {height: '95%', data: pData}).afterClosed().subscribe(result => {
        this.dialog.open(ItemList, {data: pData}).afterClosed().subscribe(result => {
            if (result) this.customeritemsAddItem(result);
        });
    }

    // Generic simple remove
    gridRemove(pDs:DataStore, pGrid:WjFlexGrid) {
        if (!this.validEntry()) return;
        var row = this.wjH.getGridSelectecRow(pGrid);
        if (!row) return; // No selected row

        pDs.removeRow(row).subscribe(() => {
            this.wjH.gridLoad(pGrid, pDs.items);
        });
    }

    favoritesRemove() {
        this.gridRemove(this.customeritems, this.gcustomeritems);
    }

    contactsRemove() {
        this.gridRemove(this.customercontacts, this.gcustomercontacts);
    }

    shiptosRemove() {
        this.gridRemove(this.customershiptos, this.gcustomershiptos);
    }

    billtosRemove() {
        this.gridRemove(this.customerbilltos, this.gcustomerbilltos);
    }

    contactsAdd() {
        if (!this.validEntry()) return;

        this.customercontacts.addRow({
            fcid: this.cstCurrent.fcid,
            fccid: this.dESrvc.getMaxValue(this.customercontacts.items, 'fccid') + 1,
        }, true);

        this.wjH.gridLoad(this.gcustomercontacts, this.customercontacts.items);
        this.wjH.gridScrollToRow(this.gcustomercontacts, 0, 0);
    }

    billtosAdd() {
        if (!this.validEntry()) return;

        this.customerbilltos.addRow({
            fcid: this.cstCurrent.fcid,
            fcbtid: this.dESrvc.getMaxValue(this.customerbilltos.items, 'fcbtid') + 1,
        }, true);

        this.wjH.gridLoad(this.gcustomerbilltos, this.customerbilltos.items);
        this.wjH.gridScrollToRow(this.gcustomerbilltos, 0, 0);
    }

    shiptosAdd() {
        if (!this.validEntry()) return;

        this.customershiptos.addRow({
            fcid: this.cstCurrent.fcid,
            fcstid: this.dESrvc.getMaxValue(this.customershiptos.items, 'fcstid') + 1,
        }, true);

        this.wjH.gridLoad(this.gcustomershiptos, this.customershiptos.items);
        this.wjH.gridScrollToRow(this.gcustomershiptos, 0, 0);
    }

    copyBilltos() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.gcustomerbilltos);
        if (!row) return; // No selected row

        this.customershiptos.addRow({
            fcid: this.cstCurrent.fcid,
            fcstid: this.dESrvc.getMaxValue(this.customershiptos.items, 'fcstid') + 1,
            ftype: row.ftype,
            cftype: row.cftype,
            faddress1: row.faddress1,
            faddress2: row.faddress2,
            fcity: row.fcity,
            fstate: row.fstate,
            fzip: row.fzip
        }, true);

        this.wjH.gridLoad(this.gcustomershiptos, this.customershiptos.items);
        this.wjH.gridScrollToRow(this.gcustomershiptos, 0, 0);
    }

    exportToXcel() {
        if (this.custmg01.rows.length == 0) return;
        
        let xcel = wjGridX.FlexGridXlsxConverter.save(this.custmg01, {
            includeColumnHeaders: true,
            includeRowHeaders: true
        });

        xcel.sheets[0].name = "Customer List";
        xcel.saveAsync('CustomerList.xlsx');
    }

    printPL() {
        if (!this.validEntry()) return;
        this.CompanySvc.ofHourGlass(true);

        var mParms = 'pfcid=' + this.cstCurrent.fcid;
        this.CompanySvc.ofCreateJasperReport('customeritemlist.pdf', mParms).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
        
        // var mParms = [
        //     {fline: 1, fnumber: this.customers.items[0].fcid},
        //     {fline: 2, fnumber: 1},
        //     {fline: 3, fstring: ''}
        // ];
        // this.CompanySvc.ofCreateReport('d_customeritem_list_rpt', mParms, 3).subscribe((pResponse) => {
        //     // Open PDF file
        //     setTimeout(() => {
        //         this.CompanySvc.ofOpenServerFile(pResponse.data);
        //     }, 1000);
        // });
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gH01 = window.innerHeight - 155;
            var height = (this.showMoreEdit) ? 694 : 524; // Edit
            
            this.gH02 = Math.max(window.innerHeight - (height + 0), 200);
            this.gH05 = Math.max(window.innerHeight - 627);
        }, 100);
    };

    // Allows w2grid to repaint properly due to multiple tabs
    gridRepaint(tab) {
        setTimeout(() => {
            switch (tab) {
                case '1':
                    this.wjH.gridRedraw(this.gcustomeritems);
                    break;
                case '2':
                    this.wjH.gridRedraw(this.gcustomerbilltos);
                    this.wjH.gridRedraw(this.gcustomershiptos);
                    this.wjH.gridRedraw(this.gcustomercontacts);
                    break;
            }
        }, 100);
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
            // formatItem: (s, e) => {
            //     if (e.panel == s.cells) {
            //         var col = s.columns[e.col], row = s.rows[e.row].dataItem;
            //         switch (col.binding) {
            //             case 'fphone':
            //                 var row = s.rows[e.row].dataItem;
            //                 e.cell.textContent = this.CompanySvc.phoneRenderer({value: row.fphone});
            //                 break;
            //         }
            //     }
            // },
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
        this.custmg01.hostElement.addEventListener('dblclick', (e)=> {
            this.listGridDoubleClick();
        });
        new wjGridFilter.FlexGridFilter(this.custmg01);

        // wj-flex-grid
        this.gcustomeritems.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'cfmarkup':
                        case 'fprice':
                            if (row.cfmarkup < this.minMarkup || row.fprice <= 0) {
                                wjcCore.toggleClass(e.cell, 'alert-row', true);
                            }
                            break;
                    }
                }
            },
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

                switch (col.binding) {
                    case 'fprice':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            rec.cfmarkup = this.companyRules.markupCalculate(rec.fprice, rec.funits, rec.fsalesbase);
                        }
                        break;
                    case 'cfmarkup':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            // Calculate sales price
                            rec.fprice = this.companyRules.salepriceCalculate(rec.cfmarkup, rec.funits, rec.fsalesbase);
                        }
                        break;
                }
            },
            columns: [
                {binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                {binding: "fuomdescription", header: "UOM", width: 150, isReadOnly: true},
                {binding: "fdescription", header: "Description", width: '*', isReadOnly: true},
                {binding: "fprice", header: "Price", width: 110, format: 'c'},
                {binding: "cfmarkup", header: "Markup %", width: 110, format: 'n2'}
            ]
        });
        this.wjH.gridInit(this.gcustomeritems);

        // wj-flex-grid
        this.gcustomercontacts.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'fphone':
                            if (this.wjH.gridEditingCell(s, e)) break;
                            var row = s.rows[e.row].dataItem;
                            e.cell.textContent = this.CompanySvc.phoneRenderer({value: row.fphone});
                            break;
                    }
                }
            },
            columns: [
                { binding: "ftype", header: "Type", width: 120 },
                { binding: "fname", header: "Name", width: '*' },
                { binding: "fphone", header: "Phone", width: 130, isReadOnly: false },
                { binding: "fextension", header: "Extension", width: 90 },
                { binding: "femail", header: "Email", width: 200 },
                { binding: "fdepartment", header: "Department", width: 200 }
            ]
        });
        this.wjH.gridInit(this.gcustomercontacts);

        // wj-flex-grid
        this.gcustomerbilltos.initialize({
            columns: [
                { binding: "ftype", header: "Type", width: 120 },
                { binding: "faddress1", header: "Address1", width: '*' },
                { binding: "faddress2", header: "Address2", width: '*' },
                { binding: "fcity", header: "City", width: 150 },
                { binding: "fstate", header: "State", width: 80 },
                { binding: "fzip", header: "Zip Code", width: 150 }
            ]
        });
        this.wjH.gridInit(this.gcustomerbilltos);

        // wj-flex-grid
        this.gcustomershiptos.initialize({
            columns: [
                { binding: "ftype", header: "Type", width: 120 },
                { binding: "faddress1", header: "Address1", width: '*' },
                { binding: "faddress2", header: "Address2", width: '*' },
                { binding: "fcity", header: "City", width: 150 },
                { binding: "fstate", header: "State", width: 80 },
                { binding: "fzip", header: "Zip Code", width: 150 }
            ]
        });
        this.wjH.gridInit(this.gcustomershiptos);
    }
}
