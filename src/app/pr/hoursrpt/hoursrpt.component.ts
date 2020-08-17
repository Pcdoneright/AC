import { Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import { DataService } from '../../services/data.service';
import { DataEntryService } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';

@Component({
    selector: 'hoursrpt',
    templateUrl: './hoursrpt.component.html',
    providers: [DataEntryService] // New instance gets created
})
export class HoursRptComponent implements OnDestroy, AfterViewInit {
    fdatef = new Date();
    fdatet = new Date();
    femployee = -1;
    fdetails = false;
    employees: any;

    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, public wjH: wjHelperService) {
        this.DataSvc.serverDataGet('api/EmployeeMaint/GetEmpListDD').subscribe((dataResponse) => {
            this.employees = dataResponse;
            this.employees.unshift({empid: -1, name: 'All'}); // Add ALL
        });
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
        this.wjH.fixWM()
    }

    print() {
        var mParms = [
            {fline: 1, fdate: this.fdatef},
            {fline: 2, fdate: this.fdatet},
            {fline: 3, fstring: this.fdetails.toString()},
            {fline: 4, fnumber: this.femployee || -1}
        ];

        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateReport('d_employee_hours_report', mParms, 3).subscribe((pResponse) => {
            setTimeout(() => {this.CompanySvc.ofOpenServerFile(pResponse.data);}, 1000);
        });
    }
}