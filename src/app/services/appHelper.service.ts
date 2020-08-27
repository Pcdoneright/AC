import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../services/shared.service';
import { CompanyService } from '../services/company.service';

import { Observable } from 'rxjs/Observable';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjCore from '@grapecity/wijmo';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjInput from '@grapecity/wijmo.input';
import { DataStore } from './dataentry.service';
import { PcdrFilterPipe } from '../pipes/pcdrfilter.pipe';
import { BreakPointRegistry } from '@angular/flex-layout';

// Global functions to make easy writing apps
@Injectable()
export class appHelperService {

    constructor(private CompanySvc: CompanyService, private tstr: ToastrService, private sharedSrvc: SharedService) {}

    // sharedSrvc
    getUsername(): string {
        return this.sharedSrvc.user.fname;
    }
    
    getUserLocation(): number {
        return this.sharedSrvc.user.flocation;
    }

    toastr(message:string, type:string = 'info', title:string = '',  bottom:boolean = false) {
        let pos = 'toast-bottom-full-width';

        switch(type) {
            case 'error':
                if (bottom)
                    this.tstr.error(message, title, {positionClass: pos, progressBar: true, progressAnimation: 'increasing'});
                else
                    this.tstr.error(message, title);
                break;
            case 'success':
                if (bottom)
                    this.tstr.success(message, title, {positionClass: pos, progressBar: true, progressAnimation: 'increasing'});
                else
                    this.tstr.success(message, title);
                break;
            case 'warning':
                if (bottom)
                    this.tstr.warning(message, title, {positionClass: pos, progressBar: true, progressAnimation: 'increasing'});
                else
                    this.tstr.warning(message, title);
                break;
            case 'warning':
                if (bottom)
                    this.tstr.warning(message, title, {positionClass: pos, progressBar: true, progressAnimation: 'increasing'});
                else
                    this.tstr.warning(message, title);
                break;
            default:
                if (bottom)
                    this.tstr.info(message, title, {positionClass: pos, progressBar: true, progressAnimation: 'increasing'});
                else
                    this.tstr.info(message, title);
                break;
        }
    }

    // 
    getStringToNumberOrEmpty(val: string) {
        if (!val) return '';
        return val.replace(/[^0-9\.-]/g, ''); //Remove non-numeric, period or minus char
    }

    ofHourGlass(value: boolean) {
        this.CompanySvc.ofHourGlass(value);
    }
    
    rawdatestrTruncatetz(val: string) {
        //2020-08-27T02:27:13.1187737-05:00
        let pattern = /(\d{4})\-(\d{2})\-(\d{2})\T(\d{2})\:(\d{2})\:(\d{2})/;
        let matchVal = val.match(pattern);
        return matchVal[1] + '-' +  matchVal[2] + '-' + matchVal[3] + "T" + matchVal[4] + ":" + matchVal[5] + ":" + matchVal[6];
    }

    datestrFromrawdate(val: string, option: number = 1) {
        var months = [ "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December" ];
        
        //2020-08-27T02:27:13.1187737-05:00
        let pattern = /(\d{4})\-(\d{2})\-(\d{2})\T(\d{2})\:(\d{2})\:(\d{2})/;
        let matchVal = val.match(pattern);
        let hour = (parseInt(matchVal[4]) > 12? parseInt(matchVal[4]) - 12: parseInt(matchVal[4]));
        let ampm = (parseInt(matchVal[4]) > 12? 'PM': 'AM');
        let monthName = months[parseInt(matchVal[2]) - 1];

        switch (option) {
            case 1:
                return monthName + ' ' + parseInt(matchVal[3]) + ', ' +  matchVal[1] + ', ' + hour + ":" + matchVal[5] + " " + ampm;
            case 2:
                return matchVal[1] + '-' +  matchVal[2] + '-' + matchVal[3] + "T" + matchVal[4] + ":" + matchVal[5] + ":" + matchVal[6];

        }
    }
}