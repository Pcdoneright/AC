import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormControl } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { DataService } from "../../services/data.service";
import { DataEntryService, DataStore } from "../../services/dataentry.service";
import { CompanyService } from "../../services/company.service";
import { CompanyRulesService } from "../../services/companyrules.service";
import { SharedService } from "../../services/shared.service";
import { wjHelperService } from "../../services/wjHelper.service";
import { PcdrFilterPipe } from "../../pipes/pcdrfilter.pipe";
import { WjFlexGrid } from "@grapecity/wijmo.angular2.grid";
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjcCore from "@grapecity/wijmo";
import { ItemList } from "../../inventory/itemlist/itemlist.component";
import { pcdrBuilderComponent } from "../../services/builder/builder.component";

@Component({
    selector: "slminvntry",
    templateUrl: "./slminvntry.component.html",
    providers: [DataEntryService]
})
export class SlminvntryComponent implements AfterViewInit {
    fadmin: boolean = false;
    fupdate: boolean = false;
    tH01: number;
    changeSalesmen = true;
    selectedTab: number = 0;

    fuserid: number = -1;
    sodatef: Date = new Date();
    sodatet: Date = new Date();

    showMoreEdit: boolean;
    fitem: string;
    // @ViewChild('fitemE') fitemE: ElementRef;
    defDepartment: number = 2; // TODO: s/b from companymstr

    // objects, DS, Grids, arrays
    @ViewChild("g01") listGrid: WjFlexGrid;
    soCurrent: any = {};
    salespersons: any[];
    companylocations: any[];
    smorders: DataStore;
    smdetails: DataStore;

    @ViewChild("bar01", {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild("bar02", {static: true}) bar02: pcdrBuilderComponent;
    // public get mfshipdate() : Date { return this.salesordersFG.controls['fshipdate'].value; }
    // public set mfshipdate(value) { this.salesordersFG.controls['fshipdate'].setValue(value); }

    constructor(
        private CompanySvc: CompanyService,
        DataSvc: DataService,
        private dESrvc: DataEntryService,
        toastr: ToastrService,
        private sharedSrvc: SharedService,
        dialog: MatDialog,
        private $filter: PcdrFilterPipe,
        public wjH: wjHelperService,
        companyRules: CompanyRulesService
    ) {
        this.sharedSrvc.setProgramRights(this, "slminvntry"); // sets fupdate, fadmin
        window.onresize = e => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.sodatef.setHours(12, 0, 0); // set hours to noon always
        this.sodatet.setHours(12, 0, 0);

        this.smorders = this.dESrvc.newDataStore("smorders", ["fsmid"], true, [
            "fdate"
        ]);
        this.smorders = this.dESrvc.newDataStore(
            "smdetails",
            ["fsmid", "fsmdid"],
            true,
            ["fitem", "fdescription", "fimid"]
        );
        this.dESrvc.validateDataStore(
            "smorders",
            "PROPERTIES",
            "fdate",
            "DATE"
        );
        this.dESrvc.validateDataStore("smorders", "DETAILS", "fitem", "ITEM");
        this.dESrvc.validateDataStore(
            "smorders",
            "DETAILS",
            "fimid",
            "ITEM MASTER ID"
        );
        this.dESrvc.validateDataStore(
            "smorders",
            "DETAILS",
            "fdescription",
            "DESCRIPTION"
        );

        // Get Salespersons
        DataSvc.serverDataGet("api/SalesmanMaint/Getlist").subscribe(
            dataResponse => {
                this.salespersons = dataResponse;
                this.salespersons.unshift({ fuserid: -1, fname: "All" }); // Add All
            }
        );
        // Find if user is a salesperson
        DataSvc.serverDataGet("api/SalesmanMaint/GetSalesman", {
            pfuserid: this.sharedSrvc.user.fuid
        }).subscribe(dataResponse => {
            if (dataResponse.length > 0) {
                this.fuserid = dataResponse[0].fuserid;
                this.changeSalesmen = false;
            }
        });
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();

        // this.dESrvc.initCodeTable().subscribe((dataResponse) => {
        //     // this.salespaymentsGrid.columns[1].dataMap = new wjGrid.DataMap(this.$filter.transform(dataResponse, {fgroupid: 'CPT'}, true), 'fid', 'fdescription');
        //     // this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'SOS'}, true);
        //     // this.orderstatus.unshift({fid: 'A', fdescription: 'All'}); // Add All
        // }); // when codetable is needed
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: "Inventory List",
            buttons: [
                { name: "New Inventory", style: "success", action: "newOrder" },
                { name: "View Selected", style: "light", action: "viewOrder" }
            ],
            rows: { grid: "listGrid" },
            navButtons: [{ name: "Edit", action: "selectedTab", val: 1 }]
        });

        this.bar02.setNavProperties(this, {
            title: "Properties",
            buttons: [
                { name: "Post", style: "primary", action: "post", val: null }
            ],
            validEntry: true,
            navButtons: [{ name: "List", action: "selectedTab", val: 0 }]
        });
    }

    onClickNav(parm) {
        switch (parm.action) {
            case "selectedTab":
                this.selectedTab = parm.val;
                break;
            case "newOrder":
                console.log(parm.action);
                break;
            case "viewOrder":
                console.log(parm.action);
                break;
            case "post":
                console.log("save");
                break;
        }

        console.log("parent", parm);
    }

    validEntry() {
        return false;
    }

    newOrder() {}

    onResize(event) {
        this.tH01 = window.innerHeight - 55;
    }

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            switch (this.selectedTab) {
                case 0:
                    this.wjH.gridRedraw(this.listGrid);
                    break;
                case 1:
                    // this.wjH.gridRedraw(this.salesdetailsGrid);
                    break;
                // case 2:
                //     this.wjH.gridRedraw(this.salespaymentsGrid);
                //     break;
            }
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.listGrid.initialize({
            isReadOnly: true,
            columns: [
                { binding: "fsmid", header: "ID", width: 60, format: "D" },
                {
                    binding: "fdate",
                    header: "Date",
                    width: 100,
                    format: "MM/dd/yyyy"
                },
                { binding: "fname", header: "Name", width: 300 },
                { binding: "ftotal", header: "Total", width: 130, format: "c" },
                {
                    binding: "fnotes",
                    header: "Notes",
                    width: "*",
                    wordWrap: true
                }
            ]
        });
        this.wjH.gridInit(this.listGrid, true);
        this.listGrid.hostElement.addEventListener("dblclick", e => {
            //this.listSOGridRefresh();
        });
        new wjGridFilter.FlexGridFilter(this.listGrid);

        // wj-flex-grid
        // this.listSOGrid.initialize({
        //     isReadOnly: true,
        //     columns: [
        //         { binding: "fdocnumber", header: "S.O.#", width: 80, format:'D' },
        //         { binding: "fdate", header: "Date", width: 100, format:'MM/dd/yyyy' },
        //         { binding: "finvoice_date", header: "Invoiced", width: 120, format:'MM/dd/yyyy' },
        //         { binding: 'cfstatus', header: 'Status', width: 100 },
        //         { binding: 'fname', header: 'Customer', width: '*' },
        //         { binding: 'ftotal', header: 'Total', width: 130, format: 'c' },
        //         { binding: 'fbalance', header: 'Balance', width: 130, format: 'c' }
        //     ]
        // });
        // this.wjH.gridInit(this.listSOGrid, true);
        // this.listSOGrid.columnFooters.rows.push(new wjGrid.GroupRow());
        // this.listSOGrid.hostElement.addEventListener('dblclick', (e)=> {
        //     this.listSOGridEdit();
        // });
        // new wjGridFilter.FlexGridFilter(this.listGrid);

        // // wj-flex-grid
        // this.salesdetailsGrid.initialize({
        //     formatItem: (s, e) => {
        //         if (e.panel == s.cells) {
        //             var col = s.columns[e.col], row = s.rows[e.row].dataItem;
        //             switch (col.binding) {
        //                 case 'cextended':
        //                 case 'fprice':
        //                     if (row.cfmarkup < this.minMarkup || row.fprice <= 0) {
        //                         wjcCore.toggleClass(e.cell, 'alert-row', true);
        //                     }
        //                     break;
        //                 case 'cunit':
        //                     e.cell.textContent = this.CompanySvc.currencyRenderer({value: this.CompanySvc.r2d(row.fprice / row.funits)});
        //                     break;
        //             }
        //         }
        //     },
        //     cellEditEnding: (s, e) => {
        //         var col = s.columns[e.col];
        //         var rec = s.rows[e.row].dataItem;
        //         if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

        //         switch (col.binding) {
        //             case 'fqty':
        //             case 'fprice':
        //                 var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
        //                 if (newval != rec[col.binding]) {
        //                     rec[col.binding] = newval;
        //                     this.salesdetailsComputed(rec, rec.fprice, rec.fqty);
        //                     this.salesordersTotals();
        //                     rec.cfmarkup = this.companyRules.markupCalculate(rec.fprice, rec.funits, rec.fsalesbase);
        //                 }
        //                 break;
        //         }
        //     },
        //     columns: [
        //         { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
        //         { binding: "cfitem", header: "UOM", width: 150, isReadOnly: true},
        //         { binding: "fdescription", header: "Description", width: '*'},
        //         { binding: "fprice", header: "Price", format: 'c', width: 80, },
        //         { binding: "cunit", header: "@Unit", dataType: 'Number', format: 'c', width: 80, isReadOnly: true },
        //         // { binding: "cfmarkup", header: "Markup%", width: 80, isReadOnly: true },
        //         { binding: "fqty", header: "Qty", width: 80, aggregate: 'Sum' },
        //         { binding: "fistaxable", header: "Tax", width: 70, isReadOnly: true },
        //         { binding: "cextended", header: "Extended", width: 100, format: 'c', isReadOnly: true },
        //         { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', isReadOnly: true }
        //     ]
        // });
        // this.wjH.gridInit(this.salesdetailsGrid);
        // this.salesdetailsGrid.columnFooters.rows.push(new wjGrid.GroupRow());
    }
}
