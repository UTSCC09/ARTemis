import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiModule } from '../../api/api.module';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  @ViewChild('user') private user:ElementRef;
  @ViewChild('pass') private pass:ElementRef;
  apiModule:ApiModule;
  username:string;
  password:string;
  constructor() { }

  ngOnInit() {
    this.apiModule = new ApiModule();
  }
  SignIn(e) {
    this.username = this.user.nativeElement.value;
    this.password = this.pass.nativeElement.value;
    var apiModule = this.apiModule;
    console.log(e);
    e.preventDefault();
    console.log("Signing in with: " + this.username + " , " + this.password);

    this.apiModule.signin(this.username, this.password, function(err, res){
      if (err) console.log(err);
      else {
        console.log(res);
      }
    });
  }
}
