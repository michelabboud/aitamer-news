---
title: "Kubernetes from Zero, part 19: Ingress and Gateway API basics"
description: "Route HTTP into a kind cluster by host, path and header: an Ingress with its controller, then the same routes as a Gateway API HTTPRoute."
pubDate: "2026-11-30T22:00:00Z"
specimen: 1560
series: k8s-from-zero
series_order: 19
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - ingress
  - gateway-api
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-19-ingress-and-gateway-basics-d78cf617.jpg
heroAlt: "A torn-paper harbour seen from above, where a small navy pilot boat with a yellow lamp waits inside the narrow harbour mouth and three ivory paper boats follow separate blue channels to three rust-red docks, with a dusty-blue ship's wheel in the upper left."
author: desk-bot
lessonKit:
  id: k8s-19
wildness:
  rating: 1
  verified: "Ingress and HTTPRoute via Traefik v3.7.17, Gateway API v1.6.3, kind v0.33.0, node v1.37.0, 10 Nov 2026"
  claimed: "Ingress NGINX retirement date and Gateway API role model come from kubernetes.io and gateway-api docs"
verdict: "An Ingress or HTTPRoute is only a rule; a controller makes it real. New work should start on Gateway API, where the Gateway owner decides which namespaces may attach routes."
sources:
  - title: "Ingress (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/ingress/
  - title: "Ingress Controllers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/
  - title: "Gateway API (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/gateway/
  - title: "Ingress NGINX Retirement (Kubernetes blog)"
    url: https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
  - title: "Kubernetes v1.36 sneak peek (Kubernetes blog)"
    url: https://kubernetes.io/blog/2026/03/30/kubernetes-v1-36-sneak-peek/
  - title: "Gateway API specification 1.6"
    url: https://gateway-api.sigs.k8s.io/reference/api-spec/1.6/spec/
  - title: "Gateway API security model"
    url: https://gateway-api.sigs.k8s.io/concepts/security-model/
  - title: "kubernetes/ingress-nginx (GitHub)"
    url: https://github.com/kubernetes/ingress-nginx
  - title: "gateway-api v1.5.0 (GitHub release)"
    url: https://github.com/kubernetes-sigs/gateway-api/releases/tag/v1.5.0
  - title: "Traefik v3.7 Kubernetes Gateway provider"
    url: https://doc.traefik.io/traefik/v3.7/reference/install-configuration/providers/kubernetes/kubernetes-gateway/
  - title: "Traefik v3.7 Kubernetes Ingress provider"
    url: https://doc.traefik.io/traefik/v3.7/reference/install-configuration/providers/kubernetes/kubernetes-ingress/
  - title: "kubectl reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
---

This part follows [part 18](https://aitamer.news/posts/k8s-from-zero-18-taints-priority-and-disruption/). So far your apps are reachable only from inside the cluster or through `kubectl port-forward`. This part brings HTTP traffic in from outside and sends each request to the right Service by host name, path and header. You will write an Ingress, see that it does nothing until a controller runs, install one, and then express the same routes with Gateway API, the newer API that the Kubernetes project now recommends. You need the kind cluster from part 3 and the `k8s-from-zero` namespace from part 4. We tested every step on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2, Gateway API v1.6.3 and Traefik v3.7.17.

## What you will build

Three small web apps sit behind ClusterIP Services (the in-cluster Service type from [part 8](https://aitamer.news/posts/k8s-from-zero-08-services/)): `web`, `api` and `web-beta`. In front of them runs one controller Pod, Traefik, in its own namespace. Requests for the host `shop.example.test` go to `api` when the path starts with `/api`, to `web-beta` when they carry the header `x-version: beta`, and to `web` otherwise. Traffic that enters the cluster from outside like this is often called north-south traffic; traffic between Services inside the cluster is east-west.

![A request from outside reaches an entry point, then the Service and Pod of the Traefik controller, which watches Ingress and HTTPRoute rules in the API server and sends the request to the web or api Pods.](/diagrams/k8s-from-zero-19-ingress-and-gateway-basics/north-south-traffic-path.svg)

On kind the entry point is `kubectl port-forward`. In a cloud it is usually a Service of type `LoadBalancer` in front of the controller. Everything after the entry point is the same.

## An Ingress is a rule, and a controller makes it real

An [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) is an API object that describes HTTP routing: a list of rules, each with an optional host and a list of paths, each path pointing to a Service and port. Kubernetes stores the object, but nothing in a standard cluster acts on it. The docs put it plainly: you must have an Ingress controller, and only creating an Ingress resource has no effect ([Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)). The controller is an ordinary Deployment that watches Ingress objects through the API server and configures a proxy from them.

Three fields matter for a first Ingress:

- `ingressClassName` names an IngressClass object, and the IngressClass names the controller that should handle it (`spec.controller`). A controller ignores Ingresses whose class points to another controller.
- `pathType` is required. `Exact` matches the path exactly; `Prefix` matches by path elements split on `/`, so `/api` matches `/api` and `/api/orders` but not `/apiary`; `ImplementationSpecific` leaves it to the controller.
- `backend.service` names the Service and the port number.

Anything beyond hosts, paths and TLS, such as header matching, rewrites or timeouts, lives in controller-specific annotations. The same annotation means different things to different controllers, or nothing at all.

Two facts shape what you should build today. First, the Ingress API is frozen: it stays generally available and the project has no plans to remove it, but it will get no further changes, and the Kubernetes project recommends Gateway instead of Ingress ([Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)). Second, Ingress NGINX, the controller many tutorials still install, is retired. SIG Network and the Security Response Committee announced the retirement in November 2025 and retired the project on 24 March 2026; since then it gets no releases, bug fixes or security updates, although existing installs keep working ([announcement](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/), [v1.36 sneak peek](https://kubernetes.io/blog/2026/03/30/kubernetes-v1-36-sneak-peek/)). Its [GitHub repository](https://github.com/kubernetes/ingress-nginx) is archived. To check whether a cluster runs it, the announcement suggests this command, which returned nothing on our lab cluster:

```bash rail=get-ingress-nginx-pods
kubectl get pods --all-namespaces --selector app.kubernetes.io/name=ingress-nginx
```

```text
No resources found
```

The [Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/) page lists many maintained alternatives. This lab uses [Traefik](https://doc.traefik.io/traefik/v3.7/reference/install-configuration/providers/kubernetes/kubernetes-ingress/) (MIT licence) for one practical reason: a single Traefik Pod can serve both Ingress and Gateway API, so you can compare the two APIs on the same proxy. It is one option among many; a later episode compares controllers.

## Gateway API splits the job into three objects

[Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/) is a family of API kinds for traffic routing and for provisioning the infrastructure that carries it. It is an add-on: its kinds are CustomResourceDefinitions (CRDs, extra object types you install into the API server) published by the Gateway API project, not built into Kubernetes. Instead of one object, it splits routing into three kinds, each owned by a different role ([security model](https://gateway-api.sigs.k8s.io/concepts/security-model/)):

- **GatewayClass**, owned by the infrastructure provider: names the controller (`controllerName`) that implements Gateways of this class. Cluster-scoped.
- **Gateway**, owned by the cluster operator: one running entry point with listeners (protocol, port, optional host name and TLS). Its `allowedRoutes` field decides which namespaces may attach routes to each listener.
- **HTTPRoute**, owned by application developers: lives in the app's namespace, attaches to a Gateway through `parentRefs`, and lists rules with matches (path, headers, query parameters, method) and `backendRefs`.

![Ingress keeps class, hosts, paths, TLS and annotations in one object for one team; Gateway API splits them into GatewayClass, Gateway and HTTPRoute for three roles, with the Gateway's allowedRoutes deciding which routes may attach.](/diagrams/k8s-from-zero-19-ingress-and-gateway-basics/ingress-vs-gateway-api-roles.svg)

The split matters most when several teams share one entry point. With Ingress, every team edits its own Ingress but all of them configure the same proxy, and the only controls are annotations and RBAC (part 20 covers RBAC). With Gateway API, the operator owns the Gateway and its listeners, and a route only goes live if the listener allows the route's namespace. The default for `allowedRoutes` is `from: Same`, so out of the box only routes in the Gateway's own namespace can attach ([API spec v1.6](https://gateway-api.sigs.k8s.io/reference/api-spec/1.6/spec/)).

Two release details. Gateway API ships on its own schedule: we used v1.6.3 because the Traefik v3.7 documentation says it supports that version ([Traefik v3.7 Gateway provider](https://doc.traefik.io/traefik/v3.7/reference/install-configuration/providers/kubernetes/kubernetes-gateway/)). Newer releases of both projects have come out since we tested; the commands stay pinned to the versions above so your output matches ours. Since v1.5 the install file also contains a ValidatingAdmissionPolicy named `safe-upgrades.gateway.networking.k8s.io` that blocks installing Experimental CRDs over Standard ones and downgrading below v1.5 ([v1.5.0 release notes](https://github.com/kubernetes-sigs/gateway-api/releases/tag/v1.5.0)).

## HTTPRoute matching picks the most specific rule

An HTTPRoute rule matches when every condition in one of its `matches` entries is true: a path prefix and a header in the same entry must both match. When several rules across the routes on a listener match a request, the specification fixes the winner. Precedence goes to an `Exact` path match, then the longest `Prefix` path, then a method match, then the most header matches, then the most query parameter matches. Remaining ties go to the oldest route, then to the route name in alphabetical order, then to the first matching rule in the list ([API spec v1.6](https://gateway-api.sigs.k8s.io/reference/api-spec/1.6/spec/)).

![Five requests against the three rules of the HTTPRoute shop: / goes to web, /api/ to api, / with x-version beta to web-beta, /api/ with x-version beta to api because the longer path prefix beats the header match, and another host gets 404.](/diagrams/k8s-from-zero-19-ingress-and-gateway-basics/httproute-matching.svg)

The same section of the specification fixes two error codes you will see in the lab. If no rule matches, the response is 404. If a rule's backend is invalid, for example a Service port that does not exist, requests for that rule get 500.

## Try it: route one host three ways

1. Start the three apps. Each Pod runs busybox `httpd` and serves one line of text at `/` and at `/api/`. Save this as `apps.yaml`; the three apps differ only in name and message:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: web
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web
    spec:
      containers:
        - name: httpd
          image: busybox:1.37
          # writes one page at / and one at /api/, then serves both on port 8080
          command: ["sh", "-c", "mkdir -p /www/api && echo 'hello from web' > /www/index.html && cp /www/index.html /www/api/ && exec httpd -f -p 8080 -h /www"]
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  selector:
    app.kubernetes.io/name: web
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: k8s-from-zero
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: api
    spec:
      containers:
        - name: httpd
          image: busybox:1.37
          # writes one page at / and one at /api/, then serves both on port 8080
          command: ["sh", "-c", "mkdir -p /www/api && echo 'hello from api' > /www/index.html && cp /www/index.html /www/api/ && exec httpd -f -p 8080 -h /www"]
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: k8s-from-zero
spec:
  selector:
    app.kubernetes.io/name: api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-beta
  namespace: k8s-from-zero
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: web-beta
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web-beta
    spec:
      containers:
        - name: httpd
          image: busybox:1.37
          # writes one page at / and one at /api/, then serves both on port 8080
          command: ["sh", "-c", "mkdir -p /www/api && echo 'hello from web-beta' > /www/index.html && cp /www/index.html /www/api/ && exec httpd -f -p 8080 -h /www"]
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: web-beta
  namespace: k8s-from-zero
spec:
  selector:
    app.kubernetes.io/name: web-beta
  ports:
    - port: 80
      targetPort: 8080
```

```bash rail=apply-apps
kubectl apply -f apps.yaml
kubectl rollout status deployment/web deployment/api deployment/web-beta -n k8s-from-zero --timeout=90s
```

```text
deployment.apps/web created
service/web created
deployment.apps/api created
service/api created
deployment.apps/web-beta created
service/web-beta created
...
deployment "web-beta" successfully rolled out
```

2. Write the Ingress before any controller exists. Save this as `ingress.yaml`. It also defines the IngressClass `traefik`:

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: k8s-from-zero
spec:
  ingressClassName: traefik
  rules:
    - host: shop.example.test
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

```bash rail=apply-ingress
kubectl apply -f ingress.yaml
kubectl get ingress -n k8s-from-zero
```

```text
ingressclass.networking.k8s.io/traefik created
ingress.networking.k8s.io/shop created
NAME   CLASS     HOSTS               ADDRESS   PORTS   AGE
shop   traefik   shop.example.test             80      5s
```

The object is stored and valid, and nothing serves it yet. That is the point of the previous section.

3. Install the Gateway API CRDs, then the controller. Traefik's documentation lists the CRDs as the first requirement for its Gateway provider. Server-side apply avoids the annotation size limit that the Gateway API release notes warn about for the larger Experimental CRDs:

```bash rail=apply-gateway-api-crds
kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.3/standard-install.yaml
```

```text
customresourcedefinition.apiextensions.k8s.io/backendtlspolicies.gateway.networking.k8s.io serverside-applied
customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io serverside-applied
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io serverside-applied
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io serverside-applied
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io serverside-applied
...
validatingadmissionpolicy.admissionregistration.k8s.io/safe-upgrades.gateway.networking.k8s.io serverside-applied
validatingadmissionpolicybinding.admissionregistration.k8s.io/safe-upgrades.gateway.networking.k8s.io serverside-applied
```

Traefik is usually installed with its Helm chart. Here you install it from plain YAML so you can see every piece: a ServiceAccount, a ClusterRole that lets it read Services, EndpointSlices, Ingresses and Gateway API objects and update their status, a Deployment, and a ClusterIP Service. The ClusterRole is trimmed from Traefik's published RBAC files; part 20 explains every field. Save this as `traefik.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: traefik
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik
  namespace: traefik
---
# What the controller may read and update (part 20 explains RBAC)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: traefik
rules:
  - apiGroups: [""]
    resources: ["namespaces", "services", "secrets", "nodes", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["discovery.k8s.io"]
    resources: ["endpointslices"]
    verbs: ["list", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses", "ingressclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses/status"]
    verbs: ["update"]
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["gatewayclasses", "gateways", "httproutes", "grpcroutes", "tlsroutes", "referencegrants", "backendtlspolicies"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["gatewayclasses/status", "gateways/status", "httproutes/status", "grpcroutes/status", "tlsroutes/status", "referencegrants/status", "backendtlspolicies/status"]
    verbs: ["update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: traefik
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: traefik
subjects:
  - kind: ServiceAccount
    name: traefik
    namespace: traefik
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traefik
  namespace: traefik
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: traefik
  template:
    metadata:
      labels:
        app.kubernetes.io/name: traefik
    spec:
      serviceAccountName: traefik
      containers:
        - name: traefik
          image: traefik:v3.7.17
          args:
            - --entryPoints.web.address=:8000
            - --providers.kubernetesingress
            - --providers.kubernetesgateway
            - --ping
          ports:
            - name: web
              containerPort: 8000
          readinessProbe:
            httpGet:
              path: /ping
              port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: traefik
  namespace: traefik
spec:
  selector:
    app.kubernetes.io/name: traefik
  ports:
    - name: web
      port: 80
      targetPort: web
```

The entry point `web` listens on port 8000 inside the Pod. `--ping` turns on a health endpoint at `/ping` on Traefik's own port 8080, which the readiness probe uses.

```bash rail=apply-traefik
kubectl apply -f traefik.yaml
kubectl rollout status deployment/traefik -n traefik --timeout=120s
kubectl get pods -n traefik
```

```text
namespace/traefik created
serviceaccount/traefik created
clusterrole.rbac.authorization.k8s.io/traefik created
clusterrolebinding.rbac.authorization.k8s.io/traefik created
deployment.apps/traefik created
service/traefik created
...
deployment "traefik" successfully rolled out
NAME                      READY   STATUS    RESTARTS   AGE
traefik-d5b567bdb-k2nmh   1/1     Running   0          2s
```

4. Test the Ingress. Start a client Pod with curl in it (save as `client.yaml`), then send requests to the Traefik Service with a `Host` header. You do not need real DNS for `shop.example.test`: the proxy reads the header.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: k8s-from-zero
spec:
  containers:
    - name: curl
      image: curlimages/curl:8.23.0
      command: ["sleep", "3600"]
```

```bash rail=apply-client
kubectl apply -f client.yaml
kubectl wait --for=condition=Ready pod/client -n k8s-from-zero --timeout=60s
kubectl exec -n k8s-from-zero client -- curl -s -H "Host: shop.example.test" http://traefik.traefik/
kubectl exec -n k8s-from-zero client -- curl -s -H "Host: shop.example.test" http://traefik.traefik/api/
kubectl exec -n k8s-from-zero client -- curl -s -o /dev/null -w "%{http_code}\n" -H "Host: other.example.test" http://traefik.traefik/
```

```text
hello from web
hello from api
404
```

`traefik.traefik` is the Service `traefik` in the namespace `traefik`. Now from your own machine, through port-forward. Leave the first command running in its own terminal:

```bash rail=port-forward-traefik
kubectl port-forward -n traefik svc/traefik 8080:80
```

```bash rail=curl-shop-api
curl -s -H "Host: shop.example.test" http://localhost:8080/api/
```

```text
hello from api
```

The `ADDRESS` column of the Ingress stays empty on kind. Traefik only writes an address there when you configure where to copy it from, such as a LoadBalancer Service, and a plain kind cluster has no load balancer.

5. Move the same routes to Gateway API. Save the class and the Gateway as `gateway.yaml`. The listener port is 8000 because Traefik requires Gateway listener ports to match its entry point ports. `allowedRoutes` lets routes from every namespace attach:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: traefik
spec:
  controllerName: traefik.io/gateway-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: shared
  namespace: traefik
spec:
  gatewayClassName: traefik
  listeners:
    - name: http
      protocol: HTTP
      port: 8000
      allowedRoutes:
        namespaces:
          from: All
```

```bash rail=apply-gateway
kubectl apply -f gateway.yaml
kubectl get gatewayclass
kubectl get gateway -n traefik
```

```text
gatewayclass.gateway.networking.k8s.io/traefik created
gateway.gateway.networking.k8s.io/shared created
NAME      CONTROLLER                      ACCEPTED   AGE
traefik   traefik.io/gateway-controller   True       4s
NAME     CLASS     ADDRESS   PROGRAMMED   AGE
shared   traefik             True         4s
```

`ACCEPTED True` means the controller took ownership of the class; `PROGRAMMED True` means it configured the listener. Now the application side. Save this as `route.yaml`; it is the Ingress from step 2 plus a header rule:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop
  namespace: k8s-from-zero
spec:
  parentRefs:
    - name: shared
      namespace: traefik
  hostnames:
    - shop.example.test
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /
          headers:
            - name: x-version
              value: beta
      backendRefs:
        - name: web-beta
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: web
          port: 80
```

Delete the Ingress first, so only one set of rules answers for the host, then apply the route and read its status:

```bash rail=delete-ingress-shop
kubectl delete ingress shop -n k8s-from-zero
kubectl apply -f route.yaml
kubectl get httproute shop -n k8s-from-zero -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}{"\n"}{end}'
```

```text
ingress.networking.k8s.io "shop" deleted from k8s-from-zero namespace
httproute.gateway.networking.k8s.io/shop created
Accepted=True Accepted
ResolvedRefs=True ResolvedRefs
```

`Accepted` says the Gateway let the route attach. `ResolvedRefs` says every backend exists. The Gateway counts it too:

```bash rail=get-gateway-listeners
kubectl get gateway shared -n traefik -o jsonpath='{range .status.listeners[*]}{.name}: attachedRoutes={.attachedRoutes}{"\n"}{end}'
```

```text
http: attachedRoutes=1
```

6. Send the five requests from the matching diagram through the port-forward:

```bash rail=curl-shop-root
curl -s -H "Host: shop.example.test" http://localhost:8080/
curl -s -H "Host: shop.example.test" http://localhost:8080/api/
curl -s -H "Host: shop.example.test" -H "x-version: beta" http://localhost:8080/
curl -s -H "Host: shop.example.test" -H "x-version: beta" http://localhost:8080/api/
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: other.example.test" http://localhost:8080/
```

```text
hello from web
hello from api
hello from web-beta
hello from api
404
```

The fourth line is the one to remember. The request carries the beta header, but `/api` is a longer path prefix than `/`, and path length is compared before headers, so `api` answers.

7. Clean up. Stop the port-forward with Ctrl+C, then:

```bash rail=delete-route-stack
kubectl delete -f route.yaml -f gateway.yaml -f client.yaml -f apps.yaml
kubectl delete -f traefik.yaml
kubectl delete ingressclass traefik
```

Keep the Gateway API CRDs if you want to continue experimenting; `kubectl delete -f` with the same release URL removes them.

## When it goes wrong

- **The Ingress exists but every request gets 404.** Check `kubectl get ingress`: the `CLASS` column must name an IngressClass whose controller is running. We created an Ingress `legacy` for the host `legacy.example.test` with `ingressClassName: nginx`, a class nobody serves. Traefik ignored it and returned 404. After `kubectl patch ingress legacy -n k8s-from-zero --type=merge -p '{"spec":{"ingressClassName":"traefik"}}'` the same request returned `hello from web` within a few seconds. Old manifests written for Ingress NGINX often carry `ingressClassName: nginx` or `nginx.ingress.kubernetes.io/*` annotations; both need attention when you change controllers.

- **The HTTPRoute is created but the host returns 404.** Read the route status. We removed `allowedRoutes` from the Gateway, which brings back the default `from: Same`, and the route in `k8s-from-zero` was refused:

```text
Accepted=False NotAllowedByListeners: 
ResolvedRefs=True ResolvedRefs: 
```

The fix belongs to whoever owns the Gateway: allow the namespace (`from: All`, or `from: Selector` with a namespace label selector). If the status has no entry for your Gateway at all, check `parentRefs`: without `namespace`, it points to a Gateway in the route's own namespace.

- **Some paths return 500 with an empty body.** A backend reference is broken. We changed the `api` backend port from 80 to 8080, the container port, instead of the Service port. The route stayed `Accepted`, but:

```text
ResolvedRefs=False BackendNotFound: Cannot load HTTPBackendRef k8s-from-zero/api: service port 8080 not found
```

and `/api/` returned 500 while `/` kept working. `backendRefs` and Ingress backends take the Service port, not the container port.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| List Ingresses and their class | `kubectl get ingress -A` | empty ADDRESS is normal on kind |
| List IngressClasses | `kubectl get ingressclass` | `spec.controller` names the controller |
| Pick a controller for an Ingress | `spec.ingressClassName: traefik` | other classes are ignored |
| Path matching in an Ingress | `pathType: Prefix` or `Exact` | required on every path |
| Check for Ingress NGINX | `kubectl get pods -A --selector app.kubernetes.io/name=ingress-nginx` | retired 24 March 2026 |
| Install Gateway API CRDs | `kubectl apply --server-side -f .../v1.6.3/standard-install.yaml` | match your controller's supported version |
| List Gateway API objects | `kubectl get gatewayclass,gateway,httproute -A` | GatewayClass is cluster-scoped |
| Who may attach routes | `listeners[].allowedRoutes.namespaces.from` | default `Same`; also `All`, `Selector` |
| Attach a route | `spec.parentRefs: [{name, namespace}]` | namespace defaults to the route's own |
| Route status | `kubectl get httproute NAME -o jsonpath='{.status.parents}'` | look for Accepted and ResolvedRefs |
| Match a header | `matches: [{headers: [{name, value}]}]` | same entry as the path means AND |
| Precedence | Exact > longest Prefix > method > headers > query | then oldest route |
| Test without DNS | `curl -H "Host: shop.example.test" http://localhost:8080/` | with `kubectl port-forward` |
| Backend port | `backendRefs[].port: 80` | the Service port, not the container port |

Minimal HTTPRoute:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop
  namespace: k8s-from-zero
spec:
  parentRefs:
    - name: shared
      namespace: traefik
  hostnames:
    - shop.example.test
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: web
          port: 80
```

## Recap and what is next

- An Ingress or an HTTPRoute is a stored rule. A controller Pod watches the rules and configures a proxy; without it nothing happens.
- The Ingress API is frozen and Ingress NGINX was retired on 24 March 2026. Check your clusters, and start new routing on Gateway API.
- Gateway API gives each role its own object: GatewayClass for the controller, Gateway for listeners and `allowedRoutes`, HTTPRoute for the app's matches and backends.
- Route status tells you why traffic does not flow: `Accepted=False` means the Gateway refused the route, `ResolvedRefs=False` means a backend is wrong.
- The most specific match wins, and a longer path prefix beats a header match.

Next: part 20, RBAC and ServiceAccounts, where the ClusterRole you just applied for Traefik gets explained line by line. Coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation®.

```rail
id: "get-ingress-nginx-pods"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "--all-namespaces"
        text: "List objects across every namespace. Short form -A."
      - token: "--selector"
        text: "A label query that filters the list. Same idea as -l."
      - token: "app.kubernetes.io/name=ingress-nginx"
        text: "The label query passed to --selector. Only objects whose labels match it are listed."
```

```rail
id: "apply-apps"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "apps.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of the rollout. By default it watches the latest rollout until it is done. You can pass --watch=false if you do not want to wait."
      - token: "deployment/web"
        text: "The resource written as type/name: deployment/web."
      - token: "deployment/api"
        text: "The resource written as type/name: deployment/api."
      - token: "deployment/web-beta"
        text: "The resource written as type/name: deployment/web-beta."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
```

```rail
id: "apply-ingress"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "ingress.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "ingress"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
```

```rail
id: "apply-gateway-api-crds"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "--server-side"
        text: "Run the apply on the API server instead of in kubectl (server-side apply). The apply reference says: if true, apply runs in the server instead of the client."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.3/standard-install.yaml"
        text: "The Gateway API standard-channel CRD manifest from the v1.6.3 release on GitHub. apply reads it straight from this URL."
```

```rail
id: "apply-traefik"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "traefik.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of the rollout. By default it watches the latest rollout until it is done. You can pass --watch=false if you do not want to wait."
      - token: "deployment/traefik"
        text: "The resource written as type/name: deployment/traefik."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "traefik"
        text: "The namespace name."
      - token: "--timeout=120s"
        text: "How long to wait before giving up. This command passes 120s."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "traefik"
        text: "The namespace name."
```

```rail
id: "apply-client"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "client.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=Ready"
        text: "The condition to wait for. Here kubectl waits until the condition named after --for is met."
      - token: "pod/client"
        text: "The resource written as type/name: pod/client."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
      - token: "client"
        text: "The object name."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "http://traefik.traefik/"
        text: "The URL the command requests."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
      - token: "client"
        text: "The object name."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "http://traefik.traefik/api/"
        text: "The URL the command requests."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
      - token: "client"
        text: "The object name."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-o"
        text: "Write the response body to the file that follows instead of standard output."
      - token: "/dev/null"
        text: "The null device. The body is thrown away, so only the -w output is printed."
      - token: "-w"
        text: "Write-out: after the transfer, curl prints the format string that follows."
      - token: "\"%{http_code}\\n\""
        text: "The -w format string: the HTTP status code of the response, then a newline."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: other.example.test\""
        text: "The Host header to send: other.example.test. No rule claims this host, so the proxy answers 404."
      - token: "http://traefik.traefik/"
        text: "The URL the command requests."
```

```rail
id: "port-forward-traefik"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "port-forward"
        text: "Forward one or more local ports to a pod, service or other resource. The port-forward docs say traffic to the local port is sent to the selected port on the resource."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "traefik"
        text: "The namespace name."
      - token: "svc/traefik"
        text: "The resource written as type/name: svc/traefik."
      - token: "8080:80"
        text: "LOCAL:REMOTE ports. Local port 8080 is forwarded to port 80 on the target."
```

```rail
id: "curl-shop-api"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "http://localhost:8080/api/"
        text: "The URL the command requests."
```

```rail
id: "apply-gateway"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "gateway.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "gatewayclass"
        text: "The resource type to display: GatewayClass, the cluster-wide object that names the controller behind a Gateway."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "gateway"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "traefik"
        text: "The namespace name."
```

```rail
id: "delete-ingress-shop"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "ingress"
        text: "The resource type."
      - token: "shop"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "route.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "httproute"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "shop"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}{\"\\n\"}{end}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
```

```rail
id: "get-gateway-listeners"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "gateway"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "shared"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "traefik"
        text: "The namespace name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .status.listeners[*]}{.name}: attachedRoutes={.attachedRoutes}{\"\\n\"}{end}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
```

```rail
id: "curl-shop-root"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "http://localhost:8080/"
        text: "The URL the command requests."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "http://localhost:8080/api/"
        text: "The URL the command requests."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"x-version: beta\""
        text: "A request header to send: x-version: beta. The HTTPRoute sends / requests that carry it to web-beta."
      - token: "http://localhost:8080/"
        text: "The URL the command requests."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: shop.example.test\""
        text: "The Host header to send: shop.example.test. The proxy picks a route by this host name."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"x-version: beta\""
        text: "A request header to send: x-version: beta. The HTTPRoute sends / requests that carry it to web-beta."
      - token: "http://localhost:8080/api/"
        text: "The URL the command requests."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "A command-line HTTP client. Flags after it control the request and where the response is written."
      - token: "-s"
        text: "Silent mode: hide the progress meter."
      - token: "-o"
        text: "Write the response body to the file that follows instead of standard output."
      - token: "/dev/null"
        text: "The null device. The body is thrown away, so only the -w output is printed."
      - token: "-w"
        text: "Write-out: after the transfer, curl prints the format string that follows."
      - token: "\"%{http_code}\\n\""
        text: "The -w format string: the HTTP status code of the response, then a newline."
      - token: "-H"
        text: "With curl, add a request header. The header text follows."
      - token: "\"Host: other.example.test\""
        text: "The Host header to send: other.example.test. No rule claims this host, so the proxy answers 404."
      - token: "http://localhost:8080/"
        text: "The URL the command requests."
```

```rail
id: "delete-route-stack"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "route.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "gateway.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "client.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "apps.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "traefik.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "ingressclass"
        text: "The resource type."
      - token: "traefik"
        text: "The object name."
```
