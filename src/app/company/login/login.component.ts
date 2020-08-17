import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import * as wjcCore from '@grapecity/wijmo';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
	userid: string;
	password: string;
	//model = {userid:'test', password:'123'};

	constructor(private router: Router, private toastr: ToastrService, protected DataSvc: DataService, public sharedSrvc: SharedService) {
		// Wijmo License
        wjcCore.setLicenseKey("104.254.244.129,934896988983683#B0jUzHMpNnTNN4TQJ6TZdnWylWZwgnd5x4MJ5Wclh6QvE7cFtkVNl6SDVzatxGcSdVUQpHT7YDeoRkULVWap3EVOlUawlXaG5mMZx6d4AjQkl7dsNWT4cXRsNGOWNXVQZ7Q9YmWD5meNN7VIpWQNtWawE7QwgVclZFVWV7brEjYqZTQz3yUFplSup6K7MHTXJ7TDpUaWVzQwFlR59WdxEVaTJ6VrgXZshWY8ZnMWZVM73WQKhWczMURWtUY9VkVCV5MSlzQKJ6ZFFTR5I5Qa9Ecmd6NGp6QZNUe5MlUmN7KXtScQtWRo5Wdw26VTd6YEZmQiVVSw2kI0IyUiwiI4YDNDFUQDdjI0ICSiwiN7IjNzQzN8cTM0IicfJye&Qf35VfiMzQwIkI0IyQiwiIlJ7bDBybtpWaXJiOi8kI1tlOiQmcQJCLiITM6ADMxAiMxgDMwIDMyIiOiQncDJCLikjMx8CN4IjL4UjMuQDMxIiOiMXbEJCLi46bj9CdodWayVmbvR6YwBkbpJXYsFmYiojIh94QiwiIzgjNzgTO8gTO6kDO4MTOiojIklkIs4nIyYHMyAjMiojIyVmdiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdrwEVrlEZ8AzUUxWQEVVa6AVdQhEZWxEd4IjYwFlcxVGdvhjWSV5VxsSbDhncChle5FVbjJ6LFZUbNpXZWN5bvJURFJHZLRXeXRFUq9mW6YlZ9cnRvA7RlVUSSBDLVAE");
	 }

	ngOnInit() {
		this.DataSvc.serverDataGet('api/Company/GetCompanyName').subscribe((data) => {
			this.sharedSrvc.companyName = data;
			this.sharedSrvc.ofHourGlass(false);
		});
	}

	onSubmit() {
		// console.log('submit');
		// console.log(this.model.userid);
        if (!this.userid || !this.password) {
            this.toastr.warning('User ID and Password must be provided.');
            return;
        }

		this.sharedSrvc.ofHourGlass(true);
		this.DataSvc.serverDataGet('api/Login/GetLogin', {
            userid: this.userid,
            pswd: this.password
        }).subscribe((dataResponse) => {
			if (dataResponse.success) {
                this.sharedSrvc.menu = dataResponse.data;
				this.sharedSrvc.user = dataResponse.user;
				this.router.navigateByUrl('/mainmenu');
            }
            else
                this.toastr.error('Invalid User ID or Password.');
			
			this.sharedSrvc.ofHourGlass(false);
		});
	}

}
