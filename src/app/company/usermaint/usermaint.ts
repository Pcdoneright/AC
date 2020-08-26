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
import * as wjGrid from "@grapecity/wijmo.grid";

@Component({
	selector: 'usermaint',
	templateUrl: './usermaint.html',
	providers: [DataEntryService],
})
export class usermaint implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
	@ViewChild('usersGrid01', {static: true}) usersGrid01: WjFlexGrid;
	wH: number;
    users: DataStore;
    companylocations: any[];
    usergroups: any[];

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, 
		public wjH: wjHelperService, public $filter: PcdrFilterPipe ) {
	
		this.sharedSrvc.setProgramRights(this, 'usermaint'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
		this.onResize(null); // Execute at start
		
		this.users = this.dESrvc.newDataStore('users', [], true, ['FNAME', 'FPASSWORD','ffirst', 'flast', 'FGROUPID', 'flocation']);
        this.dESrvc.validateDataStore('users', 'PROPERTIES', 'FNAME', 'ID');
        this.dESrvc.validateDataStore('users', 'PROPERTIES', 'FPASSWORD', 'FPASSWORD');
        this.dESrvc.validateDataStore('users', 'PROPERTIES', 'ffirst', 'FIRST NAME');
        this.dESrvc.validateDataStore('users', 'PROPERTIES', 'flast', 'LAST NAME');
        this.dESrvc.validateDataStore('users', 'PROPERTIES', 'FGROUPID', 'ACCESS GROUP');
        this.dESrvc.validateDataStore('users', 'PROPERTIES', 'flocation', 'LOCATION');
    }
    
    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: "User's Properties", 
            buttons: [
                {name: 'Save', style: 'success', action: 'update'},
                {name: ' Add', style: 'primary', icon: 'fa fa-plus-circle', action: 'userAdd'},
            ],
            subnavbar: false,
            rows: {grid: 'usersGrid01'}
        })
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action](parm.val);
    }

	ngAfterViewInit() {
		this.initGrids();
        this.wjH.fixWM();
        
        this.DataSvc.serverDataGet('api/UserMaint/Getlist').subscribe((dataResponse) => {
			this.users.loadData(dataResponse);
			this.wjH.gridLoad(this.usersGrid01, this.users.items);
		});
        
        // User Groups
		this.DataSvc.serverDataGet('api/UserMaint/GetGroups').subscribe((dataResponse) => {
            this.usergroups = dataResponse;
            this.usersGrid01.columns[5].dataMap = new wjGrid.DataMap(this.usergroups, 'fgroupid', 'fname');
        });
        
        // Get Company Locations for DropDown
        this.DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
            // Combobox
            this.usersGrid01.columns[6].dataMap = new wjGrid.DataMap(this.companylocations, 'fcmplid', 'fname');
        });
        
	}

	ngOnDestroy() {
	}

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
		this.dESrvc.update('api/userMaint/Postupdate')
			.pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
			.subscribe();
    }

	userAdd() {
        this.users.addRow({
            FUSERID: this.dESrvc.getMaxValue(this.users.items, 'FUSERID') + 1,
            FACTIVE: 'Y',
            fisadmin: false
        });
        this.wjH.gridLoad(this.usersGrid01, this.users.items); 
        this.wjH.gridScrollToLastRow(this.usersGrid01, 1);
	}

	gridRepaint() {
        setTimeout(() => {
			this.wjH.gridRedraw(this.usersGrid01);
		}, 100);
    }

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.wH = window.innerHeight - 105;
		}, 100);
	};

	initGrids() {
		// wj-flex-grid
        this.usersGrid01.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'FPASSWORD':
                            if (this.wjH.gridEditingCell(s, e)) break; // No editing happening
                            var row = s.rows[e.row].dataItem;
                            e.cell.textContent = '******';
                            break;
                    }
                }
            },
            columns: [
				{ binding: "FACTIVE", header: "Active", width: 80, dataMap: ['Y','N'] },
                { binding: "FNAME", header: "ID", width: 150 },
                { binding: "ffirst", header: "First Name", width: 200 },
                { binding: "flast", header: "Last Name", width: 200 },
                { binding: "FPASSWORD", header: "Password", width: 150 },
                // { binding: "fisadmin", header: "Admin", width: 80 },
				{ binding: "FGROUPID", header: "Access Group", width: 250 },
				{ binding: "flocation", header: "Location", width: '*' }
            ]
        });
		this.wjH.gridInit(this.usersGrid01);
	}
}