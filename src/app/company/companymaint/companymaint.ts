import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, Directive, ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';

@Component({
    selector: 'companymaint',
    templateUrl: './companymaint.html',
    providers: [DataEntryService]
})
export class companymaint implements AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('bar03', {static: true}) bar03: pcdrBuilderComponent;
    @ViewChild('cmpnyg01', {static: true}) cmpnyg01: WjFlexGrid;
    
    selectedTab = 0;
    gH01:number;
    cpyCurrent: any = {fcrdraweramt: 0};

    companies:DataStore;
    companylocations:DataStore;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, private dESrvc: DataEntryService, private companyRules: CompanyRulesService, private toastr: ToastrService, private $filter: PcdrFilterPipe, public wjH: wjHelperService, public sharedSrvc: SharedService, public dialog: MatDialog) {
        // Data Stores, Assign Unique Keys
        this.companies = this.dESrvc.newDataStore('companies', ['fcmpid'], true, ['FNAME']);
        this.companylocations = this.dESrvc.newDataStore('companylocations', ['fcmpid', 'fcmplid'], true, ['fname']);
       
        this.dESrvc.validateDataStore('companies', 'CUSTOMER PROPERTIES', 'FNAME', 'NAME');
        this.dESrvc.validateDataStore('companylocations', 'FAVORITE ITEMS', 'fname', 'NAME');
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Properties', 
            buttons: [
                {name: 'Save', style: 'primary', action: 'update', val: null}
            ],
            navButtons: [
                {name: 'Locations', action: 'selectedTab', val: 1},
                {name: 'Custom', action: 'selectedTab', val: 2}
            ],
            subnavbar: false
        })

        this.bar02.setNavProperties(this, {
            title: 'Locations', 
            buttons: [
                {name: 'Add', style: 'success', icon: 'plus', action: 'locationAdd', val: null},
                {name: 'Remove', style: 'danger', icon: 'minus', action: 'locationRemove', val: null}
            ],
            navButtons: [
                {name: 'Properties', action: 'selectedTab', val: 0},
                {name: 'Custom', action: 'selectedTab', val: 2}
            ],
            rows: {grid: 'cmpnyg01'},
            subnavbar: false
        })
        
        this.bar03.setNavProperties(this, {
            title: 'Override', 
            navButtons: [
                {name: 'Properties', action: 'selectedTab', val: 0},
                {name: 'Locations', action: 'selectedTab', val: 1}
            ],
            subnavbar: false
        })
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.initGrids();
        this.wjH.fixWM();
        this.retrieveRecord();
    }

    // barXX Events
    onClickNav(parm) {
        
        switch(parm.action) {
            case 'selectedTab':
                this.selectedTab = parm.val;
                if (this.selectedTab == 1) {
                    this.onResize(null);
                    this.gridRepaint('2');
                }
                break;
            default:
                this[parm.action](parm.val);
                break;
        }
    }

    // Get Item for EDIT
    retrieveRecord() {
        this.CompanySvc.ofHourGlass(true);

        this.DataSvc.serverDataGet('api/CompanyMaint/GetCompany').subscribe((dataResponse) => {
            this.companies.loadData(dataResponse.companies);
            this.companylocations.loadData(dataResponse.companylocations);
            this.cpyCurrent = this.companies.items[0];
            
            this.wjH.gridLoad(this.cmpnyg01, this.companylocations.items);
            this.CompanySvc.ofHourGlass(false);
        });
        
    }

    // Save the item
    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);

        // Last Update
        this.companies.items[0].ts = new Date();
        this.companies.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/CompanyMaint/Postupdate').finally(() => {
            this.CompanySvc.ofHourGlass(false)
        }).subscribe();
    }

    // Valid Entry
    validEntry() {
        return (this.companies.items.length == 1);
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

    locationRemove() {
        this.gridRemove(this.companylocations, this.cmpnyg01);
    }

    locationAdd() {
        if (!this.validEntry()) return;

        this.companylocations.addRow({
            fcmpid: this.cpyCurrent.fcmpid,
            fcmplid: this.dESrvc.getMaxValue(this.companylocations.items, 'fcmplid') + 1,
        }, true);

        this.wjH.gridLoad(this.cmpnyg01, this.companylocations.items);
        this.wjH.gridScrollToRow(this.cmpnyg01, 1, 0);
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gH01 = window.innerHeight - 101;
        }, 100);
    };

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint(tab) {
        setTimeout(() => {
            switch (tab) {
                case '1':
                    this.wjH.gridRedraw(this.cmpnyg01);
                    break;
            }
        }, 100);
    }

    // Initialize Grid presentation (s/b on html)
    initGrids() {
        // wj-flex-grid
        this.cmpnyg01.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'ffax':
                        case 'fphone':
                            if (this.wjH.gridEditingCell(s, e)) break;
                            var row = s.rows[e.row].dataItem;
                            e.cell.textContent = this.CompanySvc.phoneRenderer({value: row[col.binding]});
                            break;
                    }
                }
            },
            columns: [
                {binding: "fcmplid", header: "ID", width: 50, isReadOnly: true},
                {binding: "fname", header: "Name", width: '*'},
                {binding: "faddress1", header: "Address 1", width: 250},
                {binding: "faddress2", header: "Address 2", width: 250},
                {binding: "fcity", header: "City", width: 150},
                {binding: "fstate", header: "State", width: 80},
                {binding: "fzip", header: "Zip", width: 80},
                {binding: "fphone", header: "Phone", width: 130},
                {binding: "ffax", header: "Fax", width: 130}
            ]
        });
        this.wjH.gridInit(this.cmpnyg01, true);
    }
}

// @Directive({
//     selector: '[pcdrDirective]',
// })
// export class PcdrDirectiveDirective {
//     constructor(element: ElementRef) {
//         element.nativeElement.style.backgroundColor = 'red';
//         console.log('PcdrDirectiveDirective');

//     }    
// }