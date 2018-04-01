import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiModule } from '../../api/api.module';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pannel',
  templateUrl: './pannel.component.html',
  styleUrls: ['./pannel.component.css']
})

export class PannelComponent implements OnInit {
  user:string;
  private apiModule:ApiModule;
  @ViewChild('signin') private linkin:ElementRef;
  @ViewChild('signout') private linkout:ElementRef;
  constructor(public router: Router) { }

  ngOnInit() {
    var ain:HTMLLinkElement = this.linkin.nativeElement;
    var aout:HTMLLinkElement = this.linkout.nativeElement;
    this.apiModule = new ApiModule();
    this.user = this.apiModule.getCurrentUser();
    if (this.user == "" || this.user == null) {
      ain.style.display = "flex";
      ain.innerHTML = `Sign In`;
      aout.style.display = "none";
      aout.innerHTML = ``;  
    } 
    else {
      ain.style.display = "none";
      ain.innerHTML =``;
      aout.style.display = "flex";
      aout.innerHTML=`Sign Out`;
    }
  }
  signOut() {
    var user = this.user;
    var api = this.apiModule;
    var check = true;
    var lob = this.apiModule.getLobby();
    if (lob) { // Make sure player leaves all associated games before signing out.
      check = false;
      if (lob.host == this.user) {
        this.apiModule.removeGame(lob._id, function(err){
          if (err) console.log("Failed to remove game\n" + err);
          api.killLobby();
        });
      }
      else {
        this.apiModule.leaveGame(lob._id, function(err) {
          if (err) console.log("Failed to leave game\n" + err);
          api.killLobby();
        }); 
      }
    }
    setTimeout(() => {
      if (check){
        var rtr = this.router;
        this.apiModule.signout(function(err, res){
          if (err) console.log(err);
          else {
            user = api.getCurrentUser();
            rtr.navigate(['/']);
            window.location.reload()
          }
        });
      } else console.log("Could not sign out.")
    }, 1000);
    
  }
}
