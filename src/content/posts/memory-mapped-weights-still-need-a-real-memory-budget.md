---
title: Memory-Mapped Weights Still Need a Real Memory Budget
description: PyTorch mmap loading delays access to checkpoint storage. Budget for resident pages, parameter copies, activations and device memory during model startup and serving.
pubDate: "2026-10-10T18:30:00Z"
section: models
tags:
  - pytorch
  - model-serving
  - memory-mapping
  - capacity-planning
draft: false
heroImage: https://media.aitamer.news/heroes/memory-mapped-weights-still-need-a-real-memory-budget-afafaf27.jpg
heroAlt: A large cream paper book on a flat slate shelf sends only a few touched pages into a small teal tray; beside it a rust vessel already holds other folded shapes. Lazy mapped pages become resident as touched while other memory still occupies capacity. Quiet layered paper room, no digits.
author: ari
wildness:
  rating: 1
  verified: torch.load mmap maps storages for lazy access; map_location controls their final device.
  claimed: The checkpoint size and serving lifecycle are illustrative, with no measured memory savings.
verdict: Measure peak host and device use across loading and real requests. A mapped checkpoint delays storage reads; it does not define the service’s peak memory.
sources:
  - title: PyTorch torch.load documentation
    url: https://docs.pytorch.org/docs/2.14/generated/torch.load.html
  - title: Linux mmap manual page
    url: https://man7.org/linux/man-pages/man2/mmap.2.html
---

A checkpoint fits on disk and `torch.load(..., mmap=True)` returns quickly. That does not establish that a voice transcription service fits in the host’s memory limit during its first real request.

[PyTorch’s `torch.load` documentation](https://docs.pytorch.org/docs/2.14/generated/torch.load.html) describes two stages for tensor storage. A normal load first brings storage into CPU memory, then moves it to the saved device or the location selected by `map_location`. With `mmap=True`, the first stage maps the file instead of copying all storage bytes immediately. Storage data is loaded lazily as it is accessed. The returned object still has metadata, and mapping does not make the eventual weight access free.

A memory map reserves an address range for file data. On Linux, the [mmap manual](https://man7.org/linux/man-pages/man2/mmap.2.html) describes that range as virtual address space and discusses page faults and file read ahead. As code touches mapped tensor data, the operating system must make the relevant pages available. A large virtual mapping is therefore different from the resident pages charged while inference runs. Cold access can also add disk I/O and latency; a fast load call says little about the first full forward pass.

Consider a hypothetical checkpoint with several gigabytes of weights. A service may map it, create a model with separately allocated parameters, copy loaded values into those parameters, and then move the model to an accelerator. During these steps, file backed pages, host parameter storage and device storage can coexist. Temporary tensors and inference activations add further demand. Their sizes and overlap depend on the actual loading path, model architecture and device, so checkpoint file size cannot serve as a peak RAM estimate.

A practical starting point for a CPU staging path is:

```python
state = torch.load(
    "model.pt", map_location="cpu", mmap=True, weights_only=True
)
model.load_state_dict(state)
model.eval()
```

This assumes a model has already been constructed and that the file contains a compatible state dictionary. `map_location="cpu"` prevents a checkpoint tagged for a GPU from immediately restoring its storages there; a later intentional move to the device still needs device memory. `weights_only=True` restricts what the unpickler accepts, but PyTorch still warns against loading untrusted files.

Budget from the lifecycle you actually deploy. Measure host resident memory and available memory before load, after load, after state assignment, after device transfer and after a representative cold and warm request. Track accelerator allocation separately. Run this under the intended worker count and memory limit, because replicated workers and request activations can dominate a promising single process load measurement. Use mapping to control when storage is read; size the service for the highest observed live phase with headroom.
