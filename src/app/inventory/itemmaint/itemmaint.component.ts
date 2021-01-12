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

@Component({
    selector: 'itemmaint',
    templateUrl: './itemmaint.component.html',
    providers: [DataEntryService]
})
export class itemmaintComponent implements AfterViewInit {
    @ViewChild('itmmg01') itmmg01: WjFlexGrid;
    @ViewChild('itmmg02') itmmg02: WjFlexGrid;
    @ViewChild('itmmg03') gitemunits: WjFlexGrid;
    @ViewChild('itmmg04') itmmg04: WjFlexGrid;
    fadmin: boolean = false;
    fupdate: boolean = false;
    selectedTab = 0;
    listGridSearch = new FormControl();
    factive:boolean = true;
    tH01:number;
    gH03:number;
    ftype = 'D';
    itmCurrent: any = {fsalesbase: 0, freorderpoint: 0, freorderqty: 0};
    itemunitsImgCurrent = '';
    listCategory:any[];
    listSubcategory:any[];
    listType:any[];
    showMoreEdit:boolean = false;
    showInventoryGrid:boolean = true;
    itemnumberid:string = 'I';
    searchId:string = '';
    minMarkup = 0;

    itemmasters:DataStore;
    itemunits:DataStore;
    itemvendors:DataStore;

    fileuploadinfo = {progress: 0, message: ''}

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, private dESrvc: DataEntryService, private companyRules: CompanyRulesService, private toastr: ToastrService, private $filter: PcdrFilterPipe, public wjH: wjHelperService, public sharedSrvc: SharedService, public dialog: MatDialog) {
        this.sharedSrvc.setProgramRights(this, 'itemmaintenance'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start
        // Data Stores, Assign Unique Keys
        this.itemmasters = this.dESrvc.newDataStore('itemmasters', ['fimid'], true, ['fdescription', 'fcategory', 'fsalesbase']);
        this.itemunits = this.dESrvc.newDataStore('itemunits', ['fitem'], true, ['fuomdescription']);
        this.itemvendors = this.dESrvc.newDataStore('itemvendors', ['fitem', 'fivid'], true, ['fvitem', 'fdescription', 'fvid']);
        this.dESrvc.validateDataStore('itemmasters', 'ITEM PROPERTIES', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('itemmasters', 'ITEM PROPERTIES', 'fcategory', 'CATEGORY');
        this.dESrvc.validateDataStore('itemmasters', 'ITEM PROPERTIES', 'fsalesbase', 'SALES BASE PRICE');
        this.dESrvc.validateDataStore('itemunits', 'ITEM UNITS', 'fuomdescription', 'UOM DESCRIPTION');
        this.dESrvc.validateDataStore('itemvendors', 'PREFERED VENDORS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('itemvendors', 'PREFERED VENDORS', 'fvitem', 'VENDOR ITEM');
        this.dESrvc.validateDataStore('itemvendors', 'PREFERED VENDORS', 'fvid', 'VENDOR');

        this.dESrvc.initCodeTable().subscribe((dataResponse)=> { // when codetable is needed
            this.listCategory = this.$filter.transform(dataResponse, {fgroupid: 'IMC'}, true);
            this.listSubcategory = this.$filter.transform(dataResponse, {fgroupid: 'IMSC'}, true);
            this.listType = this.$filter.transform(dataResponse, {fgroupid: 'IMT'}, true);
        });

        this.DataSvc.serverDataGet('api/CompanyMaint/GetMinMarkup').subscribe((dataResponse) => {
            this.minMarkup = dataResponse.fminmarkup;
        });

        this.listGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (val == null) return [];
                if (this.ftype != "R" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);

                var api = '';
                switch (this.ftype) {
                    case 'D':
                        api = 'api/ItemMaint/GetListByDescription';
                        break;
                    case 'I':
                        api = 'api/ItemMaint/GetListByItem';
                        break;
                    case 'R':
                        api = 'api/ItemMaint/GetListByReview';
                        break;
                    case 'V':
                        api = 'api/ItemMaint/GetListByVendor';
                        break;
                }
                return this.DataSvc.serverDataGet(api, { psearch: val, pActive: this.factive });
            })
            .subscribe(results => {
                // this.listCustomerGrid.api.setRowData(results);
                this.wjH.gridLoad(this.itmmg01, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();

        this.DataSvc.serverDataGet('api/VendorMaint/GetVendorListDD').subscribe((dataResponse) => {
            this.itmmg04.columns[2].dataMap = new wjGrid.DataMap(dataResponse, 'fvid', 'fname');
        });
    }

    // Get Item List
    itemListSearch() {
        let val = this.listGridSearch.value;
        this.listGridSearch.setValue('');
        setTimeout(()=> this.listGridSearch.setValue(val), 800);
    }

    // Get item by id
    searchByIdNumber() {
        if (!this.searchId) return;
        //this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        this.searchId = this.searchId.toUpperCase();
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        var api = (this.itemnumberid === "I") ? 'api/ItemMaint/GetValidateItemmasters' : 'api/ItemMaint/GetValidateItemmastersByItem';
        this.DataSvc.serverDataGet(api, {pfimid: this.searchId}).subscribe((dataResponse) => {
            if (dataResponse.length > 0) {
                this.retrieveItem(dataResponse[0].fimid);
                this.searchId = '';
            }
            else
                this.toastr.info('Item ID Not Found');
        });
    }

    // Get Item for EDIT
    retrieveItem(afimid) {
        if (!afimid) return;
        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.CompanySvc.ofHourGlass(true);

            this.DataSvc.serverDataGet('api/ItemMaint/GetItem', { pfimid: afimid }).subscribe((dataResponse) => {
                this.itemmasters.loadData(dataResponse.itemmasters);
                this.itemunits.loadData(dataResponse.itemunits);
                this.itemvendors.loadData(dataResponse.itemvendors);
                // this.itemsalesprices.loadData(dataResponse.itemsalesprices);
                // --> this.inventoryGrid.inventoryGridFooter();
                // if (this.inventoryGrid.api) this.inventoryGrid.api.refreshView(); // Grid is hidden and might not be init
                this.itmCurrent = this.itemmasters.items[0];

                // Calculate Markup %
                this.itemunits.items.forEach((row) => {
                    this.itemUnitsCalcMarkup(row);
                })
                
                this.wjH.gridLoad(this.itmmg02, dataResponse.inventories);
                this.wjH.gridLoad(this.gitemunits, this.itemunits.items, false); // hard to prevent initial selection
                this.wjH.gridLoad(this.itmmg04, []); // Will be filtered
                this.CompanySvc.ofHourGlass(false);
            });
        });
    }

    listGridDoubleClick() {
        var row = this.wjH.getGridSelectecRow(this.itmmg01);
        if (!row) return;
        this.retrieveItem(row.fimid);
        this.selectedTab = 1;
        this.gridRepaint('1');
    };

    // New Item
    newItem() {
        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.DataSvc.serverDataGet('api/Company/Getnextsequence', { seq: 'itemmasters' }).subscribe((dataResponse) => {
                var fimid = dataResponse.data;

                // Clear data
                this.itemmasters.loadData([]);
                this.itemunits.loadData([]);
                this.itemvendors.loadData([]);
                this.wjH.gridLoad(this.itmmg02, []);
                this.wjH.gridLoad(this.gitemunits, []);
                this.wjH.gridLoad(this.itmmg04, []);
                //this.inventoryGrid.inventoryGridFooter();
                //if (this.inventoryGrid.api) this.inventoryGrid.api.refreshView(); // Grid is hidden and might not be init

                this.itemmasters.addRow({
                    fimid: fimid,
                    factive: true,
                    ftype: 'I',
                    fistaxable: true,
                    fallowtfoodstamp: false,
                    fnonresaleable: false,
                    freorderpoint: 0,
                    freorderqty: 0,
                    fsalesbase: 0
                });

                this.itmCurrent = this.itemmasters.items[0];
            });
        });
    }

    // Save the item
    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);

        // Last Update
        this.itemmasters.items[0].ts = new Date();
        this.itemmasters.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/ItemMaint/Postupdate').finally(() => {
            this.CompanySvc.ofHourGlass(false)
        }).subscribe();
    }

    // Valid Entry
    validEntry() {
        if (this.itemmasters.items.length !== 1) return false;
        return (this.itemmasters.items[0].fimid > 0);
    }

    itemvendorsAdd() {
        if (!this.validEntry()) return;

        // Get Current fitem
        var row = this.wjH.getGridSelectecRow(this.gitemunits);
        if (!row) return;

        this.itemvendors.addRow({
            fitem: row.fitem,
            fivid: this.dESrvc.getMaxValue(this.itemvendors.items, 'fivid') + 1, // Assign next value
            fimid: this.itemmasters.items[0].fimid,
            fcost: 0,
            fvitem: row.fitem,
            fdescription: (this.itemmasters.items[0].fdescription + ' ' + row.fuomdescription).substr(0, 50) // Max 50
        });

        // Filter and Scroll to new row (always last)
        this.wjH.gridLoad(this.itmmg04, this.$filter.transform(this.itemvendors.items,{fitem: row.fitem}, true));
        this.wjH.gridScrollToLastRow(this.itmmg04, 0);
    }

    // Add Rows
    itemunitsAdd(copyItem = false) {
        if (!this.validEntry()) return;
        let copyRow = this.wjH.getGridSelectecRow(this.gitemunits);

        var pData = (copyItem) ? { title: 'Copy Item Number From: ' + copyRow.fitem} : { title: 'New Item Number' };
        let dialogRef = this.dialog.open(DialogItemNumber, {data: pData});
      
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (copyItem) {
                    // Make Copy of Existing Row
                    this.itemunits.addRow({
                        fabc: copyRow.fabc,
                        fabcmov: 0,
                        fabcqty: 0,
                        fabctotal: 0,
                        factive: true,
                        fimid: this.itemmasters.items[0].fimid,
                        fitem: result,
                        funits: copyRow.funits,
                        fdisplayunits: copyRow.fdisplayunits,
                        fuomdescription: copyRow.fuomdescription,
                        fweight: copyRow.fweight
                    });
                }
                else {
                    // Create New
                    this.itemunits.addRow({
                        fabc: "C",
                        fabcmov: 0,
                        fabcqty: 0,
                        fabctotal: 0,
                        factive: true,
                        fimid: this.itemmasters.items[0].fimid,
                        fitem: result,
                        funits: 1,
                        fdisplayunits: 1,
                        fuomdescription: null,
                        fweight: 0
                    });
                }
                this.wjH.gridLoad(this.itmmg04, []); // Clear Vendor Items
                this.wjH.gridLoad(this.gitemunits, this.itemunits.items); // Load data
                this.wjH.gridScrollToLastRow(this.gitemunits, 1); // Scroll to new row (always last)
            }
        });

    }

    // Copy Existing Rows
    itemunitsCopy() {
        if (this.wjH.getGridSelectecRow(this.gitemunits)) this.itemunitsAdd(true);
    }

    // Remove Rows
    itemunitsRemove() {
        if (!this.validEntry()) return;
        var row = this.wjH.getGridSelectecRow(this.gitemunits);
        if (!row) return; // No selected row

        this.itemunits.removeRow(row).subscribe(() => {
            // Remove all itemvendors belonging
            var i = this.itmmg04.rows.length;
            while (i--) {
                this.itemvendors._removeRow(this.itmmg04.rows[i].dataItem);
            } 
            
            this.wjH.gridLoad(this.gitemunits, this.itemunits.items); // Load data
            this.wjH.gridLoad(this.itmmg04, []); // Clear data
        });
    }

    // Remove Rows
    itemvendorsRemove() {
        if (!this.validEntry()) return;
        var row = this.wjH.getGridSelectecRow(this.itmmg04);
        if (!row) return; // No selected row

        this.itemvendors.removeRow(row).subscribe(() => {
            this.wjH.gridLoad(this.itmmg04, this.$filter.transform(this.itemvendors.items,
                {fitem: this.wjH.getGridSelectecRow(this.gitemunits).fitem}, true));
        });
    }

    onfsalebaseprice(newval) {
        if (!this.validEntry()) return;
        var newval = this.CompanySvc.validNumber(newval, 2); // Convert to number
        if (newval == this.itmCurrent.fsalesbase) return; // no changes exit
        
        this.itmCurrent.fsalesbase = newval;
        this.itemunits.items.forEach((row) => {
            this.itemUnitsCalcMarkup(row);
        })
        this.gitemunits.refresh(); // Show changes
    }

    // Calculate and add computed field
    priceperunit(fitem, funits) {
        var rows = this.$filter.transform(this.itemvendors.items, {fitem: fitem}, true);
        rows.forEach((item) => {
            item.cpriceunit = this.CompanySvc.r2d(item.fcost / funits);
        })
    }

    itemUnitsCalcMarkup(row) {
        if (row.funits > 0 && this.itmCurrent.fsalesbase > 0) {
            row.cfmarkup = this.companyRules.markupCalculate(row.fsaleprice, row.funits, this.itmCurrent.fsalesbase);
        }
    }

    viewCustomerPrice() {
        var row = this.wjH.getGridSelectecRow(this.gitemunits);
        if (!row) return;

        let dialogRef = this.dialog.open(ViewCustomerPricing, 
            {data: {fitem: row.fitem, funits: row.funits, fsalesbase: this.itmCurrent.fsalesbase}});
        dialogRef.afterClosed().subscribe();
    }

    exportToXcel() {
        if (this.itmmg01.rows.length == 0) return;
        
        let xcel = wjGridX.FlexGridXlsxConverter.save(this.itmmg01, {
            includeColumnHeaders: true,
            includeRowHeaders: true
        });

        xcel.sheets[0].name = "Item List";
        xcel.saveAsync('itemList.xlsx');
    }

    allowUpload(control) {
        if (!this.validEntry) return false;
        if (!this.wjH.getGridSelectecRow(this.gitemunits)) return false;
        control.click(); // Call if allowed
    }

    fileChange(event) {
        var row = this.wjH.getGridSelectecRow(this.gitemunits);
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.setImage(''); // clear first
            this.CompanySvc.ofHourGlass(true);
            let file: File = fileList[0];
            this.DataSvc.serverFileUpload(file, 'images', row.fitem + '.jpg', this.fileuploadinfo).subscribe(
                data => {
                    this.CompanySvc.ofHourGlass(false);
                    if (data.success) 
                        this.toastr.info('Image upload was succesful.');
                    else 
                        this.toastr.warning('Unable to upload the image.');
                    this.setImage(row);
                    
                    this.fileuploadinfo.progress = 0; // reset
                } ,
                // error => console.log(error)
            )
        }
        else console.log('no file');
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    // Resize gridlist to fill window
    onResize(event) {
        this.tH01 = window.innerHeight - 55;
        setTimeout(() => {
            var height = (this.showMoreEdit) ? 501 : 327; // Edit
            height = (this.showInventoryGrid) ? height + 189 : height + 50; // Inventory
            
            // heigh + Pref vdn grid + Overhead
            this.gH03 = Math.max(window.innerHeight - (height + 207 + 117), 255);
            
            // var height = (this.showMoreEdit) ? 501 : 277; // Edit
            // height = (this.showInventoryGrid) ? height + 189 : height + 50; // Inventory
            
            // // heigh + Pref vdn grid + Overhead
            // this.gH03 = Math.max(window.innerHeight - (height + 207 + 117), 255);
        }, 100);
    };

    // Allows w2grid to repaint properly due to multiple tabs
    gridRepaint(tab) {
        switch (tab) {
            // case '0':
            //     this.wjH.gridRedraw(this.itmmg01);
            //     break;
            case '1':
                this.wjH.gridRedraw(this.itmmg02);
                this.wjH.gridRedraw(this.gitemunits);
                this.wjH.gridRedraw(this.itmmg04);
                break;
        }
    }

    // Initialize Grid presentation (s/b on html)
    initGrids() {
        // wj-flex-grid
        this.itmmg01.initialize({
            isReadOnly: true,
            columns: [
                {binding: "fimid", header: "ID", width: 60, format: 'D'},
                {binding: "fdescription", header: "Description", width: '*'},
                {binding: "fitem", header: "Item", width: 180},
                {binding: "fuomdescription", header: "UOM", width: 125},
                {binding: "funits", header: "# Units", width: 85},
                {binding: "fsaleprice", header: "Price", width: 85, format: 'c'},
                //{binding: "fsalesbase", header: "Sales Base", width: 85, cellRenderer: this.CompanySvc.currencyRenderer},
                {binding: "fcategory", header: "Category", width: 150},
                {binding: "fsubcategory", header: "Sub Category", width: 150}
            ]
        });
        this.wjH.gridInit(this.itmmg01, true);
        this.itmmg01.hostElement.addEventListener('dblclick', (e)=> {
            this.listGridDoubleClick();
        });
        new wjGridFilter.FlexGridFilter(this.itmmg01);

        // wj-flex-grid
        // Inventory
        this.itmmg02.initialize({
            isReadOnly: true,
            columns: [
                {binding: "cflocation", header: "Location", width: 150 },
                {binding: "fonhand", header: "On Hand", width: '*', aggregate: 'Sum' },
                {binding: "fsalesorders", header: "Sales Orders", width: '*', aggregate: 'Sum' },
                {binding: "fpurchaseorders", header: "Purchase Orders", width: '*', aggregate: 'Sum' },
                {binding: "favgcost", header: "Avg Cost", format: 'c', width: '*', aggregate: 'Avg'},
                {binding: "favgsale", header: "Avg Sale", format: 'c', width: '*', aggregate: 'Avg'}
            ]
        });
        this.wjH.gridInit(this.itmmg02, true);
        this.itmmg02.columnFooters.rows.push(new wjGrid.GroupRow());

        // wj-flex-grid
        this.gitemunits.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'cfmarkup':
                        case 'fsaleprice':
                            if (row.cfmarkup < this.minMarkup || row.fprice <= 0) {
                                wjcCore.toggleClass(e.cell, 'alert-row', true);
                            }
                            break;
                    }
                }
            },
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.gitemunits, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.gitemunits);
                    if (!row) return;
                    this.setImage(row);
                    // Prevent error gitemunits.cellEditEnding since must run first
                    setTimeout(() => {
                        this.priceperunit(row.fitem, row.funits);
                        this.wjH.gridLoad(this.itmmg04, this.$filter.transform(this.itemvendors.items,{fitem: row.fitem}, true));
                    }, 50);
                }
            },
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

                switch (col.binding) {
                    case 'funits':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value.toString(), 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            this.priceperunit(rec.fitem, rec.funits);
                            this.itemUnitsCalcMarkup(rec);
                        }
                        break;
                    case 'fweight':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) rec[col.binding] = newval;
                        break;
                    case 'fsaleprice':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            this.itemUnitsCalcMarkup(rec);
                        }
                        break;
                    case 'cfmarkup':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            // Calculate sales price
                            rec.fsaleprice = this.companyRules.salepriceCalculate(rec.cfmarkup, rec.funits, this.itmCurrent.fsalesbase);
                            // rec.fsaleprice = (this.itmCurrent.fsalesbase / (1 - (rec.cfmarkup / 100))) * rec.funits;
                            // rec.fsaleprice = this.CompanySvc.r2d(rec.fsaleprice);
                        }
                        break;
                }
            },
            columns: [
                {binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                {binding: "fuomdescription", header: "UOM Description", minWidth: 200, width: '*'},
                {binding: "fsaleprice", header: "Price", width: 110, format: 'c'},
                {binding: "cfmarkup", header: "Markup %", width: 110, format: 'n2'},
                {binding: "funits", header: "# Units", width: 100},
                {binding: "fdisplayunits", header: "# Display", width: 100 },
                { binding: "fweight", header: "Weight", width: 100 },
                {binding: "fabc", header: "ABC", width: 60,  dataMap: ['A','B','C'] },
                { binding: "factive", header: "Active", width: 80}
            ]
        });
        this.wjH.gridInit(this.gitemunits);

        // wj-flex-grid
        // itemvendors
        this.itmmg04.initialize({
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes
                
                switch (col.binding) {
                    case 'fcost':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            rec.cpriceunit = this.CompanySvc.r2d(rec.fcost / this.wjH.getGridSelectecRow(this.gitemunits).funits);
                        }
                        break;
                }
            },
            columns: [
                {binding: "fvitem", header: "Vendor Item", width: 200},
                {binding: "fdescription", header: "Vendor Description", width: '*'},
                { binding: "fvid", header: "Vendor",width: 250 },
                {binding: "fcost", header: "Cost", width: 120, format: 'c'},
                // Computed column
                {binding: "cpriceunit", header: "Per Unit", width: 90, format:'c', isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.itmmg04);
    }
}

@Component({
    selector: 'dialog-itemnumber',
    template: `
        <h1 mat-dialog-title style="min-width: 400px">{{data.title}} {{data.message}}</h1>
        <div mat-dialog-content cdkDrag cdkDragRootElement=".cdk-overlay-pane" fxLayout="row">
            <div class="form-group">
                <label>Item Number</label>
                <input type="text" class="form-control" [(ngModel)]="data.value">
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-success lmargin" style="margin-top:30px" (click)="getNextItem()">Assign Next Item (Alamo ONLY)</button>
            </div>
        </div>
        <div mat-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="validateNewItem()">Continue</button>
        </div>
    `
  })
  export class DialogItemNumber {
  
    constructor(public dialogRef: MatDialogRef<DialogItemNumber>, @Inject(MAT_DIALOG_DATA) public data: any, private DataSvc: DataService, private toastr: ToastrService) {}

    // Validate New fitem
    validateNewItem() {
        if (!this.data.value) {
            this.dialogRef.close();
            return;
        }

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: this.data.value}).subscribe((dataResponse) => {
            if (dataResponse.length === 0)
                this.dialogRef.close(this.data.value);
            else
                this.toastr.error("Item Number Already Exist!");
        });
    }
    
    // Get Next Available fitem
    getNextItem() {
        this.DataSvc.serverDataGet('api/ItemMaint/GetNextItem').subscribe((dataResponse) => {
            this.data.value = dataResponse.fitem;
        });
    }
  }

  @Component({
    selector: 'dialog-viewcustomerpricing',
    template: `
        <div mat-dialog-content>
            <div layout="column" class="widget-grid panel-nobox">
                <nav class="navbar navbar-expand-md mbg-info" fxLayout="row">
                    <span class="text-nowrap">Customer Price List</span>
                    <div fxFlex="flex"></div>
                    <span class="text-nowrap">Rows: {{wjH.rowCount(vwcustpg01)}}</span>
                </nav>
                <wj-flex-grid #vwcustpg01 style="height: 400px;"></wj-flex-grid>
            </div>
        </div>
        <div mat-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-primary" (click)="dialogRef.close()">Continue</button>
        </div>
    `
  })
  export class ViewCustomerPricing implements AfterViewInit {
    @ViewChild('vwcustpg01') vwcustpg01: WjFlexGrid;
    constructor(public dialogRef: MatDialogRef<ViewCustomerPricing>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService) {}

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/ItemMaint/GetCustomerPricingList', {pfitem: this.data.fitem}).subscribe((dataResponse) => {
            if (this.data.funits > 0 && this.data.fsalesbase > 0) {
                dataResponse.forEach((row) => {
                    row.cfmarkup = this.companyRules.markupCalculate(row.fprice, this.data.funits, this.data.fsalesbase);
                });
            }
            this.wjH.gridLoad(this.vwcustpg01, dataResponse);
        });
    }

    initGrids() {
        // wj-flex-grid
        this.vwcustpg01.initialize({
            isReadOnly: true,
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'cfeach':
                            row.cfeach = row.fprice / row.funits;
                            break;
                    }
                }
            },
            columns: [
                {binding: "fitem", header: "Item Number", width: 200 },
                {binding: "fname", header: "Customer", width: 250 },
                {binding: "fprice", header: "Price", width: 85, format: 'c', align: 'right'},
                {binding: "cfeach", header: "Each", width: 80, format:'c', align: 'right'},
                {binding: "cfmarkup", header: "Markup %", width: 90, format: 'n2'}
            ]
        });
        this.wjH.gridInit(this.vwcustpg01, true);
    }
  }