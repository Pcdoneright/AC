import { Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { DataEntryService } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { SharedService } from '../../services/shared.service';
// import { PcdrClover } from '../../services/clover.service';

@Component({
    selector: 'app-dailybreakdown',
    templateUrl: './dailybreakdown.component.html',
    providers: [DataEntryService] // New instance gets created
})
export class DailybreakdownComponent implements OnDestroy, AfterViewInit {
    fadmin = false;
    fupdate = false;
    fdatef = new Date();
    fdatet = new Date();
    fuser = '';
    users:[any];
    gridata: [any];

    // constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, private datePipe: DatePipe, private mClover: PcdrClover) {
    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, private datePipe: DatePipe) {

        //this.sharedSrvc.setProgramRights(this, 'soentrytouch'); // Set rights

        // this.DataSvc.serverDataGet('api/UserMaint/GetlistDDW').subscribe((dataResponse) => {
        //     this.users = dataResponse;
        //     this.users.unshift({ffirst: 'All'}); // Add All

        //     if (this.fadmin) {
        //         this.fuser = 'All';
        //     }
        //     else {
        //         this.fuser = this.sharedSrvc.user.fname;
        //     }
        // });

        this.DataSvc.serverDataGet('api/UserMaint/Getlist').subscribe((dataResponse) => {
            this.CompanySvc.ofHourGlass(false);
            this.gridata = dataResponse;
            // if (dataResponse.length === 0) this.toastr.info('No Rows found');
        });
    }

    ngAfterViewInit() {
        console.log('ngAfterViewInit');
    }

    message() {
        // this.mClover.connector.showMessage("Welcome To Alamo Candy");
    }

    void() {
        // this.mClover.connector.showWelcomeScreen();
    }

    ngOnDestroy() {}

    print() {
        // this.mClover.saleTransaction(7500);


        // let mParms = 'pfbranch=' + this.sharedSrvc.user.fbranch +
        //     "&pfdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
        //     "&pfdatet=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd') +
        //     "&pwhere=" + ((this.fuser == 'All')? "''": 'AND fby = "' + this.fuser + '"');

        // this.CompanySvc.ofHourGlass(true);
        // this.CompanySvc.ofCreateJasperReport('DailyBreakdown.pdf', mParms).subscribe((pResponse) => {
        //     setTimeout(() => this.CompanySvc.ofOpenServerFile(pResponse.data), 1000);
        // });
    }
}




