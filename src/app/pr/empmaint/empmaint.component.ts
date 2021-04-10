import { MatDialogRef } from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjCore from "@grapecity/wijmo";
import { finalize } from "rxjs/operators";
// declare var $: any;

@Component({
    selector: 'empmaint',
    templateUrl: './empmaint.component.html',
    styleUrls: ['./empmaint.component.css'],
    providers: [DataEntryService],
    encapsulation: ViewEncapsulation.None
})
export class EmpMaintComponent implements AfterViewInit {
    fadmin: boolean = false;
    fupdate: boolean = false;

    @ViewChild('empmntg01') empmntg01: WjFlexGrid;
    @ViewChild('empmntg02') empmntg02: WjFlexGrid;
    gH01: number;
    gH02: number;

    selectedTab: number = 0;
    empCurrent:any = {fstartdate: new Date()};
    listCustomerGridSearch = new FormControl();
    ctype: string = "N"; // By Name
    employees: DataStore;
    employeehours: DataStore;
    hrslimit = 'Y'; // Limit Rows to retrieve
    empActive = true;
    
    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, private dESrvc: DataEntryService, private companyRules: CompanyRulesService, public wjH: wjHelperService, private $filter: PcdrFilterPipe, private datePipe: DatePipe, private toastr: ToastrService, public sharedSrvc: SharedService) {
        this.sharedSrvc.setProgramRights(this, 'empmaint'); // sets fupdate, fadmin

        this.employees = this.dESrvc.newDataStore('employees', ['empid'], true, ['firstname', 'lastname', 'ssn', 'paytype', 'pinnumber']);
        this.dESrvc.validateDataStore('employees', 'PROPERTIES', 'firstname', 'FIRST NAME');
        this.dESrvc.validateDataStore('employees', 'PROPERTIES', 'lastname', 'LAST NAME');
        this.dESrvc.validateDataStore('employees', 'PROPERTIES', 'ssn', 'SSN#');
        this.dESrvc.validateDataStore('employees', 'PROPERTIES', 'paytype', 'PAY TYPE');
        this.dESrvc.validateDataStore('employees', 'PROPERTIES', 'pinnumber', 'PIN NUMBER');
        
        this.employeehours = this.dESrvc.newDataStore('employeehours', ['ehid', 'empid'], true, []);

        // this.listCustomerGridSearch.valueChanges
        //     .debounceTime(800)
        //     .distinctUntilChanged()
        //     .switchMap(val => {
        //         if (this.ctype != "A" && val.length < 3) return [];
        //         this.CompanySvc.ofHourGlass(true);
        //         return this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpList', {pActive: this.empActive, pName: val, pType: this.ctype});
        //     })
        //     .subscribe(results => {
        //         // this.listCustomerGrid.api.setRowData(results);
        //         this.wjH.gridLoad(this.empmntg01, results);
        //         if (results.length === 0) this.toastr.info('No Rows found');
        //         this.CompanySvc.ofHourGlass(false);
        //     });

        this.listCustomerGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (this.ctype != "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpList', {pActive: this.empActive, pName: val, pType: this.ctype});
            })
            .subscribe(results => {
                // this.listCustomerGrid.api.setRowData(results);
                this.wjH.gridLoad(this.empmntg01, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });

    }

    empListSearch() {
        this.listCustomerGridSearch.setValue(!this.listCustomerGridSearch.value);
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.initGrids();
        this.wjH.fixWM();
        
        // $(document).ready(() => {
        // });
    }

    // Valid Entry
    validEntry() {
        if (!this.employees) return false;
        return (this.employees.items.length === 1);
    }

    // Save
    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        // Last Update
        this.employees.items[0].ts = new Date();
        this.employees.items[0].fusername = this.sharedSrvc.user.fname;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/EmployeeMaint/Postupdate', true, '', this.prepareUpdate).pipe(finalize(() => {
            this.CompanySvc.ofHourGlass(false)
        })).subscribe();
    }

    // Callback
    prepareUpdate = (data) => {
        // Transfor Data Before Sending
        var cl = data.filter(item => item[0] == 'employeehoursupdate');
        if (cl.length > 0) {
            cl[0][1].map((item)=> { // Get Record, 2nd element, all rows
                item.punchout = (item.punchout) ? this.datePipe.transform(new Date(item.punchout), 'yyyy-MM-dd HH:mm:ss'): '';
                item.punchin = (item.punchin) ? this.datePipe.transform(new Date(item.punchin), 'yyyy-MM-dd HH:mm:ss'): '';
            });
        }

        cl = data.filter(item => item[0] == 'employeehoursinsert');
        if (cl.length > 0) {
            cl[0][1].map((item)=> { // Get Record, 2nd element, all rows
                item.punchout = (item.punchout) ? this.datePipe.transform(new Date(item.punchout), 'yyyy-MM-dd HH:mm:ss'): '';
                item.punchin = (item.punchin) ? this.datePipe.transform(new Date(item.punchin), 'yyyy-MM-dd HH:mm:ss'): '';
            });
        }
    };

    createEmp() {
        this.dESrvc.pendingChangesContinue().then(() => {
            this.CompanySvc.ofHourGlass(true);
            this.employees.clearData();
            this.employeehours.clearData();
            this.wjH.gridLoad(this.empmntg02, this.employeehours.items);

            this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'employees'}).subscribe((dataResponse) => {
                this.employees.addRow({
                    empid: dataResponse.data,
                    active: true,
                    paytype: 'H',
                    finout: 'O',
                    fstartdate: new Date()
                });
                // this.$timeout(() => {
                //     this.searchId = ''; // Clear Value
                //     angular.element('#fname')[0].focus(); // Set focus
                // }, 100);
                this.empCurrent = this.employees.items[0]; // Load current row
                this.CompanySvc.ofHourGlass(false)
            });
        }).catch(()=>{});
    }

    listEdit() {
        let row = this.wjH.getGridSelectecRow(this.empmntg01);
        if (!row) return;
        this.retrieveEmp(row.empid);
    }

    retrieveEmp(empid) {
        if (!empid) return;
        this.selectedTab = 1;

        this.dESrvc.pendingChangesContinue().then(() => {
            this.CompanySvc.ofHourGlass(true);
            this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmployee', {pempid: empid, plimit: this.hrslimit}, false).subscribe((dataResponse) => {
                // Transform Data Before Use
                // dataResponse.employees.map((item)=> {
                //     if (item.fstartdate) item.fstartdate = new Date(item.fstartdate.replace("T00", "T12"));
                // });

                dataResponse.employeehours.map((item)=> {
                    if (item.punchin) item.punchin = this.datePipe.transform(item.punchin, 'MM/dd/yyyy HH:mm:ss');
                    if (item.punchout) item.punchout = this.datePipe.transform(item.punchout, 'MM/dd/yyyy HH:mm:ss');
                });

                this.employees.loadData(dataResponse.employees);
                this.employeehours.loadData(dataResponse.employeehours);

                this.empCurrent = this.employees.items[0]; // Load current row
                this.wjH.gridLoad(this.empmntg02, this.employeehours.items);
                this.CompanySvc.ofHourGlass(false)
            });
        }).catch(()=>{});
    }

    hoursCalculate() {
        if (!this.validEntry()) return;
        var row = this.wjH.getGridSelectecRow(this.empmntg02);
        if (!row) return;
        if (!row.punchout) return;

        this.companyRules.hoursCalculate(row);
        this.empmntg02.refreshCells(false);
    }

    // Remove Rows
    hoursRemove() {
        if (!this.validEntry()) return;
        this.wjH.removeGridRow(this.empmntg02, this.employeehours).subscribe(); // must subscribe
    }

    hoursAdd() {
        if (!this.validEntry()) return;

        this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'employeehours'}).subscribe((dataResponse) => {
            this.employeehours.addRow({
                empid: this.employees.items[0].empid,
                ehid: dataResponse.data,
                punchin: this.datePipe.transform(new Date(), 'MM/dd/yyyy HH:mm:ss'),
                postedflag: 0
            }, true);

            this.wjH.gridLoad(this.empmntg02, this.employeehours.items);
            this.wjH.gridScrollToRow(this.empmntg02, 1, 0); // Focus
        });
    }

    printrpt() {
        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateJasperReport('employeeactivelist.pdf', '').subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gH01 = window.innerHeight - 155;
            this.gH02 = window.innerHeight - 610;
        }, 100);
    };

    // Allows w2grid to repaint properly due to multiple tabs
    gridRepaint(tab) {
        switch (tab) {
            case '1':
                this.wjH.gridRedraw(this.empmntg02);
                break;
            case '2':
                // this.wjH.gridRedraw(this.oemGrid05);
                break;
        }
    }

    initGrids() {
        // wj-flex-grid
        this.empmntg01.initialize({
            isReadOnly: true,
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'ssn':
                            e.cell.textContent = this.CompanySvc.ssnRenderer({value: row[col.binding]});
                            break;
                        case 'fphone':
                            e.cell.textContent = this.CompanySvc.phoneRenderer({value: row[col.binding]});
                            break;
                        case 'finout':
                            wjCore.toggleClass(e.cell, 'In', (e.panel.getCellData(e.row, e.col) == 'I'));
                            e.cell.textContent = (e.panel.getCellData(e.row, e.col) == 'I')? 'In': 'Out';
                            break;
                    }
                }
            },
            columns: [
                {binding: "active", header: "Active", width: 90},
                {binding: "empid", header: "ID", width: 65},
                {binding: "lastname", header: "Last Name", width: 200},
                {binding: "firstname", header: "First", width: 150},
                {binding: "ssn", header: "SSN", width: 110},
                {binding: "pinnumber", header: "Pin", width: 80, format:'D' },
                {binding: "fphone", header: "Phone", width: 125},
                {binding: "fstartdate", header: "Start Date", width: 120, format: 'MM/dd/yyyy'},
                {binding: "finout", header: "In/Out", width: 100}
            ]
        });
        this.wjH.gridInit(this.empmntg01, true);
        this.empmntg01.hostElement.addEventListener('dblclick', (e)=> {
            this.retrieveEmp(this.wjH.getGridSelectecRow(this.empmntg01).empid);
        });
        new wjGridFilter.FlexGridFilter(this.empmntg01);
        // let filter = new wjGridFilter.FlexGridFilter(this.empmntg01);
        //filter.defaultFilterType = wjGridFilter.FilterType.Value;  

        // wj-flex-grid
        this.empmntg02.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'punchin':
                        case 'punchout':
                            if (this.wjH.gridEditingCell(s, e)) break;
                            e.cell.textContent = this.datePipe.transform(row[col.binding], 'EEE MM/dd/yyyy h:mm:ss a');
                            break;
                    }
                }
            },
            columns: [
                {binding: "ehid", header: "ID", width: 80, format: 'D', isReadOnly: true},
                {binding: "punchin", header: "Time In", width: 230 },
                {binding: "punchout", header: "Time Out", width: 230 },
                {binding: "totaltime", header: "Hours", width: 110, isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.empmntg02);
    }
}
