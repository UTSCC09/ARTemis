import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiModule } from '../../api/api.module';
import { Router } from '@angular/router';
@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.css']
})
export class HostComponent implements OnInit {
  @ViewChild('canvas1') public canvas1: ElementRef;
  @ViewChild('canvas2') public canvas2: ElementRef;
  running:boolean;
  game:any;
  players: any[];
  teams: string[][];

  resultD: string;

  private api:ApiModule;
  constructor(public router: Router) { }
  
  // Values for game start timer.
  timeText:string;
  timeVal:number;
  result1:string;
  result2:string;

  // Canvas Draw Variables
  private canvasElem: HTMLCanvasElement[];
  private ctx: CanvasRenderingContext2D[];
  private strokes: any[];
  results: string[][];
  // Peering
  public myPeerId: string[];
  public peer: any[];

  ngOnInit() {
    // Load API
    this.api = new ApiModule();

    // Declare Variables
    this.game = this.api.getLobby();
    this.resultD = "none";

    this.peer = [null, null];
    this.myPeerId = [null, null];
    this.canvasElem = [null, null];
    this.ctx = [null, null];
    this.strokes = [[], []];
    this.teams = [[], []];
    this.results = [];
    this.result1 = "";
    this.result2 = "";
  
    // Timer values.
    this.timeText = "Game Starts in:"
    this.timeVal = 5;

    // Set Flags
    this.running = true; // Flag for timeout loops. If we ever leave, we make sure this is set to false.


    // Player's display logic.
    var players = this.players;
    this.api.getPlayers(this.game._id, function(err, res){
      if (err) console.log(err);
      else players = res;
    });
    setTimeout(() => {
      if (players) {
        this.teams = [[], []];
        this.players = players;
        var i = 0;
        for (i = 0; i < this.players.length; i++) {
          this.teams[this.players[i].teamNum].push(this.players[i].user); // Distribution of team members.
        }
      }
    }, 500);

    // Generate both peerIds
    this.peer[0] = new Peer({host : "lightpeerjs.herokuapp.com",
                          secure : true,
                          path : "/peerjs",
                          port : 443,
                          debug: false});
    this.peer[1] = new Peer({host : "lightpeerjs.herokuapp.com",
                          secure : true,
                          path : "/peerjs",
                          port : 443,
                          debug: false});
    this.peer[0].on('open', function(id){
      console.log("Peer1 ID of Host: " + id);
    });
    this.peer[1].on('open', function(id){
      console.log("Peer2 ID of Host: " + id);
    });
    setTimeout(() => {
      this.myPeerId[0] = this.peer[0].id;
      this.myPeerId[1] = this.peer[1].id;
      this.api.updateHostInfo(this.game._id, this.myPeerId[0], this.myPeerId[1], function(err) {
        if (err) console.log(err);
        else console.log("peerIds sent");
      });
    },1000);
    // End off with initing the canvasi;
    this.canvasElem[0] = this.canvas1.nativeElement;
    this.canvasElem[1] = this.canvas2.nativeElement;

    this.initCanvas(0);
    this.initCanvas(1);
    
    // Start update loop and game start timer.
    this.timer();
    this.timeOut();
  }

  initCanvas(i) {
    this.ctx[i] = this.canvasElem[i].getContext('2d');
    this.ctx[i].lineJoin = "round";
    this.ctx[i].lineWidth = 10;

    // Open Listener for canvas
    var peerDraw:any[] = this.strokes;
    this.peer[i].on('connection', function(connection) {
      connection.on('data', function(data){
        while (data.length > 0) {
          var smtn = data.shift();
          peerDraw[i].push(smtn);
        }
      });
    });
    this.keepAlive(i);
  }

  timeOut() { // Update loop.
    setTimeout(() => {
      this.update(0);
      this.update(1);
      if (this.running) this.timeOut();
    }, 300);
  }

  update(i) {
    setTimeout(() => { // This is here to make the canvas's both update async rather than having it update one first.
      while (this.strokes[i].length > 0) {
        var smtn = this.strokes[i].shift();
        this.draw(i, smtn[0], smtn[1], smtn[2],smtn[3],smtn[4],smtn[5]);
      }
    }, 10);
  }

  draw(i, x, y, px, py, size, color) {
    this.ctx[i].beginPath();
    this.ctx[i].moveTo(px, py);
    this.ctx[i].lineTo(x, y);
    this.ctx[i].lineWidth = size;
    this.ctx[i].strokeStyle = color;
    this.ctx[i].closePath();
    this.ctx[i].stroke();
  }


  countDown(){
    var end:number = null;
    this.api.getGame(this.game._id, function(err, res){
      if (err) console.log(err);
      else end = res.endTime;
    });
    setTimeout(() => {
      this.timeText ="Time Left:";
      var curr = new Date().getTime();
      this.timeVal = Math.floor((end - curr) / 1000);
      if (this.timeVal <= 0) this.compareImages();
      else {
        this.timeVal = this.timeVal - 1;
        this.countDown();
      }
    }, 1000);
  }

  compareImages(){
    var result:string [][] = this.results;
    var imgData1 = this.canvasElem[0].toDataURL();
    var imgData2 = this.canvasElem[1].toDataURL();
    imgData1 = imgData1.substring(imgData1.indexOf(',')+1);
    imgData2 = imgData2.substring(imgData2.indexOf(',')+1);
    this.api.findSimilarity(this.game._id, imgData1, function(err, res) {
      if (err) console.log(err);
      else result.push(["0", res]);
    });
    this.api.findSimilarity(this.game._id, imgData2, function(err, res) {
      if (err) console.log(err);
      else result.push(["1", res]);
    });
    this.wait()
  }

  wait() {
    if (!this.running) return; // Exit on not running. 
    var check = false;
    if (this.results.length >= 2) { // Got back results.
      var winner:string = null;
    
      if (parseFloat(this.results[0][1]) >= parseFloat(this.results[1][1])) winner = this.results[0][0]
      else winner = this.results[1][0]
      console.log("Winner is : " + winner);
      this.api.endGame(this.game._id, parseInt(winner), function(err, res) {
        if (err) console.log("Could not end game\n" + err);
        else {
          check = true;
        }
      });
    }
    setTimeout(() => { // Game starts, enable all child components, start countdown timer.
      if (check) {
        this.running = false;
        // Can appear in any order, so account for this to get the right results
        if (this.results[0][0] == "0") { 
          this.result1 = (parseFloat(this.results[0][1])*100).toString();
          this.result2 = (parseFloat(this.results[1][1])*100).toString();
        } else {
          this.result1 = (parseFloat(this.results[1][1])*100).toString();
          this.result2 = (parseFloat(this.results[0][1])*100).toString();
        }
        this.resultD = "flex"; // Show results.

        // Remove game.
        this.api.removeGame(this.game._id, function(err, res) {
          if (err) console.log("Could not remove game\n" + err);
        });
      }
      else this.wait();
    }, 1000);
  }

  leave() {
    this.exit('/');
  }

  timer() {
    if (!this.running) return; // Exit on not running. 
    setTimeout(() => { // Game starts, enable all child components, start countdown timer.
      if (this.timeVal == 0){
        this.timeText ="Game Begins!";
        this.countDown();
      } else { // Keep counting down.
        this.timeVal = this.timeVal - 1;
        this.timer();
      }
    }, 1000);
  }

  keepAlive(i){
    // Keep the peer alive as long as on page
    setTimeout(() => {
       // Connect to other peer and send message
       var conn = this.peer[i].socket.send({
				    type: 'ping'});
       if (this.running) this.keepAlive(i);
    }, 25000);
  }

  exit(route: string) {
    this.running = false;
    this.timeText ="Game Over!";
    this.timeVal = null;
    this.router.navigate([route]);
  }
}
