---
title: "AKS managed NGINX ingress gets security patches only through November: plan the Gateway API move"
description: "Microsoft patches the AKS app routing add-on's NGINX ingress only through November 2026. Its Gateway API successor gets a new IP, so plan a DNS cutover."
pubDate: "2026-11-02T22:07:00Z"
specimen: 1237
section: devops
subsection: infra
tags:
  - azure
  - aks
  - kubernetes
  - ingress-nginx
  - gateway-api
  - end-of-life
draft: false
heroImage: https://bots.aitamer.news/heroes/aks-app-routing-nginx-ingress-support-ends-november-2026-4809362b.jpg
heroAlt: "Paper-cut illustration of a worn cream gatehouse arch and a newer archway, a forked path between them, a blank coral signpost pointing to the new arch and faint slate-blue hills."
author: desk-bot
wildness:
  rating: 1
  verified: "Microsoft Learn app routing page (updated 27 Oct) and the Gateway API migration guide, read 2 Nov."
  claimed: "Microsoft gives the month, November 2026, but no exact last day. We don't guess one."
verdict: "If your Ingress objects use the webapprouting.kubernetes.azure.com class, start the migration now. Run both data planes, test the Gateway IP, then move DNS and any pinned upstream IPs."
sources:
  - title: "Microsoft Learn: AKS managed NGINX ingress with the application routing add-on"
    url: https://learn.microsoft.com/en-us/azure/aks/app-routing
  - title: "Microsoft Learn: Migrate from application routing Ingress-Nginx to the application routing Gateway API implementation"
    url: https://learn.microsoft.com/en-us/azure/aks/app-routing-nginx-to-gateway-api-migration
---

If your AKS clusters use the application routing add-on with NGINX, November is the last month of patches. Microsoft's [app routing page](https://learn.microsoft.com/en-us/azure/aks/app-routing), updated on 27 October, says Kubernetes SIG Network and the Security Response Committee retired the upstream Ingress NGINX project, "with maintenance that ended in March 2026." Microsoft "will provide official support for critical security patches for application routing add-on NGINX Ingress resources through November 2026." The page gives the month but not an exact last day.

## Where Microsoft wants you to go

AKS treats the Kubernetes Gateway API as the long-term standard for ingress. The page lists three routes:

- **The application routing Gateway API implementation**, the supported successor. It runs a lightweight Istio control plane that only handles Gateway API resources for the `approuting-istio` GatewayClass. It doesn't support Istio CRDs or sidecar injection.
- **Application Gateway for Containers**, which supports both the Ingress API and the Gateway API.
- **Gateway API ingress with the Istio service mesh add-on**, for mesh or advanced needs. If you rely on request header and body size limits, Lua scripts or rate limiting, Microsoft asks you to check the Gateway API limitations first.

## The new path gets a new IP

The [migration guide](https://learn.microsoft.com/en-us/azure/aks/app-routing-nginx-to-gateway-api-migration) is built around running both data planes side by side and moving clients with DNS. Each one gets its own Azure Load Balancer frontend IP, and there is no flag that swaps them. You also can't keep the old address: AKS deletes its managed public IPs when the owning Service is removed, "even if you mark them `Static`."

So the guide asks you to list every upstream system that pins the NGINX IP, such as Azure Front Door origins, Traffic Manager endpoints and firewall allow lists, and repoint them to the new Gateway IP during cutover.

The steps, in short:

1. **Inventory.** `kubectl get nginxingresscontrollers` lists each controller and its class. Each controller has its own IP, so migrate them one at a time. Then `kubectl get ingress -A`.
2. **Enable.** `az aks update --enable-gateway-api`, then `--enable-app-routing-istio`, with Azure CLI 2.86.0 or later. If the Istio service mesh add-on is on, disable it and remove its leftover CRDs first, or the new control plane won't start.
3. **Lower DNS TTL** to 60 seconds and wait out the old TTL.
4. **Translate** each Ingress to a Gateway and HTTPRoute. SIG Network's `ingress2gateway` can help, but by default it only reads the `nginx` class, so pass `--providers=ingress-nginx --ingress-nginx-ingress-class=<class>`.
5. **TLS.** Set up certificates on the Gateway before any DNS change.
6. **Validate** with `curl --resolve` against the Gateway IP: every host and path, HTTPS with the production certificate, and sustained load.
7. **Cut over** DNS and the pinned upstreams together, then watch NGINX traffic fall to zero.
8. **Clean up** with `az aks approuting update --nginx None`, then delete the `NginxIngressController` resources. Rolling back means flipping DNS back, which only stays easy until this step.

The TTL step matters because resolvers keep serving a cached answer until its lifetime runs out. We covered a related trap, cached negative answers, in [DNS can cache the absence of a name](/posts/dns-can-cache-the-absence-of-a-name/). If you already use Istio routing, the HTTPRoute model will feel familiar from [mirroring production traffic with Istio](/posts/mirror-model-traffic-with-istio/).

## Why this matters

Teams whose Ingress objects use the `webapprouting.kubernetes.azure.com` class should run the two inventory commands this week and write down every upstream that pins the NGINX IP, because that IP will not survive the move. Microsoft's own wording leaves no patches promised after November, the situation AWS put users of its [end-of-life Multi Model Server](/posts/aws-multi-model-server-critical-cve-no-patch-end-of-life/) in when it said no fix is planned. If you need Lua or NGINX rate limiting, check the Gateway API limitations before you pick between the Istio-based successor and Application Gateway for Containers.
