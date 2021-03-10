import { ExecutionContext, Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { ContextType, HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { Scope } from '@sentry/hub';
import { Handlers } from '@sentry/node';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SentryInterceptor implements NestInterceptor {

    constructor(@InjectSentry() private readonly client: SentryService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // first param would be for events, second is for errors
        return next.handle().pipe(
            tap(null, (exception) => {
                if (this.shouldReport(exception)) {
                    this.client.instance().withScope((scope) => {
                        switch (context.getType<ContextType>()) {
                            case 'http':
                                return this.captureHttpException(
                                    scope,
                                    context.switchToHttp(),
                                    exception
                                );
                            case 'rpc':
                                return this.captureRpcException(
                                    scope,
                                    context.switchToRpc(),
                                    exception
                                );
                            case 'ws':
                                return this.captureWsException(
                                    scope,
                                    context.switchToWs(),
                                    exception
                                );
                        }
                    });
                }
            })
        );
    }

    private captureHttpException(scope: Scope, http: HttpArgumentsHost, exception: any): void {
        const data = Handlers.parseRequest(<any>{}, http.getRequest(), {});

        scope.setExtra('req', data.request);

        if (data.extra) scope.setExtras(data.extra);
        if (data.user) scope.setUser(data.user);

        this.client.instance().captureException(exception);
    }

    private captureRpcException(
        scope: Scope,
        rpc: RpcArgumentsHost,
        exception: any
    ): void {
        scope.setExtra('rpc_data', rpc.getData());

        this.client.instance().captureException(exception);
    }

    private captureWsException(
        scope: Scope,
        ws: WsArgumentsHost,
        exception: any
    ): void {
        const {id, playerID, table } = ws.getClient();
        scope.setExtra('ws_client', {id, playerID, table });
        scope.setExtra('ws_data', ws.getData());

        this.client.instance().captureException(exception);
    }

    private shouldReport(exception: any) {
        return true;
    }
}
