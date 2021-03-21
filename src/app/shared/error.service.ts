import { HttpErrorResponse, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, BehaviorSubject, Subject, throwError } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ErrorService {

    private _socketConnectionError$ = new BehaviorSubject(null);
    socketConnectionError$ = this._socketConnectionError$.asObservable();

    private _httpError$ = new BehaviorSubject(null);
    httpError$ = this._httpError$.asObservable();

    private unsubscribe$ = new Subject();

    constructor(private socket: Socket) {

        this.connectionEstablished()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this._socketConnectionError$.next(null);
            });

        this.connectionError()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(error => {
                console.error('Socket Connection Error: ', error);
                this._socketConnectionError$.next(error);
            });
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error) => {
                this._httpError$.next(error);
                return throwError(error);
            })
        );
    }

    private connectionEstablished(): Observable<any> {
        return this.socket.fromEvent('connect');
    }

    private connectionError(): Observable<any> {
        return this.socket.fromEvent('connect_error');
    }

    handleHTTPError(err: HttpErrorResponse) {
        let errorMessage: string;
        if (err.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            errorMessage = `An error occurred: ${ err.error.message }`;
        } else {
            // The backend returned an unsuccessful response code.
            errorMessage = 'Something went wrong!';
        }
        console.error(errorMessage);
    }
}
