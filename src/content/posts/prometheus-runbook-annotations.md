---
title: Link every alert to its runbook with a Prometheus annotation
description: Add summary and runbook_url annotations to Prometheus alerting rules, render them in Alertmanager templates, and test them so the on-call link never goes missing.
pubDate: "2026-10-14T07:00:00Z"
specimen: 766
section: devops
tags:
  - prometheus
  - alertmanager
  - alerting
  - runbooks
  - on-call
draft: false
heroImage: https://media.aitamer.news/heroes/prometheus-runbook-annotations-81feb969.jpg
heroAlt: A red paper alarm bell is linked by a blue chain to an open cream book showing a blue wrench and a yellow gear.
author: quill
wildness:
  rating: 1
  verified: Annotations for runbook links, templating and exp_annotations are in Prometheus docs.
  claimed: runbook_url is a community naming convention; Prometheus itself defines no such field.
verdict: Cheap and worth doing on every rule, but only if the Alertmanager template renders the link, a test guards it, and the runbook it points to exists.
sources:
  - title: "Prometheus: Alerting rules"
    url: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
  - title: "Alertmanager: Notification template reference"
    url: https://prometheus.io/docs/alerting/latest/notifications/
  - title: "Alertmanager: Notification template examples"
    url: https://prometheus.io/docs/alerting/latest/notification_examples/
  - title: "Prometheus: Unit testing for rules"
    url: https://prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/
  - title: "Prometheus Monitoring Mixins: kubernetes"
    url: https://monitoring.mixins.dev/kubernetes/
  - title: "kube-prometheus issue 731: All runbook_url alert annotations point to kubernetes-mixins"
    url: https://github.com/prometheus-operator/kube-prometheus/issues/731
  - title: "helm/charts issue 19810: Allow defaultRules to configure runbook_url base path"
    url: https://github.com/helm/charts/issues/19810
  - title: kube-prometheus runbooks
    url: https://runbooks.prometheus-operator.dev/
---

An alert called `ModelServerDown` at 3 a.m. tells the person on call that something broke. It does not tell them what to check first. A Prometheus alerting rule can carry that pointer with it: an annotation holding the runbook's address travels with the alert into the notification.

This guide follows the Prometheus [alerting rules documentation](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) and the Alertmanager [notification template reference](https://prometheus.io/docs/alerting/latest/notifications/).

## Labels and annotations hold different things

The alerting rules page describes two clauses. The `labels` clause "allows specifying a set of additional labels to be attached to the alert." The `annotations` clause "specifies a set of informational labels that can be used to store longer additional information such as alert descriptions or runbook links." Keep routing data such as severity in labels. Keep text for humans, including the runbook link, in annotations.

## runbook_url is a convention

Prometheus defines no special `runbook_url` field. Its documentation only speaks of "runbook links" in general, so any annotation key works. Community rule sets use the name `runbook_url`. The kubernetes-mixin alerts published on [monitoring.mixins.dev](https://monitoring.mixins.dev/kubernetes/) attach `summary`, `description` and `runbook_url` annotations to rules such as `KubePodCrashLooping`. Using the same key keeps your rules consistent with rule sets you may import from there.

## A rule with summary, description and runbook

```yaml
groups:
- name: model-serving
  rules:
  - alert: ModelServerDown
    expr: up{job="model-server"} == 0
    for: 5m
    labels:
      severity: page
    annotations:
      summary: "Model server {{ $labels.instance }} is down"
      description: "Scrapes of {{ $labels.instance }} have failed for 5 minutes."
      runbook_url: "https://runbooks.example.com/model-serving/model-server-down"
```

The documentation explains the templating: "The `$labels` variable holds the label key/value pairs of an alert instance", and `$value` holds the evaluated value. The `summary` is a short line that fits a notification title. The `description` adds detail for the specific instance. The `runbook_url` points at one page per alert.

Annotations accept templates, so you could build the URL from labels. A literal link per rule is easier to review and to check.

## Make the notification show the link

One failure to watch for is a link that is set on the rule but missing from the notification. The rule carries the annotation, yet the chat message has no link. Alertmanager builds each message from the receiver's templates, and a template that never references the annotation never shows it.

The notification reference lists two places to read annotations. `CommonAnnotations` is the "Set of common annotations to all of the alerts" in a group. Each entry in `Alerts` has its own `Annotations`. The [notification template examples](https://prometheus.io/docs/alerting/latest/notification_examples/) show both styles.

Prefer ranging over `Alerts`. When one notification groups alerts that have different runbooks, no single `runbook_url` is common to all of them, so it is left out of `CommonAnnotations` and the link disappears from the message. Ranging prints each alert's own link:

```yaml
receivers:
- name: 'oncall-slack'
  slack_configs:
  - channel: '#oncall'
    title: "{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}"
    text: "{{ range .Alerts }}{{ .Annotations.description }}\nRunbook: {{ .Annotations.runbook_url }}\n{{ end }}"
```

This assumes your Slack webhook is configured as usual. Other receivers have their own fields; check each one's configuration to see where the link should go.

## Test that the annotation stays

A rename or a deleted line can drop the runbook link without anyone noticing. Prometheus rule [unit tests](https://prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/) catch it. The `exp_annotations` map holds the expected alert's expanded annotations. Its labels belong in the separate `exp_labels` map.

```yaml
rule_files:
- alerts.yml
evaluation_interval: 1m
tests:
- interval: 1m
  input_series:
  - series: 'up{job="model-server", instance="model-a:8080"}'
    values: '0+0x10'
  alert_rule_test:
  - eval_time: 10m
    alertname: ModelServerDown
    exp_alerts:
    - exp_labels:
        severity: page
        job: model-server
        instance: model-a:8080
      exp_annotations:
        summary: "Model server model-a:8080 is down"
        description: "Scrapes of model-a:8080 have failed for 5 minutes."
        runbook_url: "https://runbooks.example.com/model-serving/model-server-down"
```

Run it with `promtool test rules alerts_test.yml`. The documentation does not say whether `exp_annotations` may list a subset of the annotations, so list all of them. A rule that loses its link then fails in CI.

## A dead link is worse than none

Imported rule sets show the risk. In a [kube-prometheus issue](https://github.com/prometheus-operator/kube-prometheus/issues/731), a user reported that every alert's `runbook_url` pointed at the kubernetes-mixin runbook file and wrote that "runbook_url shouldn't point to non-existent runbooks." A [Helm charts issue](https://github.com/helm/charts/issues/19810) about the old prometheus-operator chart said that "the default runbook_url points to an example repository" and asked for a configurable base path.

When you import alerts, point their links at runbooks you maintain, or confirm the upstream pages exist. The prometheus-operator project runs a [runbook site](https://runbooks.prometheus-operator.dev/) whose stated goal is a "meaningful runbook for every alert in kube-prometheus project". For your own rules, a CI step that requests every `runbook_url` and fails on an error status catches broken links before a page does.

## Where this stops applying

The annotation is only a pointer. It helps when the runbook is current and reachable from the device the person on call uses; a page behind a VPN may not open on a phone. Large alert groups also produce long messages when you range over every alert, so tune Alertmanager grouping alongside the template.
