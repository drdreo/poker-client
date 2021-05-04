import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { UserService } from '../core/user.service';

@Injectable()
export class AdminGuard implements CanActivate {

    constructor(private router: Router, private userService: UserService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
        if (this.userService.isLoggedIn && this.userService.user.name === 'Dr Dreo') {
            return true;
        }

        return this.router.parseUrl('/');
    }
}
