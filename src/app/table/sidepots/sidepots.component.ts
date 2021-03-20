import { Component, OnInit, Input } from '@angular/core';
import { SidePot } from '@shared/src';
import { sidePotSlideAnimation, fadeInSlideOutAnimation } from 'app/animations';
import { Observable } from 'rxjs';

@Component({
  selector: 'poker-sidepots',
  templateUrl: './sidepots.component.html',
  styleUrls: ['./sidepots.component.scss'],
  animations: [sidePotSlideAnimation, fadeInSlideOutAnimation]
})
export class SidepotsComponent implements OnInit {

  @Input() sidePots$: Observable<SidePot[]>;

  constructor() { }

  ngOnInit(): void {
  }

}
