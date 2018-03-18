import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messages:string[];
  myPeerId:string;
  peer;
  public disabled:boolean = false;
  btnDisplay:string;
  textelem:HTMLTextAreaElement;

  constructor() { }
  @ViewChild('textarea') public textarea:ElementRef;
  @ViewChild('peer') public peerId:ElementRef;

  ngOnInit() {
    this.btnDisplay = "flex";

    this.textelem = this.textarea.nativeElement;
    this.textelem.disabled = this.disabled;
    this.messages = [];
    this.myPeerId = "";
    this.peer = new Peer({key: 'lwjd5qra8257b9'}); //Register our own...!!!
    this.peer.on('open', function(id){
      console.log(id);
    });
    setTimeout(() => {
      this.myPeerId = this.peer.id;
    },3000);
    var messages:string[] = this.messages;
    this.peer.on('connection', function(connection) {
      connection.on('data', function(data){
        messages.push(data);
      });
    });
    this.timeOut();
  }
  submitMessage() {
    var text = this.textarea.nativeElement.value;
    var me = this.myPeerId;
    this.messages.push(me + ": " + text);
    this.textarea.nativeElement.value = "";
    var conn = this.peer.connect(this.peerId.nativeElement.value);
    conn.on('open', function(){
      conn.send(me + ": " + text);
    });
  }
  timeOut(){
    setTimeout(() => {
      this.update();
      this.timeOut();
    }, 1000);
  }
  update(){
    this.textelem.disabled = this.disabled;
    if (this.textelem.disabled) this.btnDisplay = "none";
    else this.btnDisplay = "flex";
    var message = this.messages.pop();
    this.messages.push(message);
  }
  
}
