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
        wjcCore.setLicenseKey("104.254.244.129,216741937271653#B0hNYZisnOiwmbBJye0ICRiwiI34zZaNmTD5kSaRVTyUlMIlmTW9mNzI6MLd6ZidkT4NEOww6bOh5RDlWaNh7caRERi9kct9kar4WMBNzarcVMrN5UQVndyg6Yw9WYvR4bLFnV8gTbMV5dzlzUPtmYxkja7FXQ5dnNMRjUmJVVhdUQJpkest6VlR7S034c9UXU9c7TzY4Y5Q7c8EzMGlnYaxkNrFERpRmWJF5dRNmR5E6N9hnNB5GV9oUNX54QCtUSQ5WWql6ZFV6Q5pWYHdWZxRDOwBXOINXa6ZVSklUW4YTSSJ6Z7VVbTlDTzEnchJDNHpFNFpXaYBTRNB7dvkDaKlEUMl6Q9AjQNRDTZB5VON6ZnN7SykUSxU7VT9Ec5lXVwJnc82UTwUVcQpGUhJEe4cXeZZ4MYlURxgUeBJVT7gkTLRHbUJDR9ZWNyoFdTFGSSNXYmVUezk4N9Zna8EzNidFRS54KZZzRDBlI0IyUiwiI7MkQCBjQ8IjI0ICSiwSO4UjM8QjM4EjM0IicfJye35XX3JSSwIjUiojIDJCLi86bpNnblRHeFBCI4VWZoNFelxmRg2Wbql6ViojIOJyes4nI5kkTRJiOiMkIsIibvl6cuVGd8VEIgIXZ7VWaWRncvBXZSBybtpWaXJiOi8kI1xSfis4N8gkI0IyQiwiIu3Waz9WZ4hXRgAydvJVa4xWdNBybtpWaXJiOi8kI1xSfiQjR6QkI0IyQiwiIu3Waz9WZ4hXRgACUBx4TgAybtpWaXJiOi8kI1xSfiMzQwIkI0IyQiwiIlJ7bDBybtpWaXJiOi8kI1xSfiUFO7EkI0IyQiwiIu3Waz9WZ4hXRgACdyFGaDxWYpNmbh9WaGBybtpWaXJiOi8kI1tlOiQmcQJCLiYTMxQzMwASMygDMwIDMyIiOiQncDJCLikjMx8CN4IjL4UjMuQDMxIiOiMXbEJCLi46bj9CdodWayVmbvR6YwBkbpJXYsFmYiojIh94QiwiIzUjNxcjM7MTOxQzN6EjMiojIklkIs4nIyYHMyAjMiojIyVmdiwSZzxWYJpMI");
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
