import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import {  SidePot } from '@shared/src';

@Component({
  selector: 'poker-sidepot',
  templateUrl: './sidepot.component.html',
  styleUrls: ['./sidepot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidepotComponent implements OnInit {

  @Input() pot: SidePot;

  constructor() { }

  ngOnInit(): void {
  }

}
