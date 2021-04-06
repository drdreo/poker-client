import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, ErrorHandler, Injector, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import * as Sentry from '@sentry/angular';
import { BehaviorSubject } from 'rxjs';

// NOT USED, SENTRY for now
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    private _httpError$ = new BehaviorSubject(null);
    httpError$ = this._httpError$.asObservable();

    constructor(private zone: NgZone, private router: Router, private injector: Injector) {}

    handleError(error: Error) {
        const toastService = this.injector.get(HotToastService);

        if (error instanceof HttpErrorResponse) {
            // Server or connection error happened
            if (!navigator.onLine) {
                // Handle offline error
            } else {
                // Handle Http Error (error.status === 403, 404...)
            }
        } else {
            // Handle Client Error (Angular Error, ReferenceError...)

            // TODO: listen to status codes
            if (error.message === 'Not allowed to spectate!') {
                this.zone.run(() => {
                    toastService.error(error.message, { id: 'error' });
                    this.router.navigate(['']);
                });
            }
        }
        const extractedError = extractError(error) || 'Handled unknown error';
        console.error(extractedError);
        Sentry.captureException(extractedError);
    }

    handleHTTPError(error: Error) {
        console.error('HTTP Error from global error handler', error);
        this._httpError$.next(error);
    }
}


/**
 * Used to pull a desired value that will be used to capture an event out of the raw value captured by ErrorHandler.
 */
function extractError(errorCandidate: unknown): unknown {
    let error = errorCandidate;

    // Try to unwrap zone.js error.
    // https://github.com/angular/angular/blob/master/packages/core/src/util/errors.ts
    if (error && (error as { ngOriginalError: Error }).ngOriginalError) {
        error = (error as { ngOriginalError: Error }).ngOriginalError;
    }

    // We can handle messages and Error objects directly.
    if (typeof error === 'string' || error instanceof Error) {
        return error;
    }

    // If it's http module error, extract as much information from it as we can.
    if (error instanceof HttpErrorResponse) {
        // The `error` property of http exception can be either an `Error` object, which we can use directly...
        if (error.error instanceof Error) {
            return error.error;
        }

        // ... or an`ErrorEvent`, which can provide us with the message but no stack...
        if (error.error instanceof ErrorEvent && error.error.message) {
            return error.error.message;
        }

        // ...or the request body itself, which we can use as a message instead.
        if (typeof error.error === 'string') {
            return `Server returned code ${ error.status } with body "${ error.error }"`;
        }

        // If we don't have any detailed information, fallback to the request message itself.
        return error.message;
    }

    // Nothing was extracted, fallback to default error message.
    return null;
}
