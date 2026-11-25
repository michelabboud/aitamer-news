---
title: "Kubernetes from Zero, part 20: RBAC and ServiceAccounts"
description: "Give a Pod its own identity, grant it exactly the API access it needs with Roles and bindings, and check every permission with kubectl auth can-i."
pubDate: "2026-12-01T22:00:00Z"
series: k8s-from-zero
series_order: 20
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - rbac
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-20-rbac-and-serviceaccounts-eb09bb82.jpg
heroAlt: "A muted-teal cut-paper cabin wall with five ivory doors, the middle one open onto warm yellow light and a rust-red key hanging beside it, with a slate-blue ship's wheel in the upper left."
author: desk-bot
lessonKit:
  id: k8s-20
wildness:
  rating: 1
  verified: "Roles, bindings, can-i, Pod tokens and API calls tested on kind v0.33.0, node v1.37.0, 10 Nov 2026"
  claimed: "Token rotation timing and default role contents come from kubernetes.io; we did not wait for rotation"
verdict: "Nothing is allowed until a binding says so. Give each workload its own ServiceAccount, grant the smallest Role that works, and prove it with kubectl auth can-i before you ship."
sources:
  - title: "Using RBAC Authorization (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/access-authn-authz/rbac/
  - title: "Authorization (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/access-authn-authz/authorization/
  - title: "Service Accounts (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/security/service-accounts/
  - title: "Configure Service Accounts for Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/
  - title: "Managing Service Accounts (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/
  - title: "Accessing the Kubernetes API from a Pod (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/run-application/access-api-from-pod/
  - title: "kube-apiserver command-line reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/
  - title: "Role Based Access Control Good Practices (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/security/rbac-good-practices/
---

In [part 19](https://aitamer.news/posts/k8s-from-zero-19-ingress-and-gateway-basics/) you installed Traefik with a ServiceAccount, a ClusterRole and a ClusterRoleBinding, and we promised to explain them. This is that part. You will learn how the API server decides whether a request is allowed, give a Pod its own identity, grant it exactly the access it needs, and check each permission from the command line before anything breaks. You need the kind cluster from part 3 and the `k8s-from-zero` namespace from part 4. We tested every step on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

A Pod named `inspector` asks the API server, from inside the cluster, for the list of Pods in its namespace. At first it is refused with 403 Forbidden. You then create a Role and a RoleBinding, and the same request returns the list. Along the way you grant it a built-in role in one namespace and a cluster-wide permission to read nodes, and you check each grant with `kubectl auth can-i`.

![An RBAC permission reads as a sentence: a subject (who) can use verbs (what) on resources in an API group (which) in a namespace or the whole cluster (where); a Role holds the last three and a RoleBinding joins it to the subject.](/diagrams/k8s-from-zero-20-rbac-and-serviceaccounts/who-can-do-what-on-which.svg)

## Every request is authenticated, then authorized

Each request to the API server passes two checks ([Authorization](https://kubernetes.io/docs/reference/access-authn-authz/authorization/)). Authentication answers "who are you": a client certificate, a bearer token or another configured method turns the request into a user name and a list of groups. Authorization answers "may you do this": an authorizer, on kind and most clusters RBAC (role-based access control), compares the request's verb, resource, API group and namespace with the rules granted to that user and those groups.

Ask the API server who you are with `kubectl auth whoami`. On kind your kubeconfig holds a client certificate for an admin user:

```bash rail=auth-whoami
kubectl auth whoami
```

```text
ATTRIBUTE                                           VALUE
Username                                            kubernetes-admin
Groups                                              [kubeadm:cluster-admins system:authenticated]
...
```

The group `kubeadm:cluster-admins` is bound to the built-in ClusterRole `cluster-admin`, which allows everything. That is why every command so far in this series has worked.

Kubernetes has no User object. Users and groups come from whatever authenticates them, such as certificates or an identity provider. Workloads are different: they get a ServiceAccount, a namespaced API object, and its identity looks like `system:serviceaccount:<namespace>:<name>` ([Service Accounts](https://kubernetes.io/docs/concepts/security/service-accounts/)).

RBAC itself has four object kinds ([Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)):

- A **Role** is a list of rules in one namespace. Each rule names `apiGroups` (`""` is the core group of Pods, Services and ConfigMaps; Deployments live in `apps`), `resources` and `verbs` (`get`, `list`, `watch`, `create`, `update`, `patch`, `delete`).
- A **ClusterRole** is the same, but not namespaced. It can describe cluster-scoped resources such as nodes, or be reused in many namespaces.
- A **RoleBinding** grants a Role or a ClusterRole to subjects (users, groups, ServiceAccounts) inside the binding's namespace.
- A **ClusterRoleBinding** grants a ClusterRole in every namespace and on cluster-scoped resources.

Permissions are purely additive. There are no deny rules, so a subject with no binding can do nothing beyond a few discovery calls, and the only way to take access away is to remove a grant.

## The binding decides where the rules apply

The rules say what may be done; the binding says where. A RoleBinding that references a ClusterRole grants those rules only inside the RoleBinding's namespace. That is how the built-in roles are meant to be used: `admin`, `edit` and `view` are ClusterRoles intended to be granted per namespace with a RoleBinding, while `cluster-admin` is the super-user role. `view` gives read access to most objects in a namespace but not to Secrets, because reading Secrets would expose ServiceAccount tokens and other credentials ([Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)).

![Three combinations tested in the lab: a Role with a RoleBinding grants in one namespace, a ClusterRole with a RoleBinding reuses the rules in one namespace, and a ClusterRole with a ClusterRoleBinding grants everywhere, including nodes.](/diagrams/k8s-from-zero-20-rbac-and-serviceaccounts/role-vs-clusterrole-scope.svg)

Two rules of the API are worth knowing before they surprise you. A binding's `roleRef` cannot be changed after creation; to point a binding at a different role, delete it and create a new one. And a ClusterRoleBinding can only reference a ClusterRole. We tried a ClusterRoleBinding with `kind: Role` in its `roleRef`, and the API refused it:

```text
The ClusterRoleBinding "try-role-in-crb" is invalid: roleRef.kind: Unsupported value: "Role": supported values: "ClusterRole"
```

## A ServiceAccount is a Pod's identity

Every namespace has a ServiceAccount named `default`, and a Pod that does not name one gets it. The `default` ServiceAccount has no permissions beyond API discovery ([Service Accounts](https://kubernetes.io/docs/concepts/security/service-accounts/)). Give each app its own ServiceAccount with `spec.serviceAccountName`, so that you can grant it exactly what it needs and nothing leaks to other Pods in the namespace.

The credential arrives as a file. The ServiceAccount admission controller adds a projected volume named `kube-api-access-<suffix>` to the Pod, and the kubelet fills it with three files under `/var/run/secrets/kubernetes.io/serviceaccount`: `token`, `ca.crt` (from the ConfigMap `kube-root-ca.crt` that exists in every namespace) and `namespace` ([Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)). The token is a JWT (a signed JSON document) that the kubelet gets from the TokenRequest API. It is bound to this Pod, has the API server as its audience, and the kubelet replaces it when it is older than 80 percent of its lifetime or older than 24 hours ([Configure Service Accounts for Pods](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)). Long-lived token Secrets are the old mechanism; since v1.24 they are no longer created automatically.

![The Pod names its ServiceAccount, the kubelet mounts a token, ca.crt and namespace file, the app sends the token as a Bearer header, the API server authenticates it as system:serviceaccount:k8s-from-zero:inspector, and RBAC returns 403 or 200 depending on the bindings.](/diagrams/k8s-from-zero-20-rbac-and-serviceaccounts/pod-identity-via-serviceaccount.svg)

A Pod that never talks to the API server does not need the token at all. Set `automountServiceAccountToken: false` in the Pod spec (or on the ServiceAccount; the Pod setting wins).

## Try it: give a Pod exactly the access it needs

1. Create the ServiceAccount and a Pod that uses it. The image has curl in it. Save this as `inspector.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: inspector
  namespace: k8s-from-zero
---
apiVersion: v1
kind: Pod
metadata:
  name: inspector
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: inspector
spec:
  serviceAccountName: inspector
  containers:
    - name: curl
      image: curlimages/curl:8.23.0
      command: ["sleep", "3600"]
```

```bash rail=apply-inspector-yaml-wait-pod-inspector
kubectl apply -f inspector.yaml
kubectl wait --for=condition=Ready pod/inspector -n k8s-from-zero --timeout=60s
kubectl get pod inspector -n k8s-from-zero -o jsonpath='{.spec.serviceAccountName}{"\n"}'
kubectl exec -n k8s-from-zero inspector -- ls /var/run/secrets/kubernetes.io/serviceaccount
```

```text
serviceaccount/inspector created
pod/inspector created
pod/inspector condition met
inspector
ca.crt
namespace
token
```

2. Check the identity and its permissions from outside. `--as` makes kubectl impersonate another subject; your admin user is allowed to do that:

```bash rail=auth-whoami-as-auth
kubectl auth whoami --as=system:serviceaccount:k8s-from-zero:inspector
kubectl auth can-i list pods -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
```

```text
ATTRIBUTE   VALUE
Username    system:serviceaccount:k8s-from-zero:inspector
Groups      [system:serviceaccounts system:serviceaccounts:k8s-from-zero system:authenticated]
no
```

3. Call the API from inside the Pod. This script reads the three mounted files and asks for the Pods in the Pod's own namespace. `kubernetes.default.svc` is the Service in front of the API server that every cluster has. Save it as `ask.sh`:

```bash rail=run-inside-inspector-pod
# Run inside the inspector Pod: list Pods in its own namespace through the API
SA=/var/run/secrets/kubernetes.io/serviceaccount
NS=$(cat $SA/namespace)
curl -s --cacert $SA/ca.crt -H "Authorization: Bearer $(cat $SA/token)" \
  https://kubernetes.default.svc/api/v1/namespaces/$NS/pods
```

```bash rail=exec-k8s-from-zero-inspector-sh
kubectl exec -n k8s-from-zero -i inspector -- sh < ask.sh
```

```text
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "pods is forbidden: User \"system:serviceaccount:k8s-from-zero:inspector\" cannot list resource \"pods\" in API group \"\" in the namespace \"k8s-from-zero\"",
  "reason": "Forbidden",
  "details": {
    "kind": "pods"
  },
  "code": 403
}
```

Read the message as the RBAC sentence: who (`system:serviceaccount:k8s-from-zero:inspector`), what (`list`), which (`pods` in API group `""`), where (`k8s-from-zero`). Every RBAC error has this shape, and it tells you exactly which rule is missing.

4. Grant it. Save this as `pod-reader.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: k8s-from-zero
rules:
  - apiGroups: [""]          # "" is the core API group: Pods, Services, ConfigMaps...
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: inspector-reads-pods
  namespace: k8s-from-zero
subjects:
  - kind: ServiceAccount
    name: inspector
    namespace: k8s-from-zero
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
```

You can also generate the same objects: `kubectl create role pod-reader --verb=get,list,watch --resource=pods -n k8s-from-zero --dry-run=client -o yaml` and `kubectl create rolebinding inspector-reads-pods --role=pod-reader --serviceaccount=k8s-from-zero:inspector -n k8s-from-zero --dry-run=client -o yaml` print equivalent YAML.

```bash rail=apply-pod-reader-yaml-auth-can-i
kubectl apply -f pod-reader.yaml
kubectl auth can-i list pods -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
kubectl exec -n k8s-from-zero -i inspector -- sh < ask.sh | grep -E '^  "kind"|^        "name"'
```

```text
role.rbac.authorization.k8s.io/pod-reader created
rolebinding.rbac.authorization.k8s.io/inspector-reads-pods created
yes
  "kind": "PodList",
        "name": "inspector",
```

The `grep` keeps only the list's kind and the Pod names. Now check the edges of the grant. The Role allows reading Pods in one namespace, so deleting them, reading them elsewhere, or reading anything else is still refused:

```bash rail=auth-can-i-delete-pods
kubectl auth can-i delete pods -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
kubectl auth can-i list pods -n kube-system --as=system:serviceaccount:k8s-from-zero:inspector
kubectl auth can-i list services -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
kubectl auth can-i list nodes --as=system:serviceaccount:k8s-from-zero:inspector
```

```text
no
no
no
Warning: resource 'nodes' is not namespace scoped

no
```

5. Reuse a built-in ClusterRole in one namespace. Save this as `view-in-namespace.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: inspector-views
  namespace: k8s-from-zero
subjects:
  - kind: ServiceAccount
    name: inspector
    namespace: k8s-from-zero
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole        # a built-in ClusterRole, granted only in this namespace
  name: view
```

```bash rail=apply-view-in-namespace-yaml-auth-can-i
kubectl apply -f view-in-namespace.yaml
kubectl auth can-i list services -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
kubectl auth can-i list services -n kube-system --as=system:serviceaccount:k8s-from-zero:inspector
kubectl auth can-i get secrets -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
```

```text
rolebinding.rbac.authorization.k8s.io/inspector-views created
yes
no
no
```

Services are readable here and not in `kube-system`, and Secrets stay hidden, as the `view` role promises.

6. Grant a cluster-scoped permission. Nodes do not belong to any namespace, so only a ClusterRole with a ClusterRoleBinding can grant them. Save this as `node-reader.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: inspector-reads-nodes
subjects:
  - kind: ServiceAccount
    name: inspector
    namespace: k8s-from-zero
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: node-reader
```

```bash rail=apply-node-reader-yaml-auth-can-i
kubectl apply -f node-reader.yaml
kubectl auth can-i list nodes --as=system:serviceaccount:k8s-from-zero:inspector
```

```text
clusterrole.rbac.authorization.k8s.io/node-reader created
clusterrolebinding.rbac.authorization.k8s.io/inspector-reads-nodes created
Warning: resource 'nodes' is not namespace scoped

yes
```

To see everything a subject may do in a namespace, list it:

```bash rail=auth-can-i-list-k8s-from-zero
kubectl auth can-i --list -n k8s-from-zero --as=system:serviceaccount:k8s-from-zero:inspector
```

```text
Resources                                       Non-Resource URLs                      Resource Names   Verbs
selfsubjectreviews.authentication.k8s.io        []                                     []               [create]
selfsubjectaccessreviews.authorization.k8s.io   []                                     []               [create]
selfsubjectrulesreviews.authorization.k8s.io    []                                     []               [create]
bindings                                        []                                     []               [get list watch]
configmaps                                      []                                     []               [get list watch]
...
nodes                                           []                                     []               [get list watch]
...
pods                                            []                                     []               [get list watch]
...
services                                        []                                     []               [get list watch]
...
```

7. Look inside the tokens. A JWT has three parts separated by dots; the middle part is base64-encoded JSON. `kubectl create token` asks the TokenRequest API for a short-lived token you can use from outside the cluster:

```bash rail=create-token-inspector-k8s-from-zero
kubectl create token inspector -n k8s-from-zero --duration=10m | cut -d. -f2 | base64 -d 2>/dev/null; echo
```

```text
{"aud":["https://kubernetes.default.svc.cluster.local"],"exp":1794346654,"iat":1794346054,"iss":"https://kubernetes.default.svc.cluster.local","jti":"1bf4f958-5e0e-4767-afa3-708ee7a91b5d","kubernetes.io":{"namespace":"k8s-from-zero","serviceaccount":{"name":"inspector","uid":"a2d5ea4d-a171-4964-babd-e17f58acfd3c"}},"nbf":1794346054,"sub":"system:serviceaccount:k8s-from-zero:inspector"}
```

`exp` minus `iat` is 600 seconds, the 10 minutes you asked for. (`base64 -d` may complain about missing padding; `2>/dev/null` hides that.) Now the token the kubelet mounted in the Pod:

```bash rail=exec-k8s-from-zero-inspector-sh-2
kubectl exec -n k8s-from-zero inspector -- sh -c 'cut -d. -f2 /var/run/secrets/kubernetes.io/serviceaccount/token | base64 -d 2>/dev/null; echo'
```

```text
{"aud":["https://kubernetes.default.svc.cluster.local"],"exp":1825882023,"iat":1794346023,"iss":"https://kubernetes.default.svc.cluster.local","jti":"f9c21ca6-0bfb-44bb-8711-3216a53aebcb","kubernetes.io":{"namespace":"k8s-from-zero","node":{"name":"k8s-ep19-control-plane","uid":"0359fb81-13ac-4ee9-8cfd-edc402b0fd22"},"pod":{"name":"inspector","uid":"9d2325a0-a32a-4d5a-ac62-9b52bb35991a"},"serviceaccount":{"name":"inspector","uid":"a2d5ea4d-a171-4964-babd-e17f58acfd3c"},"warnafter":1794349630},"nbf":1794346023,"sub":"system:serviceaccount:k8s-from-zero:inspector
```

This one names the Pod and the node it is bound to. Its `exp` is a year after `iat`, which looks wrong for a short-lived token. The explanation is `warnafter`: 3,607 seconds after `iat`, matching the `expirationSeconds: 3607` in the Pod's projected volume. The API server flag `--service-account-extend-token-expiration` (default true) extends tokens injected by admission up to one year, so that old clients that never reload the file keep working during the move from legacy tokens; `warnafter` marks where the real one-hour lifetime ends ([kube-apiserver reference](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/), [Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)). Your app should still reload the token file regularly; the docs suggest every few minutes is good enough. (The last characters of the output are cut off because the unpadded base64 ends early; the claims you need are all there.)

8. Turn the token off where it is not needed. Save this as `no-token.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: no-token
  namespace: k8s-from-zero
spec:
  automountServiceAccountToken: false
  containers:
    - name: app
      image: busybox:1.37
      command: ["sleep", "3600"]
```

```bash rail=apply-no-token-yaml-exec-k8s-from-zero
kubectl apply -f no-token.yaml
kubectl exec -n k8s-from-zero no-token -- ls /var/run/secrets/kubernetes.io/serviceaccount
kubectl get pod no-token -n k8s-from-zero -o jsonpath='{.spec.serviceAccountName}{"\n"}'
```

```text
pod/no-token created
ls: /var/run/secrets/kubernetes.io/serviceaccount: No such file or directory
command terminated with exit code 1
default
```

The Pod still runs as the `default` ServiceAccount, but it has no credential to prove it.

9. Clean up:

```bash rail=delete-no-token-yaml-view-in-namespace-yaml-node-reader-yaml
kubectl delete -f no-token.yaml -f view-in-namespace.yaml -f node-reader.yaml -f pod-reader.yaml -f inspector.yaml
```

## When it goes wrong

- **A Role looks right but `can-i` says no.** Check `apiGroups`. We wrote a Role for `deployments` with `apiGroups: [""]` and bound it to a ServiceAccount `helper`; `kubectl auth can-i list deployments` answered `no`. `kubectl api-resources` shows where a resource lives:

```text
NAME                                SHORTNAMES   APIVERSION                        NAMESPACED   KIND
deployments                         deploy       apps/v1                           true         Deployment
```

`apps/v1` means the group is `apps`. After patching the rule to `apiGroups: ["apps"]` the same check answered `yes`.

- **You cannot point a binding at another role.** Changing `roleRef` fails:

```text
The RoleBinding "helper-reads-deployments" is invalid: roleRef: Invalid value: {"APIGroup":"rbac.authorization.k8s.io","Kind":"Role","Name":"pod-reader"}: field is immutable
```

Delete the binding and create a new one. The docs explain why: this way, permission to update a binding does not quietly become permission to grant any role.

- **The binding exists, the subject still has no access.** A ServiceAccount subject needs the namespace of the ServiceAccount, which is not always the binding's namespace. We ran `kubectl create rolebinding helper-wrong-ns -n k8s-from-zero --role=pod-reader --serviceaccount=default:helper`. The binding was created, but it grants a ServiceAccount `helper` in the namespace `default`, and ours lives in `k8s-from-zero`, so `can-i` stayed at `no`. `kubectl get rolebinding -o wide` shows the subject as `default/helper`, which gives it away.

- **An app logs 403 Forbidden.** Read the message as the RBAC sentence, as in step 3, then reproduce it with `kubectl auth can-i <verb> <resource> -n <namespace> --as=system:serviceaccount:<namespace>:<name>`. Grant the missing verb and resource with the smallest Role that works. The [RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) page lists what to avoid, such as wildcard rules and granting `cluster-admin` to workloads.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Who am I | `kubectl auth whoami` | add `--as=...` to check another subject |
| Can I do it | `kubectl auth can-i list pods -n NS` | answers yes or no |
| Can a ServiceAccount do it | `kubectl auth can-i VERB RES -n NS --as=system:serviceaccount:NS:NAME` | needs impersonate permission |
| Everything a subject may do | `kubectl auth can-i --list -n NS --as=...` | per namespace |
| Create a ServiceAccount | `kubectl create serviceaccount NAME -n NS` | one per app |
| Use it in a Pod | `spec.serviceAccountName: NAME` | default is `default` |
| No token in the Pod | `automountServiceAccountToken: false` | Pod setting beats ServiceAccount |
| Generate a Role | `kubectl create role NAME --verb=get,list --resource=pods --dry-run=client -o yaml` | namespaced |
| Generate a RoleBinding | `kubectl create rolebinding NAME --role=R --serviceaccount=NS:SA` | or `--clusterrole=view` |
| Cluster-wide grant | ClusterRole + ClusterRoleBinding | needed for nodes |
| Find a resource's API group | `kubectl api-resources` | `apps/v1` means group `apps` |
| Short-lived token | `kubectl create token SA -n NS --duration=10m` | TokenRequest API |
| Token files in a Pod | `/var/run/secrets/kubernetes.io/serviceaccount/` | token, ca.crt, namespace |
| Change a binding's role | delete and recreate | `roleRef` is immutable |

Minimal Role and RoleBinding:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: k8s-from-zero
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: inspector-reads-pods
  namespace: k8s-from-zero
subjects:
  - kind: ServiceAccount
    name: inspector
    namespace: k8s-from-zero
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
```

## Recap and what is next

- Each API request is authenticated (who) and then authorized by RBAC (may they). Permissions only add up; there are no deny rules.
- Roles and ClusterRoles hold rules; RoleBindings grant them in one namespace, ClusterRoleBindings everywhere. A ClusterRole plus a RoleBinding is how you reuse `view`, `edit` and `admin` per namespace.
- A ServiceAccount is a Pod's identity. Its token is mounted by the kubelet, bound to the Pod, and rotated; turn it off with `automountServiceAccountToken: false` when the app does not call the API.
- Read a 403 message as who, what, which, where, and reproduce it with `kubectl auth can-i --as`.

Next: part 21, troubleshooting Pods, where you will break Pods in six common ways and fix each one. Coming tomorrow.

```rail
id: "auth-whoami"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "whoami"
        text: "Show the subject the current credentials authenticate as."
```

```rail
id: "apply-inspector-yaml-wait-pod-inspector"
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
      - token: "inspector.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=Ready"
        text: "The condition to wait for. This command passes condition=Ready."
      - token: "pod/inspector"
        text: "The resource written as type/name: pod/inspector."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "inspector"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.spec.serviceAccountName}{\"\\n\"}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "inspector"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "ls"
        text: "Shell. Lists files."
      - token: "/var/run/secrets/kubernetes.io/serviceaccount"
        text: "An argument of the command in this lesson."
```

```rail
id: "auth-whoami-as-auth"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "whoami"
        text: "Show the subject the current credentials authenticate as."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
```

```rail
id: "run-inside-inspector-pod"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "#"
        text: "A shell comment. The shell does not run this line."
      - token: "Run"
        text: "An argument of the command in this lesson."
      - token: "inside"
        text: "An argument of the command in this lesson."
      - token: "the"
        text: "An argument of the command in this lesson."
      - token: "inspector"
        text: "An argument of the command in this lesson."
      - token: "Pod:"
        text: "An argument of the command in this lesson."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "Pods"
        text: "An argument of the command in this lesson."
      - token: "in"
        text: "Shell. Words of a for-loop."
      - token: "its"
        text: "An argument of the command in this lesson."
      - token: "own"
        text: "An argument of the command in this lesson."
      - token: "namespace"
        text: "The resource type."
      - token: "through"
        text: "The object name."
      - token: "the"
        text: "An argument of the command in this lesson."
      - token: "API"
        text: "An argument of the command in this lesson."
      - token: "SA=/var/run/secrets/kubernetes.io/serviceaccount"
        text: "The resource written as type/name: SA=/var/run/secrets/kubernetes.io/serviceaccount."
      - token: "NS=$(cat"
        text: "A shell assignment, or a key=value argument, used by the command around it."
      - token: "$SA/namespace)"
        text: "The resource written as type/name: $SA/namespace)."
      - token: "curl"
        text: "An HTTP client. The lesson uses it to send a request and print the answer."
      - token: "-s"
        text: "With curl, silent mode. Do not print the progress meter."
      - token: "--cacert"
        text: "An argument of the command in this lesson."
      - token: "$SA/ca.crt"
        text: "The resource written as type/name: $SA/ca.crt."
      - token: "-H"
        text: "With curl, add a request header."
      - token: "\"Authorization: Bearer $(cat $SA/token)\""
        text: "The header value passed to curl or wget."
      - token: "https://kubernetes.default.svc/api/v1/namespaces/$NS/pods"
        text: "The URL this command requests."
```

```rail
id: "exec-k8s-from-zero-inspector-sh"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-i"
        text: "Short form of --stdin. Pass standard input to the container."
      - token: "inspector"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "sh"
        text: "A shell. The lesson uses it to run the command that follows."
      - token: "<"
        text: "An argument of the command in this lesson."
      - token: "ask.sh"
        text: "The file this flag or redirection names."
```

```rail
id: "apply-pod-reader-yaml-auth-can-i"
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
      - token: "pod-reader.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-i"
        text: "Short form of --stdin. Pass standard input to the container."
      - token: "inspector"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "sh"
        text: "A shell. The lesson uses it to run the command that follows."
      - token: "<"
        text: "An argument of the command in this lesson."
      - token: "ask.sh"
        text: "The file this flag or redirection names."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-E"
        text: "With grep, treat the pattern as an extended regular expression."
      - token: "'^  \"kind\"|^        \"name\"'"
        text: "The pattern grep looks for."
```

```rail
id: "auth-can-i-delete-pods"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "kube-system"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "services"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "nodes"
        text: "The resource type."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
```

```rail
id: "apply-view-in-namespace-yaml-auth-can-i"
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
      - token: "view-in-namespace.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "services"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "services"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "kube-system"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "secrets"
        text: "An argument of the command in this lesson."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
```

```rail
id: "apply-node-reader-yaml-auth-can-i"
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
      - token: "node-reader.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "list"
        text: "An argument of the command in this lesson."
      - token: "nodes"
        text: "The resource type."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
```

```rail
id: "auth-can-i-list-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "auth"
        text: "The command group for authorization checks."
      - token: "can-i"
        text: "Check whether an action is allowed. It prints yes or no."
      - token: "--list"
        text: "With auth can-i, list the actions the subject is allowed to take."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--as=system:serviceaccount:k8s-from-zero:inspector"
        text: "Impersonate this subject for the request. The lesson uses it to test a ServiceAccount."
```

```rail
id: "create-token-inspector-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from flags."
      - token: "token"
        text: "Request a token for a ServiceAccount."
      - token: "inspector"
        text: "An argument of the command in this lesson."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--duration=10m"
        text: "How long the requested token stays valid. This command passes 10m."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "cut"
        text: "Shell. Selects fields from each line."
      - token: "-d."
        text: "An argument of the command in this lesson."
      - token: "-f2"
        text: "With cut, print the second field."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "base64"
        text: "Shell. Decodes base64 when given -d. The lesson uses it on the middle part of a token."
      - token: "-d"
        text: "With cut, use this character as the field separator."
      - token: "2>/dev/null"
        text: "The resource written as type/name: 2/dev/null."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "echo"
        text: "Shell. Prints its arguments."
```

```rail
id: "exec-k8s-from-zero-inspector-sh-2"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "inspector"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "sh"
        text: "A shell. The lesson uses it to run the command that follows."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "'cut -d. -f2 /var/run/secrets/kubernetes.io/serviceaccount/token | base64 -d 2>/dev/null; echo'"
        text: "The container name."
```

```rail
id: "apply-no-token-yaml-exec-k8s-from-zero"
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
      - token: "no-token.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "no-token"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "ls"
        text: "Shell. Lists files."
      - token: "/var/run/secrets/kubernetes.io/serviceaccount"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "no-token"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.spec.serviceAccountName}{\"\\n\"}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "delete-no-token-yaml-view-in-namespace-yaml-node-reader-yaml"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "no-token.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "view-in-namespace.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "node-reader.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "pod-reader.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "inspector.yaml"
        text: "The file this flag or redirection names."
```
