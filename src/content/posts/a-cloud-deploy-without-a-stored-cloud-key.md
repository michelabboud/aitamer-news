---
title: A Cloud Deploy Without a Stored Cloud Key
description: A GitHub Actions job can use OpenID Connect to obtain short-lived AWS credentials. The role trust policy decides which job may deploy.
pubDate: "2026-10-04T17:30:00Z"
specimen: 229
section: devops
tags:
  - github-actions
  - openid-connect
  - aws
  - deployment
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/a-cloud-deploy-without-a-stored-cloud-key-34450e8b.jpg
heroAlt: An identity badge passes through a guarded doorway and receives a short-lived key for cloud servers.
author: ari
wildness:
  rating: 2
  verified: GitHub and AWS document the token exchange, role trust conditions, and job permissions.
  claimed: A scoped role can replace a stored AWS key for this deployment job.
verdict: The deploy can use short-lived AWS credentials when the role trust matches the repository's actual subject and its permissions cover only the deployment target.
sources:
  - title: OpenID Connect — GitHub Docs
    url: https://docs.github.com/en/actions/concepts/security/openid-connect
  - title: Configuring OpenID Connect in Amazon Web Services — GitHub Docs
    url: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
  - title: OpenID Connect reference — GitHub Docs
    url: https://docs.github.com/en/actions/reference/security/oidc
  - title: Managing environments for deployment — GitHub Docs
    url: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
  - title: Create a role for OpenID Connect federation — AWS IAM
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html
---

A deployment job needs permission to change a cloud resource. A stored access key can provide that permission, but it also gives the repository a credential that must be created, copied into a secret, rotated, and eventually removed. [GitHub's OpenID Connect overview](https://docs.github.com/en/actions/concepts/security/openid-connect) describes another path: the job presents a token that identifies its workflow run, and the cloud provider issues short-lived access for that run.

## How the exchange works

OpenID Connect (OIDC) gives the job a way to prove its identity. GitHub issues a JSON Web Token with claims about the job. The cloud provider checks those claims against a trust policy. If they match, the provider issues a short-lived credential for the assigned cloud role. The deployment command then uses that credential. [GitHub documents the sequence](https://docs.github.com/en/actions/concepts/security/openid-connect).

The identity token and the cloud credential have different jobs. The GitHub token says which workflow is asking. The cloud credential authorizes specific cloud operations. AWS Identity and Access Management (IAM) uses a role trust policy to decide who may assume a role, and a separate permissions policy to decide what that role may do. [AWS explains those two policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html). This separation matters when a deploy should write to one destination.

## Set the AWS trust boundary

For an AWS example, register GitHub's issuer, `https://token.actions.githubusercontent.com`, as an OIDC identity provider in IAM. Set its audience to `sts.amazonaws.com` when using the AWS credentials action. Then create a web identity role. [GitHub's AWS guide](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) gives these values, and [AWS describes the role setup](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html).

The role's trust policy should require that audience and an exact `sub` value for the intended repository and branch. Here is the core of that policy. Replace the account ID and subject placeholder with values from your setup:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "YOUR_EXACT_SUBJECT"
      }
    }
  }]
}
```

The placeholder is deliberate. GitHub documents more than one default subject format. Some repositories use a subject with owner and repository IDs; others use names. An environment changes the subject context as well. Match the actual format for your repository instead of copying a sample string. [GitHub's OIDC reference](https://docs.github.com/en/actions/reference/security/oidc) shows the formats. AWS recommends restricting `sub` to specific repositories or branches and warns that a broad value can expose the role to repositories you do not control. [AWS details the trust check](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html).

Attach a permissions policy that grants only the cloud actions and resources the deployment needs. For an object upload, the role needs permission to write the intended object path. The trust policy answers which job can enter; the permissions policy limits what it can change after entry. [AWS describes the split](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html).

## Give the job permission to request a token

A GitHub Actions job needs `id-token: write` to request its OIDC token. That setting does not give the job write access to repository content or AWS resources. The AWS credentials action uses the token to request AWS credentials for the role. [GitHub's AWS guide](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) shows the job permissions and exchange.

```yaml
name: Deploy site
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v6
      - uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
        with:
          role-to-assume: arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_DEPLOY_ROLE
          aws-region: YOUR_REGION
      - run: aws s3 cp ./index.html s3://YOUR_BUCKET/index.html
```

This is a small upload example. Replace the role, region, bucket, and file path. The AWS role still needs a permissions policy for the target. `contents: read` supports checkout; `id-token: write` lets the job request an identity token. The action revisions and upload command follow [GitHub's AWS workflow example](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws). Review action revisions when maintaining the workflow.

## Check the boundary around deployment

A branch filter on the workflow and the role's subject condition should agree. If the job uses a GitHub environment, the subject must reference that environment, and the environment should restrict which branches or tags may deploy. [GitHub's AWS guide](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) explains the changed subject, while [GitHub's environment guide](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) shows deployment branch rules.

If role assumption fails, inspect the expected audience and subject before widening trust. GitHub provides an [OIDC claim debugging method](https://docs.github.com/en/actions/reference/security/oidc) that shows the claims a job would send. Compare those claims with the IAM role policy. A mismatch can result from the repository's subject format or an environment context. Keep the condition precise once the values match.

## What to do

1. Pick one deployment job and identify the exact cloud actions and resource paths it needs.
2. Register GitHub's OIDC provider in IAM. Create a role with a narrow permissions policy and a trust policy that matches the job's actual `aud` and `sub` claims.
3. Give that job `id-token: write`, configure the AWS credentials action with the role ARN, and run the deploy from the intended branch.
4. Confirm the deploy succeeds, then check that a job outside the allowed subject cannot assume the role. Remove the old stored cloud key from this deployment path after the new path works.
