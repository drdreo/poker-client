import {
    Directive, HostListener, ComponentRef, ComponentFactoryResolver, ComponentFactory, OnDestroy, ViewContainerRef, Input, ElementRef
} from '@angular/core';
import { TooltipComponent } from './tooltip.component';

@Directive({
    selector: '[tooltip]'
})
export class TooltipDirective implements OnDestroy {

    @Input() tooltip: string;

    private componentRef: ComponentRef<TooltipComponent>;
    private position: any;

    constructor(private el: ElementRef, private viewContainerRef: ViewContainerRef, private resolver: ComponentFactoryResolver) {}

    ngOnDestroy() {
        this.componentRef?.destroy();
    }

    createComponent() {
        this.viewContainerRef.clear();
        const factory: ComponentFactory<TooltipComponent> = this.resolver.resolveComponentFactory<TooltipComponent>(TooltipComponent);
        this.componentRef = this.viewContainerRef.createComponent(factory);
        this.position = this.el.nativeElement.getBoundingClientRect();
    }

    @HostListener('mouseenter')
    show() {
        this.createComponent();
        this.componentRef.instance.text = this.tooltip;

        setTimeout(() => {
            const tooltipRect = this.componentRef.location.nativeElement.getBoundingClientRect();
            let xPos = ((this.position.x + (this.position.width / 2)) - (tooltipRect.width / 2));
            xPos = xPos <= 10 ? 10 : xPos;
            xPos = xPos + tooltipRect.width >= screen.width ? xPos - tooltipRect.width : xPos;

            this.componentRef.location.nativeElement.style.top = 10 + this.position.height + this.position.y + 'px';
            this.componentRef.location.nativeElement.style.left = xPos + 'px';
            this.componentRef.location.nativeElement.style.opacity = 1;
        }, 50);

    }

    @HostListener('mouseout')
    hide() {
        this.componentRef.destroy();
    }
}
