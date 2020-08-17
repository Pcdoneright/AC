import { Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { DataEntryService } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import {SharedService} from '../../services/shared.service';

@Component({
    selector: 'app-quickcalling',
    templateUrl: './quickcalling.component.html',
    providers: [DataEntryService] // New instance gets created
})
export class QuickcallingComponent implements OnDestroy {
    fdatef = new Date();
    fdatet = new Date();

    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, private datePipe: DatePipe) {
    }

    ngOnDestroy() {}

    print() {
        var mParms = 'pfbranch=' + this.sharedSrvc.user.fbranch +
            "&pfdatefrom=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
            "&pfdateto=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd');

        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateJasperReport('QuickRenewal.pdf', mParms).subscribe((pResponse) => {
            setTimeout(() => this.CompanySvc.ofOpenServerFile(pResponse.data), 1000);
        });
    }
}