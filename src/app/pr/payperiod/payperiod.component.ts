import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { DatePipe } from '@angular/common';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { finalize } from "rxjs/operators";

@Component({
    selector: 'app-payperiod',
    templateUrl: './payperiod.component.html',
    providers: [DataEntryService] // New instance gets created
})
export class PayperiodComponent implements OnDestroy, AfterViewInit {
    @ViewChild('ppmgrid01') ppmgrid01:WjFlexGrid;
    gH01: number;
    payperiods: DataStore;

    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, public wjH: wjHelperService, private datePipe: DatePipe) {
        // Data Stores, Unique Keys, updatable, validate fields
        this.payperiods = this.dESrvc.newDataStore('payperiods', ['ppid'], true, ['startdate', 'endate']);
        this.dESrvc.validateDataStore('payperiods', 'PERIODS', 'startdate', 'START DATE');
        this.dESrvc.validateDataStore('payperiods', 'PERIODS', 'endate', 'END DATE');
    }

    ngAfterViewInit(){
        window.onresize = (e) => {this.onResize(e); }; // Capture resize event
        this.onResize(null); // Execute at start
        this.initGrids();
        this.wjH.fixWM();

        this.DataSvc.serverDataGet('api/EmployeeMaint/GetPayperiods', false).subscribe((dataResponse) => {
            // dataResponse.payperiods.map((item)=> {
            //     if (item.startdate) item.startdate = this.datePipe.transform(item.startdate, 'MM/dd/yyyy'); // Convert To String Date
            //     if (item.endate) item.endate = this.datePipe.transform(item.endate, 'MM/dd/yyyy'); // Convert To String Date
            // });

            this.payperiods.loadData(dataResponse.payperiods);
            this.wjH.gridLoad(this.ppmgrid01, this.payperiods.items)
        });
    }

    ngOnDestroy() {
        this.payperiods.clearData();
    }

    update() {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/EmployeeMaint/PostupdatePayperiod').pipe(finalize(() => {
            this.CompanySvc.ofHourGlass(false);
        })).subscribe();
    }

    payperiodAdd() {
        this.payperiods.addRow({
            ppid: this.dESrvc.getMaxValue(this.payperiods.items, 'ppid') + 1,
            current: false
        }, true);

        this.wjH.gridLoad(this.ppmgrid01, this.payperiods.items);
        this.wjH.gridScrollToRow(this.ppmgrid01, 1, 0); // Focus
    }

    payperiodRemove() {
        this.wjH.removeGridRow(this.ppmgrid01, this.payperiods).subscribe(); // must subscribe
    }

    onResize(event) {
        setTimeout(() => {
            this.gH01 = window.innerHeight - 103;
        }, 100);
    };

    initGrids() {
        this.ppmgrid01.initialize({
            columns: [
                { binding: "current", header: "Active", width: 70 },
                { binding: 'startdate', header: 'Start Date', width: 160, format: 'MM/dd/yyyy' },
                { binding: 'endate', header: 'End Date', width: 160, format: 'MM/dd/yyyy'  }
            ]
        });
        this.wjH.gridInit(this.ppmgrid01);
        this.wjH.gridCreateEditor(this.ppmgrid01.columns.getColumn('startdate'));
        this.wjH.gridCreateEditor(this.ppmgrid01.columns.getColumn('endate'));
    }
}