import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
import { HttpErrorInterceptor } from './http-error.interceptor';

@NgModule({
    declarations: [],
    imports: [CommonModule],
    providers: [
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpErrorInterceptor,
            multi: true
        }
    ]
})
export class ErrorHandlerModule {}
