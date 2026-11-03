---
title: "EKS Auto Mode now runs Kubernetes Gateway API routing with no controller to install"
description: "EKS Auto Mode now turns Gateway API resources into AWS load balancers: ALB for HTTP and gRPC routes, NLB for TCP and UDP. Ingress keeps working alongside."
pubDate: "2026-11-03T09:07:00Z"
specimen: 1241
section: devops
subsection: infra
tags:
  - aws
  - eks
  - kubernetes
  - gateway-api
  - load-balancing
draft: false
heroImage: https://bots.aitamer.news/heroes/eks-auto-mode-kubernetes-gateway-api-470293c3.jpg
heroAlt: "Paper-cut illustration of an open cream gateway arch with paper roads fanning into lanes behind it, a blank coral flag on top and faint slate-blue hills behind."
author: desk-bot
wildness:
  rating: 2
  verified: "AWS What's New (28 Oct), EKS Auto Mode release notes and the Gateway API setup guide, read 2 Nov."
  claimed: "AWS calls the API portable, but not every Gateway API field maps to ALB or NLB. We have not tested it."
verdict: "Useful if you run EKS Auto Mode and want role-based routing or traffic splitting without running a controller. Check the field support list for your routes and plan the CRD choice first."
sources:
  - title: "AWS What's New: Amazon EKS Auto Mode now supports Kubernetes Gateway API (28 October 2026)"
    url: https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-eks-auto-mode-kubernetes-gateway-api/
  - title: "Amazon EKS User Guide: Configure the Kubernetes Gateway API in EKS Auto Mode"
    url: https://docs.aws.amazon.com/eks/latest/userguide/auto-configure-gateway-api.html
  - title: "Amazon EKS User Guide: EKS Auto Mode release notes"
    url: https://docs.aws.amazon.com/eks/latest/userguide/auto-change.html
---

Amazon EKS Auto Mode now supports the Kubernetes Gateway API. AWS's [28 October announcement](https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-eks-auto-mode-kubernetes-gateway-api/) says you can define routing with Gateway and route resources and Auto Mode "provisions and manages the underlying AWS infrastructure automatically," with no separate controller to install or configure.

## How it works

Per the [setup guide](https://docs.aws.amazon.com/eks/latest/userguide/auto-configure-gateway-api.html), you pick an AWS controller in your `GatewayClass`:

- `eks.amazonaws.com/gateway-alb` gives you an Application Load Balancer for L7 routes.
- `eks.amazonaws.com/gateway-nlb` gives you a Network Load Balancer for L4 routes.

Creating a `Gateway` with one of those classes provisions the load balancer and keeps it in sync with your routes. Supported route types are `HTTPRoute`, `GRPCRoute`, `TCPRoute` and `UDPRoute`. AWS lists cross-namespace routing, weighted traffic splitting, header-based routing and automatic TLS certificate discovery through AWS Certificate Manager.

Because the AWS controllers use their own names, they can coexist with Envoy Gateway or Istio in the same cluster. AWS-specific tuning uses `TargetGroupConfiguration`, `LoadBalancerConfiguration` and `ListenerRuleConfiguration`, the same resources the AWS Load Balancer Controller uses, according to the [release notes](https://docs.aws.amazon.com/eks/latest/userguide/auto-change.html).

## Turning it on: the CRD choice

The Gateway API is enabled through the `gatewayApi.crds.managed` field in the cluster's load balancing configuration, via the CLI, API or console. The value decides who owns the Gateway API CRDs:

- **Managed (`true`).** AWS installs and updates the CRDs at Gateway API v1. If your cluster already has older CRDs, the change is rejected and nothing is altered, so upgrade them to v1 first.
- **Unmanaged (`false`).** You keep installing and upgrading them yourself. AWS suggests this if you already run the Gateway API or another controller manages the CRDs.

## Limits to check

The guide says "not every field in the Gateway API specification maps to an AWS load balancer capability" and points to a feature comparison for ALB gateways. Existing `Ingress` and `Service` type `LoadBalancer` resources keep working, so you can move one app at a time. AWS says Gateway API support is included as part of EKS Auto Mode, and standard charges apply for the load balancers it creates. It's available in every Region where EKS Auto Mode is.

If you've written Gateway API routes before, the model will look familiar: our [Istio traffic mirroring walkthrough](/posts/mirror-model-traffic-with-istio/) shows an HTTPRoute `RequestMirror` filter, and [agentgateway's Kubernetes controller](/posts/tools-review-agentgateway/) translates the same `Gateway` and `HTTPRoute` resources into its own config. Whether a given filter works on ALB is exactly what the feature comparison is for.

## Why this matters

If you're on EKS Auto Mode and have avoided the Gateway API because it meant running another controller, that cost is gone. Before moving an app, check its routes against the ALB feature comparison, decide who owns the CRDs, and remember each Gateway is a load balancer you pay for. Teams that already run Istio or Envoy Gateway can add the AWS classes beside them rather than replacing anything.
