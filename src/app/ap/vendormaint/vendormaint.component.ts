import { MatDialog } from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
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
import { pcdrBuilderComponent } from '../../services/builder/builder.component';

@Component({
    selector: 'vendormaint',
    templateUrl: './vendormaint.component.html',
    providers: [DataEntryService]
})
export class VendormaintComponent implements AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('bar03', {static: true}) bar03: pcdrBuilderComponent;
    @ViewChild('bar04', {static: true}) bar04: pcdrBuilderComponent;
    @ViewChild('vendmg01', {static: true}) gvendmg01: WjFlexGrid;
    @ViewChild('vendmg02', {static: true}) gvendomeritems: WjFlexGrid;
    @ViewChild('vendmg03', {static: true}) gvendomercontacts: WjFlexGrid;
    selectedTab = 0;
    listGridSearch = new FormControl();
    listGridSearchRun = true;
    factive:boolean = true;
    gH01:number;
    gH02:number;
    gH03:number;
    ftype = 'N';
    vndCurrent: any = {};

    listPaymentmethod:any[];
    listVendorterms:any[];
    listTypes:any[];
    showMoreEdit:boolean = true;
    searchId:string = '';
    searchItem:string = '';

    vendors:DataStore;
    itemvendors:DataStore;
    vendorcontacts:DataStore;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, private dESrvc: DataEntryService, private companyRules: CompanyRulesService, private toastr: ToastrService, private $filter: PcdrFilterPipe, public wjH: wjHelperService, public sharedSrvc: SharedService, public dialog: MatDialog) {
        // Data Stores, Assign Unique Keys
        this.vendors = this.dESrvc.newDataStore('vendors', ['fvid'], true, ['fvtid', 'fname', 'ftype']);
        this.itemvendors = this.dESrvc.newDataStore('itemvendors', ['fitem', 'fivid'], true, ['fitem', 'fdescription']);
        this.vendorcontacts = this.dESrvc.newDataStore('vendorcontacts', ['fvid', 'fvcid'], true, ['ftype', 'fname', 'fphone']);
        this.dESrvc.validateDataStore('vendors', 'VENDOR PROPERTIES', 'fvtid', 'TERMS');
        this.dESrvc.validateDataStore('vendors', 'VENDOR PROPERTIES', 'fname', 'NAME');
        this.dESrvc.validateDataStore('vendors', 'VENDOR PROPERTIES', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('vendors', 'VENDOR PROPERTIES', 'fpaymentmethod', 'PAYMENT TYPE');
        this.dESrvc.validateDataStore('itemvendors', 'ITEMS', 'fitem', 'ITEM');
        this.dESrvc.validateDataStore('itemvendors', 'ITEMS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('vendorcontacts', 'CONTACTS', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('vendorcontacts', 'CONTACTS', 'fname', 'NAME');
        this.dESrvc.validateDataStore('vendorcontacts', 'CONTACTS', 'fphone', 'PHONE');

        // Get Vendor Terms for DropDown
        this.DataSvc.serverDataGet('api/VendorMaint/GetVendorTermsDD').subscribe((dataResponse) => {
            this.listVendorterms = dataResponse;
        });

        this.listGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (!this.listGridSearchRun) return [];
                if (val == null) return [];
                if (this.ftype != "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/VendorMaint/GetVendorList', { pActive: this.factive, pName: val, pType: this.ftype });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.gvendmg01, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                //this.custmg01.autoSizeRows(); // Slows down
                this.CompanySvc.ofHourGlass(false);
                this.listGridSearchRun = true;
            });
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Vendor List', 
            buttons: [
                {name: 'Edit Vendor', style: 'success', tooltip: 'Selected', action: 'listGridDoubleClick', val: null},
                {name: '', style: 'secondary', icon: 'fas fa-file-excel', tooltip: 'Export List To Excel', action: 'exportToXcel', val: null}
            ],
            rows: {grid: 'gvendmg01'}, 
            navButtons: [
                {name: 'Entry', action: 'selectedTab', val: 1}
            ]
        })

        this.bar02.setNavProperties(this, {
            title: 'Vendor Properties', 
            buttons: [
                {name: 'Save', style: 'primary', action: 'update', val: null},
                {name: 'New Vendor', style: 'success', action: 'newVendor'},
                {name: 'Price List', style: 'light', icon: 'fa fa-print', action: 'printPL'}
            ],
            validEntry: true,
            navButtons: [
                {name: 'List', action: 'selectedTab', val: 0},
                {name: 'Contacts', action: 'selectedTab', val: 2}
            ],
            chevron: {action: 'editMore', show: 'showMoreEdit'},
            search: {action: 'searchByIdNumber', ngModel: 'searchId', placeholder: 'Vendor ID', }
        })

        this.bar03.setNavProperties(this, {
            title: 'Items', 
            buttons: [
                {name: 'Remove', style: 'danger', icon: 'fa fa-minus', action: 'itemvendorsRemove', val: null}
            ],
            rows: {grid: 'gvendomeritems'},
            subnavbar: false
        })

        this.bar04.setNavProperties(this, {
            title: 'Contacts', 
            buttons: [
                {name: 'Add', style: 'success', icon: 'fa fa-plus', action: 'contactsAdd', val: null},
                {name: 'Remove', style: 'danger', icon: 'fa fa-minus', action: 'contactsRemove', val: null}
            ],
            rows: {grid: 'gvendomercontacts'},
            navButtons: [
                {name: 'Entry', action: 'selectedTab', val: 1}
            ],
            subnavbar: false
        })
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.initGrids();
        this.wjH.fixWM();

        this.dESrvc.initCodeTable().subscribe((dataResponse)=> { // when codetable is needed
            this.listPaymentmethod = this.$filter.transform(dataResponse, {fgroupid: 'VMP'}, true);
            this.listTypes = this.$filter.transform(dataResponse, {fgroupid: 'VMT'}, true);
            this.gvendomercontacts.columns[0].dataMap = new wjGrid.DataMap(this.$filter.transform(dataResponse, {fgroupid: 'VCT'}, true), 'fid', 'fdescription');
        });
    }

    // Valid Entry
    validEntry() {
        if (this.vendors.items.length !== 1) return false;
        return (this.vendors.items[0].fvid > 0);
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

    exportToXcel() {
        if (this.gvendmg01.rows.length == 0) return;
        
        let xcel = wjGridX.FlexGridXlsxConverter.save(this.gvendmg01, {
            includeColumnHeaders: true,
            includeRowHeaders: true
        });

        xcel.sheets[0].name = "Vendor List";
        xcel.saveAsync('VendorList.xlsx');
    }

    // Get Item for EDIT
    retrieveRecord(afid) {
        if (!afid) return;
        this.dESrvc.pendingChangesContinue().then(() => {
            this.CompanySvc.ofHourGlass(true);

            this.DataSvc.serverDataGet('api/VendorMaint/GetVendor', { pfvid: afid }).subscribe((dataResponse) => {
                this.vendors.loadData(dataResponse.vendors);
                this.itemvendors.loadData(dataResponse.itemvendors);
                this.vendorcontacts.loadData(dataResponse.vendorcontacts);
                this.vndCurrent = this.vendors.items[0];

                this.wjH.gridLoad(this.gvendomeritems, this.itemvendors.items);
                this.wjH.gridLoad(this.gvendomercontacts, this.vendorcontacts.items);
                this.CompanySvc.ofHourGlass(false);
            });
        }).catch(()=>{});
    }

    // Save the item
    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        // Validate Details
        if (this.vendorcontacts.items.length < 1) {
            this.toastr.warning('Vendor Must Have At Least 1 Contact');
            return;
        }

        this.CompanySvc.ofHourGlass(true);

        // Last Update
        this.vendors.items[0].ts = new Date();
        this.vendors.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/VendorMaint/Postupdate').finally(() => {
            this.CompanySvc.ofHourGlass(false)
        }).subscribe();
    }

     // New Item
    newVendor() {
        this.dESrvc.pendingChangesContinue().then(() => {
            this.CompanySvc.ofHourGlass(true);
            this.DataSvc.serverDataGet('api/Company/Getnextsequence', { seq: 'vendors' }).subscribe((dataResponse) => {
                var fseq = dataResponse.data;

                // Clear data
                this.vendors.loadData([]);
                this.itemvendors.loadData([]);
                this.vendorcontacts.loadData([]);
                this.wjH.gridLoad(this.gvendomeritems, []);
                this.wjH.gridLoad(this.gvendomercontacts, []);

                this.vendors.addRow({
                    fvid: fseq,
                    factive: true,
                    fis1099: false,
                    fcreditlimit: 0
                });
                this.vndCurrent = this.vendors.items[0];
                
                this.CompanySvc.ofHourGlass(false);
            });
        }).catch(()=>{});
    }

    contactsAdd() {
        if (!this.validEntry()) return;

        this.vendorcontacts.addRow({
            fvid: this.vndCurrent.fvid,
            fvcid: this.dESrvc.getMaxValue(this.vendorcontacts.items, 'fvcid') + 1,
        }, true);

        this.wjH.gridLoad(this.gvendomercontacts, this.vendorcontacts.items);
        this.wjH.gridScrollToRow(this.gvendomercontacts, 0, 0);
    }

    contactsRemove() {
        this.gridRemove(this.vendorcontacts, this.gvendomercontacts);
    }

    itemvendorsRemove() {
        this.gridRemove(this.itemvendors, this.gvendomeritems);
    }

    searchByIdNumber() {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.DataSvc.serverDataGet('api/VendorMaint/GetValidateVendor', {pfvid: this.searchId}).subscribe((dataResponse) => {
            if (dataResponse.length > 0) {
                this.retrieveRecord(dataResponse[0].fvid);
                this.searchId = '';
            }
            else
                this.toastr.info('Vendor ID Not Found');
        });
    }

    printPL() {
        if (!this.validEntry()) return;
        this.CompanySvc.ofHourGlass(true);

        var mParms = [ { fline: 1, fnumber: this.vendors.items[0].fvid } ];
        this.CompanySvc.ofCreateReport('d_vendoritems_rpt', mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
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

    listGridDoubleClick() {
        var row = this.wjH.getGridSelectecRow(this.gvendmg01);
        if (!row) return;
        this.retrieveRecord(row.fvid);
        this.selectedTab = 1;
        this.gridRepaint('1');
    };


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

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gH01 = window.innerHeight - 155;
            var height = (this.showMoreEdit) ? 720 : 555; // Edit
            
            this.gH02 = Math.max(window.innerHeight - (height), 100);
            this.gH03 = Math.max(window.innerHeight - 101);
        }, 100);
    };

    // Allows w2grid to repaint properly due to multiple tabs
    gridRepaint(tab) {
        setTimeout(() => {
            switch (tab) {
                case '1':
                    // this.wjH.gridRedraw(this.gcustomeritems);
                    break;
                case '2':
                    // this.wjH.gridRedraw(this.gcustomerbilltos);
                    // this.wjH.gridRedraw(this.gcustomershiptos);
                    // this.wjH.gridRedraw(this.gcustomercontacts);
                    break;
            }
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.gvendmg01.initialize({
            isReadOnly: true,
            loadedRows: (s,e) => { // optional for readonly faster performance
                for (var i = 0; i < s.rows.length; i++) {
                    var row = s.rows[i].dataItem;
                    row.fphone = this.CompanySvc.phoneRenderer({value: row.fphone});
                }
            },
            columns: [
                { binding: "fvid", header: "ID", width: 60 },
                { binding: "fname", header: "Name", width: 300 },
                { binding: "faddress1", header: "Address", width: 250 },
                { binding: "vcfname", header: "Contact", width: 250 },
                { binding: "fphone", header: "Phone", width: 130 },
                { binding: "cftype", header: "Type", width: 85 },
                { binding: "fcustomerid", header: "Customer ID", width: '*'}
            ]
        });
        this.wjH.gridInit(this.gvendmg01, true);
        this.gvendmg01.hostElement.addEventListener('dblclick', (e)=> {
            this.listGridDoubleClick();
        });
        new wjGridFilter.FlexGridFilter(this.gvendmg01);

        // wj-flex-grid
        this.gvendomeritems.initialize({
            columns: [
                { binding: "fvitem", header: "Vendor Item", width: 200 },
                { binding: "fdescription", header: "Vendor Description", width: '*'},
                { binding: "fcost", header: "Cost", format: 'c', width: 110},
                { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                { binding: "cfdescription", header: "Item Description", width: 350, isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.gvendomeritems);

        // wj-flex-grid
        this.gvendomercontacts.initialize({
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
                { binding: "fphone", header: "Phone", width: 130 },
                { binding: "fextension", header: "Extension", width: 90 },
                { binding: "femail", header: "Email", width: 200 },
                { binding: "fdepartment", header: "Department", width: 200 }
            ]
        });
        this.wjH.gridInit(this.gvendomercontacts);

    }
}
