import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GoogleLoginProvider, SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { UserService } from '../core/user.service';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AdminGuard } from './admin.guard';
import { LoginComponent } from './login/login.component';


const googleLoginOptions = {
    scope: 'profile email'
};

@NgModule({
    declarations: [AdminComponent, LoginComponent],
    imports: [
        CommonModule,
        AdminRoutingModule,
        SocialLoginModule
    ],
    providers: [
        AdminGuard,
        UserService,
        {
            provide: 'SocialAuthServiceConfig',
            useValue: {
                autoLogin: false,
                providers: [
                    {
                        id: GoogleLoginProvider.PROVIDER_ID,
                        provider: new GoogleLoginProvider(
                            '392028294003-ntpib63ockqc8cgut9om4f7ot0h2ba1e.apps.googleusercontent.com',
                            googleLoginOptions
                        )
                    }
                ]
            } as SocialAuthServiceConfig
        }
    ]
})
export class AdminModule {}
