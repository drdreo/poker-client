import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TippyModule } from '@ngneat/helipopper';
import { PlayingIndicatorComponent } from '../table/player/playing-indicator/playing-indicator.component';
import { ToggleComponent } from './toggle/toggle.component';
import { TooltipComponent } from './tooltip/tooltip.component';
import { TooltipDirective } from './tooltip/tooltip.directive';
import { IconComponent } from './icon/icon.component';
import { ConnectionErrorComponent } from './connection-error/connection-error.component';


@NgModule({
    declarations: [
        TooltipDirective,
        TooltipComponent,
        ToggleComponent,
        IconComponent,
        ConnectionErrorComponent,
        PlayingIndicatorComponent
    ],
    imports: [
        CommonModule,
        TippyModule
    ],
    exports: [
        TooltipDirective,
        ToggleComponent,
        TippyModule,
        IconComponent,
        PlayingIndicatorComponent
    ]
})
export class SharedModule {}
