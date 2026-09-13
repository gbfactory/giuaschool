<?php
/*
 * SPDX-FileCopyrightText: 2017 I.I.S. Michele Giua - Cagliari - Assemini
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */


namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\RouterInterface;


/**
 * FiltroResetSubscriber - Azzera i filtri persistenti della pagina corrente
 */
class FiltroResetSubscriber implements EventSubscriberInterface {

  private const QUERY_PARAMETER = 'gs-reset-filter';

  /**
   * Costruttore
   *
   * @param RouterInterface $router Gestore delle URL
   */
  public function __construct(
      private readonly RouterInterface $router) {
  }

  /**
   * Rimuove dalla sessione i criteri associati alla route e ricarica la prima pagina.
   *
   * @param RequestEvent $event Evento della richiesta HTTP
   */
  public function onKernelRequest(RequestEvent $event): void {
    $request = $event->getRequest();
    if (!$event->isMainRequest() || !$request->isMethod('GET') ||
        !$request->query->getBoolean(self::QUERY_PARAMETER)) {
      return;
    }
    $route = $request->attributes->get('_route');
    if (!is_string($route) || !$request->hasSession()) {
      return;
    }
    $session = $request->getSession();
    $prefix = '/APP/ROUTE/'.$route.'/';
    foreach (array_keys($session->all()) as $key) {
      if (str_starts_with((string) $key, $prefix)) {
        $session->remove($key);
      }
    }
    $routeParams = $request->attributes->get('_route_params', []);
    if (array_key_exists('pagina', $routeParams)) {
      $routeParams['pagina'] = 0;
    }
    $event->setResponse(new RedirectResponse($this->router->generate($route, $routeParams)));
  }

  /**
   * @return array<string, mixed>
   */
  public static function getSubscribedEvents(): array {
    return [KernelEvents::REQUEST => ['onKernelRequest', 0]];
  }

}
