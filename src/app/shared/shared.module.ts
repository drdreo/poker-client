import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TippyModule } from '@ngneat/helipopper';
import { ToggleComponent } from './toggle/toggle.component';
import { TooltipComponent } from './tooltip/tooltip.component';
import { TooltipDirective } from './tooltip/tooltip.directive';


@NgModule({
    declarations: [
        TooltipDirective,
        TooltipComponent,
        ToggleComponent
    ],
    imports: [
        CommonModule,
        TippyModule
    ],
    exports: [
        TooltipDirective,
        ToggleComponent,
        TippyModule
    ]
})
export class SharedModule {}
