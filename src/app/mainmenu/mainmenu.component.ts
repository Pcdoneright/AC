import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { appHelperService } from '../services/appHelper.service';
import { SharedService } from '../services/shared.service';
import { CustomModule } from '../appcustom.module';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';
import { trigger, transition, query, style, animate, group, state } from '@angular/animations';
// declare var $: any;

@Component({
	selector: 'main-menu',
	templateUrl: './mainmenu.component.html',
    styleUrls: ['./mainmenu.component.css'],
    animations: [
        trigger('fade', [
            transition(':enter', [
                style({transform: 'translateX(-100%)'}),
                animate('0.3s ease-out')
            ]),
            transition(':leave', [
                animate('0.3s ease-out'), style({transform: 'translateX(-100%)'})
            ])
        ]),
        trigger('tabActive', [
            transition('false => true', [
                style({transform: 'translateX(100%)'}),
                animate('0.3s ease-out')
            ]),
            transition('true => false', [
                animate('0.3s ease-out'), style({transform: 'translateX(-100%)'})
            ])
        ])
    ],
    // animations: [
    //     trigger('slider', [
    //       transition(":increment", group([
    //         query(':enter', [
    //           style({
    //             left: '100%'
    //           }),
    //           animate('0.5s ease-out', style('*'))
    //         ], {optional: true}),
    //         query(':leave',  [
    //           animate('0.5s ease-out', style({
    //             left: '-100%'
    //           }))
    //         ], {optional: true})
    //       ])),
    //       transition(":decrement", group([
    //         query(':enter', [
    //           style({
    //             left: '-100%'
    //           }),
    //           animate('0.5s ease-out', style('*'))
    //         ], {optional: true}),
    //         query(':leave', [
    //           animate('0.5s ease-out', style({
    //             left: '100%'
    //           }))
    //         ], {optional: true})
    //       ])),
    //     ])
    //   ],
    encapsulation: ViewEncapsulation.None
})
export class MainMenuComponent implements OnInit {
    // public sideNavClassToggled: boolean = false;
    public sideNavClassToggled: boolean = true;
    fname: string;
    menus = [];
    menuCurrentIndex:number = -1;
    tabs = [];
    //currentTabTitle:string;
    selectedIndex:number = 0; // Tabs
    // serverDate: Date;
    serverDate: string;

    // private _images: string[] = ['https://via.placeholder.com/400x400?text=Hello',
    // 'https://via.placeholder.com/400x400?text=Angular',
    // 'https://via.placeholder.com/400x400?text=Animations'
    // ];

//   get images() {
//     return [this._images[this.selectedIndexA]];
//   }

//   previous() {
//     this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
//   }

//   next() {
//     this.selectedIndex = Math.min(this.selectedIndex + 1, this.tabs.length - 1);
//     // this.selectedIndexA = Math.min(this.selectedIndexA + 1, this._images.length - 1);
//   }

    constructor(private customModule: CustomModule, public sharedSrvc: SharedService, private DataSvc: DataService, private router: Router, public appH: appHelperService) {
        this.currentTime();
        setInterval(() => {this.currentTime();}, 60000);

        // Return to login if invalid (refresh from mainmenu)
        if (!this.sharedSrvc.user) {
            this.router.navigateByUrl('/login');
        }
    }

    currentTime() {
        this.DataSvc.serverDataGet('api/EmployeeMaint/GetServerDate').subscribe((dataResponse) => {
            // this.serverDate = new Date(dataResponse);
            this.serverDate = this.appH.rawdatestrTruncatetz(dataResponse);
        });
    };

	ngOnInit() {
        this.sharedSrvc.registerMenu(this); // Registers pointer
        this.fname = this.sharedSrvc.user['fname'];
        this.createMenu(this.sharedSrvc.menu);
    }

    onSideNavToggle() {
        this.sideNavClassToggled = !this.sideNavClassToggled;
        // setTimeout(()=> $(window).trigger('resize'), 100); // Trigger event registered on the components in tabs TODO: find a way to work without Jquery
    }

    // Implementation of new tabs
    showTab(tab) {
        return (tab == this.selectedIndex);
    }

    addTab(submenu) {
        this.onSideNavToggle() // Close Side Menu after selection

        // Route to stand-alone screen
        if (submenu.fwindow) {
            console.log('submenu', submenu);
            this.router.navigateByUrl('/' + submenu.fwindow);
            return; // Does not get this far
        }

        // If found select it
        for (var j = 0; j < this.tabs.length; j++) {
            if (submenu.id == this.tabs[j].id) {
                //this.currentTabTitle = submenu.prog;
                this.selectedIndex = j; // Bring tab to front
                return;
            }
        }
        // console.log('stil addTab');

        this.tabs.push({title: submenu.prog, content: submenu.path, id:submenu.id, active: true});
                this.selectedIndex = this.tabs.length - 1;
    }

    ofGetComponent(cName: string) {
        return this.customModule.ofGetComponent(cName);
    }

    removeTab(tab) {
        for (var j = 0; j < this.tabs.length; j++) {
            if (tab.title == this.tabs[j].title) {
                // if (this.tabs[j].hasOwnProperty('controller')) {
                //     this.tabs[j]['controller'].unload(); // call unload function
                // }
                this.tabs.splice(j, 1);
                this.selectedIndex--;
                //this.currentTabTitle = (j > 0)? this.tabs[j-1].title: ''; // Refresh title
                break;
            }
        }
    }

    createMenu(pMenu) {
        var mMmindex = 0;
        var mPrevGroup = '';

        for (var i in pMenu) {
            // Create group
            if (mPrevGroup !== pMenu[i].groupname) {
                mMmindex++; // Increment when new group
                this.menus.push({"groupname": pMenu[i].groupname, "index": mMmindex, "submenu": []});
            }
            // Create sub group
            this.menus[mMmindex - 1].submenu.push({
                path: 'app/' + pMenu[i].fwindow + '/' + pMenu[i].id + '.html',
                index: mMmindex,
                prog: pMenu[i].text,
                id: pMenu[i].id,
                fadmin: pMenu[i].fadmin,
                fupdate: pMenu[i].fupdate,
                fwindow: pMenu[i].fwindow
            });
            mPrevGroup = pMenu[i].groupname;
        }
        //console.log(this.menus);
    }

    // Expand Menu
    toggleSelectSection(section) {
        if (this.menuCurrentIndex == section) section = -1; // Disable All if active
        this.menuCurrentIndex = section;
    }

    isSectionSelected(index) {
        return (this.menuCurrentIndex === index);
    }
}