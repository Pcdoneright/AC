import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators'
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';

@Component({
	selector: 'crdrawersmaint',
	templateUrl: './crdrawersmaint.html',
	providers: [DataEntryService],
})
export class crdrawersmaint implements OnDestroy, AfterViewInit {
	@ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
	@ViewChild('cdmGrid01', {static: true}) cdmGrid01: WjFlexGrid;
    @ViewChild('cdmGrid02', {static: true}) cdmGrid02: WjFlexGrid;
	wH: number;
    crdrawers: DataStore;
    crdeposits: DataStore;
    sodatef:Date = new Date();
    totalDrawer:number = 0;
    totalDeposit:number = 0;

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, 
		public wjH: wjHelperService, public $filter: PcdrFilterPipe ) {
	
		this.sharedSrvc.setProgramRights(this, 'crdrawersmaint'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
		this.onResize(null); // Execute at start
		
		this.crdrawers = this.dESrvc.newDataStore('crdrawers', ['fuserid', 'fdate'], true, ['fdrawer']);
		this.crdeposits = this.dESrvc.newDataStore('crdeposits', ['fuserid', 'fts'], true, []);
		this.dESrvc.validateDataStore('crdrawers', 'DRAWER', 'fdrawer', 'DRAWER AMOUINT');
    }
    
    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Cash Drawer', 
            buttons: [
                {name: 'Save', style: 'primary', action: 'update'},
                {name: ' Refresh', style: 'success', icon: 'fa fa-sync', action: 'refresh'}
            ],
            rows: {grid: 'cdmGrid01'}, 
        })

        this.bar02.setNavProperties(this, {
            title: 'Deposits', 
            rows: {grid: 'cdmGrid02'}, 
            subnavbar: false
        })
    }

	ngAfterViewInit() {
		this.initGrids();
		this.wjH.fixWM();	
		
		this.refresh()
    }

	ngOnDestroy() {
    }
    
    // barXX Events
    onClickNav(parm) {
        this[parm.action](parm.val);
    }

    getTotal() {
        this.totalDrawer = 0;
        this.totalDeposit = 0;

        this.crdeposits.items.forEach(row => {
            this.totalDeposit += row.ftotal;
        });
        
        this.crdrawers.items.forEach(row => {
            this.totalDrawer += row.fdrawer;
        });

        this.totalDrawer = this.CompanySvc.r2d(this.totalDrawer);
        this.totalDeposit = this.CompanySvc.r2d(this.totalDeposit);
    }

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
		this.dESrvc.update('api/CashRegister/Postupdate')
			.pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
			.subscribe();
    }

    refresh() {
        this.dESrvc.pendingChangesContinue().then(() => {
            this.CompanySvc.ofHourGlass(true);
            
            let datef = new Date(this.sodatef);
            datef.setHours(12, 0, 0);
            let datet = new Date(this.sodatef);
            datet.setHours(23, 59, 59);
        
            this.DataSvc.serverDataGet('api/CashRegister/GetCrDrawers', {pdatef: datef, pdatet: datet}).subscribe((dataResponse) => {
                this.crdrawers.loadData(dataResponse.crdrawers);
                this.crdeposits.loadData(dataResponse.crdeposits);
                this.wjH.gridLoad(this.cdmGrid01, this.crdrawers.items);
                this.wjH.gridLoad(this.cdmGrid02, []);

                this.getTotal();
                this.CompanySvc.ofHourGlass(false);
            });
        }).catch(()=>{});
    }

	crdrawersFilter(pfuserid) :any[] {
		return this.$filter.transform(this.crdeposits.items, { fuserid: pfuserid }, true);
	}

	gridRepaint() {
        setTimeout(() => {
			this.wjH.gridRedraw(this.cdmGrid01);
			this.wjH.gridRedraw(this.cdmGrid02);
		}, 100);
    }

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.wH = window.innerHeight - 50;
		}, 100);
	};

	initGrids() {
		// wj-flex-grid
        this.cdmGrid01.initialize({
			selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.cdmGrid01, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.cdmGrid01);
					if (!row) return;
					setTimeout(() => { // Allow cellEditEnding from cdmGrid02 to finish
						this.wjH.gridLoad(this.cdmGrid02, this.crdrawersFilter(row.fuserid)); // Load filtered rows
					}, 50);
                }
            },
            columns: [
				{ binding: "cfuser", header: "User", width: 250, isReadOnly: true },
				{ binding: "fdate", header: "Date", width: 150, format:'MM/dd/yyyy', isReadOnly: true },
				{ binding: "fdrawer", header: "Amount", width: 150, format: 'c' }
            ]
        });
		this.wjH.gridInit(this.cdmGrid01);
		
		// wj-flex-grid
        this.cdmGrid02.initialize({
            columns: [
				{ binding: "fts", header: "Time", width: 250, format:'MM/dd/yyyy H:mm tt', isReadOnly: true},
				{ binding: "ftotal", header: "Deposit", width: 250, format: 'c' },
            ]
        });
        this.wjH.gridInit(this.cdmGrid02);
	}
}