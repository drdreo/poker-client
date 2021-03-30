import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TooltipComponent } from './tooltip/tooltip.component';
import { TooltipDirective } from './tooltip/tooltip.directive';
import { ToggleComponent } from './toggle/toggle.component';


@NgModule({
    declarations: [
        TooltipDirective,
        TooltipComponent,
        ToggleComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        TooltipDirective,
        ToggleComponent
    ]
})
export class SharedModule {}
