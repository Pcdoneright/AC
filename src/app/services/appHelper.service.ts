import { Injectable } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { CompanyService } from '../services/company.service';
import { DataService } from '../services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { ItemList } from '../inventory/itemlist/itemlist.component';

import { Observable } from 'rxjs';
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

    constructor(private CompanySvc: CompanyService, private sharedSrvc: SharedService, 
        private DataSvc: DataService, public dialog: MatDialog) {}

    // sharedSrvc
    getUsername(): string {
        return this.sharedSrvc.user.fname;
    }
    
    getUserLocation(): number {
        return this.sharedSrvc.user.flocation;
    }

    toastr(message:string, type:string = 'info', title:string = '',  bottom:boolean = false, center:boolean = false) {
        this.DataSvc.toastr(message, type, title,  bottom, center);
    }

    // 
    getStringToNumberOrEmpty(val: string) {
        if (!val) return '';
        return val.replace(/[^0-9\.-]/g, ''); //Remove non-numeric, period or minus char
    }

    ofHourGlass(show: boolean = true) {
        this.CompanySvc.ofHourGlass(show);
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

    // Item Related
    async validateItem(fitem: string, showError = true) {
        const dataResponse = await this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: fitem}).toPromise();
        if (dataResponse.length == 0) {
            if (showError) this.toastr('Item ' + fitem + ' not found!','error', '', true);
            return null;
        }
        return dataResponse;
    }

    async lookupItem(fcustomerId = '-1') {
        let selected = await this.dialog.open(ItemList, {data: {fcid: fcustomerId}}).afterClosed().toPromise();
        if (!selected) return null;
        return selected;
    }
}