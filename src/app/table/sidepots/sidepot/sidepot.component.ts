import { Component, OnInit, Input } from '@angular/core';
import {  SidePot } from '@shared/src';

@Component({
  selector: 'poker-sidepot',
  templateUrl: './sidepot.component.html',
  styleUrls: ['./sidepot.component.scss']
})
export class SidepotComponent implements OnInit {

  @Input() pot: SidePot;

  constructor() { }

  ngOnInit(): void {
  }

}
