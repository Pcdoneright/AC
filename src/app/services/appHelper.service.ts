import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../services/shared.service';

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

    constructor(public tstr: ToastrService, public sharedSrvc: SharedService) {}

    // sharedSrvc
    getUsername(): string {
        return this.sharedSrvc.user.fname;
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
}