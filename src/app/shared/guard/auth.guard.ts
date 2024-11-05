import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { loginPath } from '../app.routes';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser().pipe(
    map(user => {
      if (!user) router.navigate([`/${loginPath}`], state.url !== '/' ? { queryParams: { returnUrl: state.url } } : {});
      return !!user;
    })
  );
};
