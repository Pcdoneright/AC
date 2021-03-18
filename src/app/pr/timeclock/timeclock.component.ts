import { Component, OnDestroy, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import {ToastrService} from 'ngx-toastr';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
// import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjcCore from '@grapecity/wijmo';
import {ViewHours} from "./viewHours.component";
import { appHelperService } from '../../services/appHelper.service';

@Component({
    selector: 'timeclock',
    templateUrl: './timeclock.component.html',
    styleUrls: ['./timeclock.component.css'],
    providers: [DataEntryService],
    encapsulation: ViewEncapsulation.None
})

export class TimeclockComponent implements OnDestroy, AfterViewInit {
    @ViewChild('lEmployeeg01') lEmployeeg01: WjFlexGrid;
    fadmin  = 0;
    fupdate = 0;
    pinnumber: string;
    gHeight: number;
    employeehours: DataStore;
    fcurrTime: string;
    fcurrDate: string;
    refreshIntervalId: any;
    payperiods:any[];
    currpayperiod:number;
    serverDate: Date;

    constructor(private datePipe: DatePipe, private $filter: PcdrFilterPipe, private dialog: MatDialog, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private dESrvc: DataEntryService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService, public appH: appHelperService) {
        // Data Stores, Unique Keys, updatable, validate fields
        this.employeehours = this.dESrvc.newDataStore('employeehours', ['ehid'], true, []);

        this.listEmployeeRefresh();
        this.refreshIntervalId = setInterval(() => {this.currentTime();}, 1000);

        // Get PayPeriods for DropDown
        this.DataSvc.serverDataGet('api/EmployeeMaint/GetPayperiods').subscribe((dataResponse) => {
            dataResponse.payperiods.map((item)=> {
                item.fdisplayperiod = this.datePipe.transform(item.startdate, 'MM/dd/yyyy') + ' - ' + this.datePipe.transform(item.endate, 'MM/dd/yyyy');
            });
            this.payperiods = dataResponse.payperiods;
            this.currpayperiod = this.$filter.transform(this.payperiods, {current: true}, true)[0].ppid;
        });
    }

    // Keypad event raised <keypad>
    onKeypadValueChange(event) {
        this.pinnumber = event;
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start
        this.initGrids();

        this.wjH.fixWM()
    }

    // Release resources
    ngOnDestroy() {
        // clearInterval(this.refreshIntervalId);
        clearInterval(this.refreshIntervalId);
        // this.agH.gridDestroy(this.listEmployeeGrid);
        this.employeehours.clearData();
    }

    // Format needed for setInterval
    currentTime() {
        this.serverDate.setSeconds(this.serverDate.getSeconds() + 1);
        this.fcurrTime = this.datePipe.transform(this.serverDate, 'h:mm:ss a');
        this.fcurrDate = this.datePipe.transform(this.serverDate, 'EEEE, MMMM d, y');
    };

    listEmployeeRefresh() {
        // Get Data
        this.CompanySvc.ofHourGlass(true);
        this.getServerDate();
        this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpListTC', '', false).subscribe((dataResponse) => {
            this.wjH.gridLoad(this.lEmployeeg01, dataResponse);
            this.CompanySvc.ofHourGlass(false);
        });
    }

    update(pempid) {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/EmployeeMaint/PostupdateTC', false, {pempid: pempid}).subscribe(() => {
            this.CompanySvc.ofHourGlass(false);
            this.listEmployeeRefresh(); // Always refresh list
        });
    }

    clockInOut() {
        var row = this.wjH.getGridSelectecRow(this.lEmployeeg01);
        if (!row) {
            this.toastr.info('No Employee Selected.');
            return;
        }

        if (this.pinnumber !== row.pinnumber.toString()) {
            this.toastr.error('Invalid PIN NUMBER!');
            return;
        }
        this.pinnumber = ''; // Clear Value

        this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpInOut', {pempid: row.empid}, false)
            .finally(() => {
                this.CompanySvc.ofHourGlass(false);
                // console.log('finally');
            })
            .subscribe((dataResponse) => {
            this.employeehours.loadData(dataResponse.employeehours);

            if (this.employeehours.items.length == 0) {
                this.currpayperiod = this.$filter.transform(this.payperiods, {current: true}, true)[0].ppid; // Evaluate Current PayPeriod Always
                // Check if it has Over 40 hrs
                this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpCurrentHours', {pempid: row.empid, ppid: this.currpayperiod}).subscribe((dRHrs) => {
                    // TODO: 2019/05/16 Disabled 40 hours as per Leo
                    var ftotaltime = {total: 0};
                    // var ftotaltime = this.companyRules.hoursCalculateRows(dRHrs.employeehours);
                    if (ftotaltime.total > 40) {
                        this.CompanySvc.inputDialog('Enter Admin Override Code', '', 'Your Time is Over 40 Hours', 'Continue', 'Cancel', true).subscribe((value) => {
                            if (value) {
                                this.DataSvc.serverDataGet('api/CompanyMaint/GetValidateOvertime', { pfposoverride: value }).subscribe((dataResponse) => {
                                    if (dataResponse.validate) {
                                        // Clock IN
                                        this.DataSvc.serverDataGet('api/Company/Getnextsequence', { seq: 'employeehours' }).subscribe((dRSeq) => {
                                            this.employeehours.addRow({
                                                empid: row.empid,
                                                ehid: dRSeq.data,
                                                postedflag: 0
                                                //punchin: this.datePipe.transform(new Date(), 'MM/dd/yyyy HH:mm:ss')
                                            });
                                            this.update(row.empid); // Save Changes
                                            this.toastr.info(' Just Clocked-In', row.firstname + ' ' + row.lastname, {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
                                        });
                                    }
                                    else {
                                        this.toastr.warning("Invalid Admin Override Code Entered.");
                                        return;
                                    }
                                });
                            }
                            else {
                                this.toastr.warning('Unable to Clock-In');
                                return;
                            }
                        });
                    }
                    else {
                        // Clock IN
                        this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'employeehours'}).subscribe((dRSeq) => {
                            this.employeehours.addRow({
                                empid: row.empid,
                                ehid: dRSeq.data,
                                postedflag: 0
                                //punchin: this.datePipe.transform(this.serverDate, 'MM/dd/yyyy HH:mm:ss')
                            });
                            this.update(row.empid); // Save Changes
                            this.toastr.info(' Just Clocked-In', row.firstname + ' ' + row.lastname, {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
                        });
                    }
                });
            }
            else {
                // Get server date first
                this.DataSvc.serverDataGet('api/EmployeeMaint/GetServerDate').subscribe((dataResponse) => {
                    this.serverDate = new Date(this.appH.rawdatestrTruncatetz(dataResponse));
                
                    // Clock OUT
                    this.employeehours.items[0].punchin = this.datePipe.transform(this.employeehours.items[0].punchin, 'MM/dd/yyyy HH:mm:ss'); // Transform
                    // this.employeehours.items[0].punchout = this.datePipe.transform(new Date(), 'MM/dd/yyyy HH:mm:ss');
                    this.employeehours.items[0].punchout = this.datePipe.transform(this.serverDate, 'MM/dd/yyyy HH:mm:ss');
                    this.companyRules.hoursCalculate(this.employeehours.items[0]);
                    this.update(row.empid); // Save Changes
                    this.toastr.info('Just Clocked-Out. Hours: ' + this.employeehours.items[0].totaltime, row.firstname + ' ' + row.lastname, {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
                });
            }
        })
    }

    viewHours(event) {
        var row = this.wjH.getGridSelectecRow(this.lEmployeeg01);
        if (!row) {
            this.toastr.info('No Employee Selected.');
            return;
        }

        if (this.pinnumber !== row.pinnumber.toString()) {
            this.toastr.error('Invalid PIN NUMBER!');
            return;
        }
        this.pinnumber = ''; // Clear Value
        this.currpayperiod = this.$filter.transform(this.payperiods, {current: true}, true)[0].ppid; // Reset currpayperiod

        let dialogRef: MatDialogRef<ViewHours>;
        dialogRef = this.dialog.open(ViewHours);
        // pointers
        dialogRef.componentInstance.employeeRow = row;
        dialogRef.componentInstance.currpayperiod = this.currpayperiod;
        dialogRef.componentInstance.payperiods = this.payperiods;
        dialogRef.afterClosed().subscribe();
    }

    getServerDate() {
        this.DataSvc.serverDataGet('api/EmployeeMaint/GetServerDate').subscribe((dataResponse) => {
            // this.serverDate = new Date(dataResponse);
            this.serverDate = new Date(this.appH.rawdatestrTruncatetz(dataResponse));
        });
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gHeight = window.innerHeight - 105;
        }, 100);
    };
    
    // Initialize Grid presentation (s/b on html)
    initGrids() {
        // wj-flex-grid
        this.lEmployeeg01.initialize({
            isReadOnly: true,
            // formatItem: (s, e) => {
            //     if (e.panel == s.cells) {
            //         console.log('formatItem');
            //         var row = s.rows[e.row].dataItem;
            //         wjcCore.toggleClass(e.cell, 'inRow', row.finout == 'I');
            //         // if (dataItem.finout == 'I') e.cell.style.backgroundColor = 'green';
            //     }
            // },
            loadedRows: (s,e) => { // apply cssClass to rows after loading them
                // console.log('loadedRows');
                for (var i = 0; i < s.rows.length; i++) {
                    var row = s.rows[i];
                    if (row.dataItem.finout == 'I') row.cssClass = 'inRow';
                }
            },
            columns: [
                { binding: 'lastname', header: 'Last', width: '*' },
                { binding: 'firstname', header: 'First', width: '*' }
            ]
        });
        this.wjH.gridInit(this.lEmployeeg01, true);
    }
}
