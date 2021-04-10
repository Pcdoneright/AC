import { Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PcdrFilterPipe} from '../pipes/pcdrfilter.pipe';
import {MainMenuComponent} from '../mainmenu/mainmenu.component';
import {CompanyVersion} from './companyversion';

@Injectable()
export class SharedService {
	public loaderStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public user: any;
	public companyName: string;
	// public companyVersion = 'V3.4.2';
	public companyVersion: string;
	menu = [];
	private mainmenu: MainMenuComponent;
	public animationDuration = '1500ms'; // tab=group

	constructor(private $filter: PcdrFilterPipe, private cpv: CompanyVersion) {
		this.companyVersion = cpv.companyVersion;
	 }

	ofHourGlass(pVal: boolean) {
		this.loaderStatus.next(pVal);
	}

	// Registers components and sets its security properties
    setProgramRights(pController: any, pName: string) {
	    let prog = this.$filter.transform(this.menu, {id: pName}, true)[0]; // get prog
	    pController.fadmin = prog.fadmin; // set properties
		pController.fupdate = prog.fupdate;
		prog.component = pController; // Register component
	}
	
	// Registers pointer of Mainmenu
	registerMenu(mm: MainMenuComponent) {
		this.mainmenu = mm;
	}

	openTask(pId) {
		let prog = this.$filter.transform(this.menu, {id: pId}, true); // get prog
		if (prog.length == 0 ) return null; // Not found within priviledges

		prog[0].title = prog[0].text; // Assign Value since menu uses different array
		prog[0].prog = prog[0].text; // Assign Value since menu uses different array
		this.mainmenu.addTab(prog[0]);
		return prog[0];
	}
}
