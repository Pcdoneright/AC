import { MatDialogRef } from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataStore } from '../../services/dataentry.service';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
// declare var $: any;

@Component({
    selector: 'view-hours',
    templateUrl: './viewHours.component.html'
})
export class ViewHours implements AfterViewInit {
    @ViewChild('vhrsg01') vhrsg01: WjFlexGrid;
    currpayperiod: number;
    payperiods:any[];
    employeeRow: any = {};

    constructor(public dialogRef: MatDialogRef<ViewHours>, private CompanySvc: CompanyService, private DataSvc: DataService, private companyRules: CompanyRulesService, public wjH: wjHelperService, private $filter: PcdrFilterPipe, private datePipe: DatePipe) {}

    ngAfterViewInit() {
        this.initGrids();
        this.viewHoursGetHours()
        
        // $(document).ready(() => {
        // });
    }

    onYes() {
        this.dialogRef.close(true);
    }

    viewHoursGetHours() {
        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpCurrentHours', {pempid: this.employeeRow.empid, ppid: this.currpayperiod}, false).subscribe((dataResponse) => {
            var ftotaltime = this.companyRules.hoursCalculateRows(dataResponse.employeehours);
            this.wjH.gridLoad(this.vhrsg01, dataResponse.employeehours);
            this.vhrsg01.columnFooters.setCellData(0, 2, ftotaltime.totalstring);
            this.CompanySvc.ofHourGlass(false);
        });
    }

    initGrids() {
        // wj-flex-grid
        this.vhrsg01.initialize({
            isReadOnly: true,
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'punchin':
                        case 'punchout':
                            e.cell.textContent = this.datePipe.transform(row[col.binding], 'EEE MM/dd/yyyy h:mm:ss a');
                            break;
                    }
                }
            },
            columns: [
                { binding: "punchin", header: "Time In", width: 230 },
                { binding: 'punchout', header: 'Time Out', width: 230 },
                { binding: "totaltime", header: "Hours", width: 110 }
            ]
        });
        this.wjH.gridInit(this.vhrsg01);
        this.vhrsg01.columnFooters.rows.push(new wjGrid.GroupRow());
    }
}
