import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CompanyService } from '../services/company.service';

//--------------------------------
// SINGLE INSTANCE
//--------------------------------
@Injectable()
export class CompanyRulesService {
    
    constructor(private datePipe: DatePipe, private CompanySvc: CompanyService) {
        // console.log('CompanyRulesService -> constructor()');
    }

    // Calculate hours for 1 row
    hoursCalculate(row) {
        if (!row || !row.punchout) return;

        let a:any = new Date(row.punchin);
        let b:any = new Date(row.punchout);
        var secs = (b - a) / 1000; // seconds after
        var li_Hours = 0, li_Mins = 0;

        // Compute Hours
        if (secs >= 3600) {
            // li_Hours = Int(secs / 3600);
            li_Hours = Math.trunc(secs / 3600);
            //secs = Mod(secs, 3600); // Remainder secs
            secs = secs % 3600; // Remainder secs
        }

        // Compute Minutes
        if (secs >= 60) {
            // li_Mins = Int(secs / 60);
            li_Mins = Math.trunc(secs / 60);
            //secs = Mod(secs, 60); // Why is this needed, anyway?
            secs = secs % 60; // Why is this needed, anyway?
        }

        row.totaltime = this.padL(li_Hours, 2) + ':' + this.padL(li_Mins, 2) + ':' + this.padL(secs, 2);
    }

    hoursCalculateRows(pRows) {
        // Compute Total Time
        let ftotaltime, fhr=0, fmin:any = 0, fsec=0;

        for (var i = 0; i < pRows.length; i++) {
            if (pRows[i].punchin) pRows[i].punchin = this.datePipe.transform(pRows[i].punchin, 'MM/dd/yyyy HH:mm:ss');
            if (pRows[i].punchout) pRows[i].punchout = this.datePipe.transform(pRows[i].punchout, 'MM/dd/yyyy HH:mm:ss');
            if (pRows[i].totaltime) {
                fhr += parseInt(pRows[i].totaltime.substr(0, 2));
                fmin += parseInt(pRows[i].totaltime.substr(3, 2));
                fsec += parseInt(pRows[i].totaltime.substr(6, 2));
            }
        }
        fsec = (fhr * 3600) + (fmin * 60) + fsec;
        fhr = Math.floor(fsec / 3600);
        fmin = Math.floor((fsec - (fhr * 3600)) / 60);
        fsec = fsec - (fhr * 3600) - (fmin * 60);

        if (fmin < 10) {fmin = "0"+fmin;}
        //ftotaltime = fhr +':'+ fmin;

        return {totalstring:fhr +':'+ fmin, total:parseFloat(fhr +'.'+ fmin)}; // return object, string and numeric
    }

    markupCalculate(fsaleprice, funits, fsalesbase):number {
        let val = 0;
        if (funits > 0 && fsaleprice > 0)  {
            val = ((fsaleprice / funits) - fsalesbase) / (fsaleprice / funits);
            val = this.CompanySvc.r2d(val * 100);
        }
        return val;
    }

    salepriceCalculate(fmarkup, funits, fsalesbase):number {
        let val = 0;
        if (fsalesbase > 0) {
            val = (fsalesbase / (1 - (fmarkup / 100))) * funits;
            val = this.CompanySvc.r2d(val);
        }
        
        return val;
    }

    private padL(nr, n) {
        return Array(n - String(nr).length + 1).join('0') + nr;
    }
}